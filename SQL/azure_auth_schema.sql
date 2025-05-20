-- Script para criar o esquema de autenticau00e7u00e3o no PostgreSQL da Azure

-- Criar schema de autenticau00e7u00e3o
CREATE SCHEMA IF NOT EXISTS auth;

-- Tabela de usuu00e1rios
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  user_metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de sessu00f5es
CREATE TABLE IF NOT EXISTS auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Funu00e7u00e3o para criar perfil automaticamente quando um usuu00e1rio u00e9 criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE((NEW.user_metadata->>'name'), NEW.email), 
    (NEW.user_metadata->>'avatar')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funu00e7u00e3o para gerar hash de senha
CREATE OR REPLACE FUNCTION auth.crypt_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para verificar senha
CREATE OR REPLACE FUNCTION auth.verify_password(password TEXT, hashed_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (password = hashed_password) OR (hashed_password = crypt(password, hashed_password));
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para autenticar usuu00e1rio
CREATE OR REPLACE FUNCTION auth.authenticate(email TEXT, password TEXT)
RETURNS auth.users AS $$
DECLARE
  user_record auth.users;
BEGIN
  SELECT * INTO user_record FROM auth.users WHERE auth.users.email = authenticate.email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'Usuu00e1rio nu00e3o encontrado';
  END IF;
  
  IF NOT auth.verify_password(password, user_record.encrypted_password) THEN
    RAISE EXCEPTION 'Senha incorreta';
  END IF;
  
  -- Atualizar u00faltimo login
  UPDATE auth.users SET 
    last_sign_in_at = now(),
    updated_at = now()
  WHERE id = user_record.id;
  
  RETURN user_record;
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para criar usuu00e1rio
CREATE OR REPLACE FUNCTION auth.create_user(
  email TEXT,
  password TEXT,
  role TEXT DEFAULT 'student',
  metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS auth.users AS $$
DECLARE
  user_record auth.users;
BEGIN
  INSERT INTO auth.users (
    email,
    encrypted_password,
    role,
    user_metadata,
    created_at,
    updated_at
  ) VALUES (
    email,
    auth.crypt_password(password),
    role,
    metadata,
    now(),
    now()
  ) RETURNING * INTO user_record;
  
  RETURN user_record;
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para criar sessu00e3o
CREATE OR REPLACE FUNCTION auth.create_session(user_id UUID, expires_in_seconds INTEGER DEFAULT 604800) -- 7 dias por padru00e3o
RETURNS auth.sessions AS $$
DECLARE
  session_record auth.sessions;
BEGIN
  INSERT INTO auth.sessions (
    user_id,
    token,
    created_at,
    expires_at
  ) VALUES (
    user_id,
    encode(gen_random_bytes(64), 'hex'),
    now(),
    now() + (expires_in_seconds * interval '1 second')
  ) RETURNING * INTO session_record;
  
  RETURN session_record;
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para validar sessu00e3o
CREATE OR REPLACE FUNCTION auth.validate_session(session_token TEXT)
RETURNS TABLE(user_id UUID, valid BOOLEAN, expired BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    TRUE as valid,
    (s.expires_at < now()) as expired
  FROM 
    auth.sessions s
  WHERE 
    s.token = session_token;
    
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para obter usuu00e1rio por ID
CREATE OR REPLACE FUNCTION auth.get_user_by_id(user_id UUID)
RETURNS auth.users AS $$
DECLARE
  user_record auth.users;
BEGIN
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  RETURN user_record;
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para atualizar metadados do usuu00e1rio
CREATE OR REPLACE FUNCTION auth.update_user_metadata(user_id UUID, metadata JSONB)
RETURNS auth.users AS $$
DECLARE
  user_record auth.users;
BEGIN
  UPDATE auth.users SET 
    user_metadata = metadata,
    updated_at = now()
  WHERE id = user_id
  RETURNING * INTO user_record;
  
  RETURN user_record;
END;
$$ LANGUAGE plpgsql;

-- Funu00e7u00e3o para listar todos os usuu00e1rios (apenas para administradores)
CREATE OR REPLACE FUNCTION auth.list_users()
RETURNS SETOF auth.users AS $$
BEGIN
  RETURN QUERY SELECT * FROM auth.users ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
