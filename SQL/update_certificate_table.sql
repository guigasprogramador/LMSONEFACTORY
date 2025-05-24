-- ================================
-- ATUALIZAÇÃO DA TABELA DE CERTIFICADOS
-- ================================

USE learning_platform;

-- Adicionar a coluna user_name à tabela de certificados se não existir
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) AFTER course_name;

-- Atualizar os certificados existentes com os nomes dos usuários
UPDATE certificates c
JOIN profiles p ON c.user_id = p.id
SET c.user_name = p.name
WHERE c.user_name IS NULL;

-- Verificar a estrutura atualizada da tabela
DESCRIBE certificates;
