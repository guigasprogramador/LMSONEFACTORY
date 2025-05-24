-- Script para criar o esquema de autenticação no MySQL da Azure

-- Criar schema de autenticação
CREATE DATABASE IF NOT EXISTS lms_database;
USE lms_database;

-- Criar schema de autenticação
CREATE SCHEMA IF NOT EXISTS auth;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS auth.users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  last_sign_in_at TIMESTAMP NULL,
  confirmed_at TIMESTAMP NULL,
  user_metadata JSON DEFAULT (JSON_OBJECT())
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS auth.sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de perfis (no schema public)
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NULL,
  avatar_url VARCHAR(255) NULL,
  bio TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Função para gerar UUID v4
DELIMITER //
CREATE FUNCTION IF NOT EXISTS uuid_v4() 
RETURNS CHAR(36)
DETERMINISTIC
BEGIN
    RETURN LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)),
        '-', HEX(RANDOM_BYTES(2)),
        '-4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3),
        '-', HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3),
        '-', HEX(RANDOM_BYTES(6))
    ));
END //
DELIMITER ;

-- Trigger para criar perfil automaticamente quando um usuário é criado
DELIMITER //
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.user_metadata, '$.name')), NEW.email), 
    JSON_UNQUOTE(JSON_EXTRACT(NEW.user_metadata, '$.avatar'))
  );
END //
DELIMITER ;

-- Função para gerar hash de senha
DELIMITER //
CREATE FUNCTION IF NOT EXISTS auth.hash_password(password VARCHAR(255))
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
  RETURN PASSWORD(CONCAT('lms_salt_', password));
END //
DELIMITER ;

-- Função para verificar senha
DELIMITER //
CREATE FUNCTION IF NOT EXISTS auth.verify_password(password VARCHAR(255), hashed_password VARCHAR(255))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  RETURN auth.hash_password(password) = hashed_password;
END //
DELIMITER ;

-- Procedimento para autenticar usuário
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.authenticate(IN p_email VARCHAR(255), IN p_password VARCHAR(255))
BEGIN
  DECLARE user_id CHAR(36);
  DECLARE user_email VARCHAR(255);
  DECLARE user_role VARCHAR(50);
  DECLARE user_created_at TIMESTAMP;
  DECLARE user_password VARCHAR(255);
  
  -- Buscar usuário pelo email
  SELECT id, email, role, created_at, encrypted_password 
  INTO user_id, user_email, user_role, user_created_at, user_password
  FROM auth.users 
  WHERE email = p_email LIMIT 1;
  
  -- Verificar se o usuário existe
  IF user_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuário não encontrado';
  END IF;
  
  -- Verificar senha
  IF NOT auth.verify_password(p_password, user_password) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Senha incorreta';
  END IF;
  
  -- Atualizar último login
  UPDATE auth.users SET 
    last_sign_in_at = CURRENT_TIMESTAMP
  WHERE id = user_id;
  
  -- Retornar dados do usuário
  SELECT * FROM auth.users WHERE id = user_id;
  
END //
DELIMITER ;

-- Procedimento para criar usuário
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.create_user(
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_role VARCHAR(50),
  IN p_metadata JSON
)
BEGIN
  DECLARE new_user_id CHAR(36);
  
  -- Gerar UUID para o novo usuário
  SET new_user_id = uuid_v4();
  
  -- Inserir novo usuário
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    role,
    user_metadata,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    p_email,
    auth.hash_password(p_password),
    COALESCE(p_role, 'student'),
    COALESCE(p_metadata, JSON_OBJECT()),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- Retornar dados do usuário criado
  SELECT * FROM auth.users WHERE id = new_user_id;
  
END //
DELIMITER ;

-- Procedimento para criar sessão
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.create_session(IN p_user_id CHAR(36), IN p_expires_in_seconds INT)
BEGIN
  DECLARE new_session_id CHAR(36);
  DECLARE token_value VARCHAR(255);
  DECLARE expiry_time TIMESTAMP;
  
  -- Gerar UUID para a nova sessão
  SET new_session_id = uuid_v4();
  
  -- Gerar token aleatório
  SET token_value = SHA2(CONCAT(new_session_id, RAND(), CURRENT_TIMESTAMP), 256);
  
  -- Calcular data de expiração
  SET expiry_time = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL p_expires_in_seconds SECOND);
  
  -- Inserir nova sessão
  INSERT INTO auth.sessions (
    id,
    user_id,
    token,
    created_at,
    expires_at
  ) VALUES (
    new_session_id,
    p_user_id,
    token_value,
    CURRENT_TIMESTAMP,
    expiry_time
  );
  
  -- Retornar dados da sessão criada
  SELECT * FROM auth.sessions WHERE id = new_session_id;
  
END //
DELIMITER ;

-- Procedimento para validar sessão
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.validate_session(IN p_token VARCHAR(255))
BEGIN
  DECLARE session_user_id CHAR(36);
  DECLARE session_expires_at TIMESTAMP;
  
  -- Buscar sessão pelo token
  SELECT user_id, expires_at 
  INTO session_user_id, session_expires_at
  FROM auth.sessions 
  WHERE token = p_token LIMIT 1;
  
  -- Verificar se a sessão existe
  IF session_user_id IS NULL THEN
    SELECT NULL as user_id, FALSE as valid, TRUE as expired;
  ELSE
    -- Verificar se a sessão expirou
    IF session_expires_at < CURRENT_TIMESTAMP THEN
      SELECT session_user_id as user_id, TRUE as valid, TRUE as expired;
    ELSE
      SELECT session_user_id as user_id, TRUE as valid, FALSE as expired;
    END IF;
  END IF;
  
END //
DELIMITER ;

-- Procedimento para obter usuário por ID
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.get_user_by_id(IN p_user_id CHAR(36))
BEGIN
  SELECT * FROM auth.users WHERE id = p_user_id;
END //
DELIMITER ;

-- Procedimento para atualizar metadados do usuário
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.update_user_metadata(IN p_user_id CHAR(36), IN p_metadata JSON)
BEGIN
  UPDATE auth.users SET 
    user_metadata = p_metadata,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;
  
  SELECT * FROM auth.users WHERE id = p_user_id;
END //
DELIMITER ;

-- Procedimento para listar todos os usuários (apenas para administradores)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS auth.list_users()
BEGIN
  SELECT * FROM auth.users ORDER BY created_at DESC;
END //
DELIMITER ;
