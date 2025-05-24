-- ================================
-- ATUALIZAÇÃO DA TABELA DE MATRÍCULAS
-- ================================

USE learning_platform;

-- Adicionar a coluna updated_at à tabela de matrículas (enrollments)
ALTER TABLE enrollments 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verificar a estrutura atualizada da tabela
DESCRIBE enrollments;
