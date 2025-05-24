-- Script para corrigir problema de collation entre tabelas

-- Atualizar a função is_admin para converter as strings antes de comparar
DELIMITER $$

DROP FUNCTION IF EXISTS is_admin$$
CREATE FUNCTION is_admin() RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE user_role VARCHAR(50);
    
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = @current_user_id;
    
    -- Usando COLLATE para forçar mesma collation na comparação
    RETURN (user_role COLLATE utf8mb4_unicode_ci = 'admin' COLLATE utf8mb4_unicode_ci);
END$$

DELIMITER ;
