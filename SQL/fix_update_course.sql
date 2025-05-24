-- Script para corrigir a função update_course
DELIMITER $$

-- Remover a função existente
DROP FUNCTION IF EXISTS update_course$$

-- Recriar a função com VARCHAR(40) para o course_id
CREATE FUNCTION update_course(
    course_id VARCHAR(40),  -- Aumentado para VARCHAR(40) para acomodar UUIDs
    new_title VARCHAR(255),
    new_description TEXT,
    new_thumbnail VARCHAR(500),
    new_duration INT,
    new_instructor VARCHAR(255)
) RETURNS BOOLEAN
MODIFIES SQL DATA
DETERMINISTIC
BEGIN
    -- Verificar se o curso existe
    DECLARE course_exists INT;
    SELECT COUNT(*) INTO course_exists FROM courses WHERE id = course_id;
    
    IF course_exists = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar o curso
    UPDATE courses
    SET 
        title = COALESCE(new_title, title),
        description = COALESCE(new_description, description),
        thumbnail = COALESCE(new_thumbnail, thumbnail),
        duration = COALESCE(new_duration, duration),
        instructor = COALESCE(new_instructor, instructor),
        updated_at = NOW()
    WHERE id = course_id;
    
    RETURN ROW_COUNT() > 0;
END$$

DELIMITER ;
