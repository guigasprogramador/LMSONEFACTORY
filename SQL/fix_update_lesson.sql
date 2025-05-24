-- Script para corrigir a função update_lesson
DELIMITER $$

-- Remover a função existente
DROP FUNCTION IF EXISTS update_lesson$$

-- Recriar a função com VARCHAR(40) para os IDs
CREATE FUNCTION update_lesson(
    p_lesson_id VARCHAR(40),  -- Aumentado para VARCHAR(40) para acomodar UUIDs
    p_title VARCHAR(255),
    p_description TEXT,
    p_duration INT,
    p_video_url TEXT,
    p_content TEXT,
    p_order_number INT,
    p_module_id VARCHAR(40)   -- Aumentado para VARCHAR(40) para acomodar UUIDs
) RETURNS BOOLEAN
MODIFIES SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE current_module_id VARCHAR(40); -- Também aumentado para VARCHAR(40)
    
    -- Verificar se a aula existe
    SELECT COUNT(*) INTO v_count FROM lessons WHERE id = p_lesson_id;
    
    IF v_count = 0 THEN
        RETURN FALSE; -- Aula não encontrada
    END IF;
    
    -- Se p_module_id for NULL, obter o module_id atual da aula
    IF p_module_id IS NULL THEN
        SELECT module_id INTO current_module_id FROM lessons WHERE id = p_lesson_id;
        SET p_module_id = current_module_id;
    END IF;
    
    -- Atualizar a aula
    UPDATE lessons
    SET 
        title = p_title,
        description = p_description,
        duration = p_duration,
        video_url = p_video_url,
        content = p_content,
        order_number = p_order_number,
        module_id = p_module_id,
        updated_at = NOW()
    WHERE id = p_lesson_id;
    
    RETURN TRUE;
END$$

DELIMITER ;
