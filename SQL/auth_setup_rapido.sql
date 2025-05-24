-- Script simplificado para criar o esquema de autenticau00e7u00e3o e a tabela de usuu00e1rios

-- Criar schema de autenticau00e7u00e3o
CREATE DATABASE IF NOT EXISTS lms_database;
USE lms_database;

-- Criar schema de autenticau00e7u00e3o
CREATE SCHEMA IF NOT EXISTS auth;

-- Tabela de usuu00e1rios
CREATE TABLE IF NOT EXISTS auth.users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trigger para criar perfil automaticamente quando um usuu00e1rio u00e9 criado
DELIMITER //
CREATE TRIGGER IF NOT EXISTS auth.tr_create_profile_after_user_registration
AFTER INSERT ON auth.users
FOR EACH ROW
BEGIN
    -- Verifica se ju00e1 existe um perfil para este usuu00e1rio
    IF NOT EXISTS (SELECT 1 FROM learning_platform.profiles WHERE id = NEW.id) THEN
        -- Cria um novo perfil
        INSERT INTO learning_platform.profiles (
            id, 
            name, 
            email, 
            role
        ) VALUES (
            NEW.id, 
            COALESCE(NEW.username, 'Usuu00e1rio'), 
            NEW.email, 
            CASE WHEN NEW.role = 'admin' THEN 'admin' ELSE 'student' END
        );
    END IF;
END //
DELIMITER ;

-- Inserir um usuu00e1rio administrador para teste
INSERT INTO auth.users (id, email, encrypted_password, username, role)
VALUES (
  UUID(), 
  'admin@example.com', 
  '$2b$10$X/hX5qW0g1vQx9qUwfzQ0.6FULtqZg9XEBSHoqyKiIlfLT1IYL3.q', -- senha: admin123
  'Administrador', 
  'admin'
);

-- Inserir um usuu00e1rio estudante para teste
INSERT INTO auth.users (id, email, encrypted_password, username, role)
VALUES (
  UUID(), 
  'student@example.com', 
  '$2b$10$X/hX5qW0g1vQx9qUwfzQ0.6FULtqZg9XEBSHoqyKiIlfLT1IYL3.q', -- senha: admin123
  'Estudante', 
  'student'
);
