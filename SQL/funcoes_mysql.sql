-- ====================================
-- MIGRAÇÃO DE FUNÇÕES SUPABASE PARA MYSQL
-- ====================================

-- ====================================
-- FUNÇÕES MIGRADAS (usando tabela auth existente)
-- ====================================

DELIMITER $$

-- 1. update_lesson - Atualizar aula
DROP FUNCTION IF EXISTS update_lesson$$
CREATE FUNCTION update_lesson(
    p_lesson_id CHAR(36),
    p_title VARCHAR(255),
    p_description TEXT,
    p_duration INT,
    p_video_url TEXT,
    p_content TEXT,
    p_order_number INT,
    p_module_id CHAR(36)
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE current_module_id CHAR(36);
    
    -- Verificar se a aula existe
    SELECT COUNT(*) INTO v_count FROM lessons WHERE id = p_lesson_id;
    
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Aula não encontrada';
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

-- 2. get_all_users - Obter todos os usuários
-- No MySQL, não temos RETURN QUERY, então criamos uma VIEW ou procedimento
DROP PROCEDURE IF EXISTS get_all_users$$
CREATE PROCEDURE get_all_users()
READS SQL DATA
BEGIN
    SELECT 
        p.id,
        p.name,
        p.email,
        COALESCE(p.role, 'student') as role,
        p.created_at,
        p.avatar_url
    FROM 
        profiles p
    ORDER BY 
        p.created_at DESC;
END$$

-- 4. update_user_metadata - Atualizar metadados do usuário
DROP FUNCTION IF EXISTS update_user_metadata$$
CREATE FUNCTION update_user_metadata(
    user_id CHAR(36),
    user_role VARCHAR(50)
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_admin_user BOOLEAN DEFAULT FALSE;
    
    -- Verifica se o usuário atual é administrador
    -- Substitua por sua lógica de autenticação
    SELECT (role = 'admin') INTO is_admin_user 
    FROM profiles 
    WHERE id = @current_user_id; -- Variável de sessão com ID do usuário logado
    
    IF NOT is_admin_user THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permissão negada';
    END IF;
    
    -- Atualiza o papel do usuário
    UPDATE profiles
    SET role = user_role, updated_at = NOW()
    WHERE id = user_id;
    
    RETURN ROW_COUNT() > 0;
END$$

-- 5. delete_user - Excluir usuário
DROP FUNCTION IF EXISTS delete_user$$
CREATE FUNCTION delete_user(user_id CHAR(36)) RETURNS BOOLEAN
MODIFIES SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_admin_user BOOLEAN DEFAULT FALSE;
    
    -- Verifica se o usuário atual é administrador
    SELECT (role = 'admin') INTO is_admin_user 
    FROM profiles 
    WHERE id = @current_user_id;
    
    IF NOT is_admin_user THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permissão negada';
    END IF;
    
    -- Exclui o usuário
    DELETE FROM profiles WHERE id = user_id;
    DELETE FROM auth.users WHERE id = user_id;
    
    RETURN ROW_COUNT() > 0;
END$$

-- 6. is_admin - Verificar se é administrador
DROP FUNCTION IF EXISTS is_admin$$
CREATE FUNCTION is_admin() RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE user_role VARCHAR(50);
    
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = @current_user_id;
    
    RETURN (user_role = 'admin');
END$$

-- 7. update_updated_at_column - Trigger para atualizar timestamp
-- Exemplo para tabela courses (aplique para outras tabelas conforme necessário)
DROP TRIGGER IF EXISTS update_courses_timestamp$$
CREATE TRIGGER update_courses_timestamp
    BEFORE UPDATE ON courses
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

-- 8. create_course - Criar curso
DROP FUNCTION IF EXISTS create_course$$
CREATE FUNCTION create_course(
    course_title VARCHAR(255),
    course_description TEXT,
    course_thumbnail VARCHAR(500),
    course_duration INT,
    course_instructor VARCHAR(255)
) RETURNS CHAR(36)
MODIFIES SQL DATA
DETERMINISTIC
BEGIN
    DECLARE new_course_id CHAR(36);
    
    IF NOT is_admin() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only administrators can create courses';
    END IF;
    
    SET new_course_id = UUID();
    
    INSERT INTO courses (id, title, description, thumbnail, duration, instructor, created_at, updated_at)
    VALUES (new_course_id, course_title, course_description, course_thumbnail, course_duration, course_instructor, NOW(), NOW());
    
    RETURN new_course_id;
END$$

-- 9. update_course - Atualizar curso
DROP FUNCTION IF EXISTS update_course$$
CREATE FUNCTION update_course(
    course_id CHAR(36),
    new_title VARCHAR(255),
    new_description TEXT,
    new_thumbnail VARCHAR(500),
    new_duration INT,
    new_instructor VARCHAR(255)
) RETURNS BOOLEAN
MODIFIES SQL DATA
DETERMINISTIC
BEGIN
    IF NOT is_admin() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only administrators can update courses';
    END IF;
    
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

-- 10. delete_course - Excluir curso
DROP FUNCTION IF EXISTS delete_course$$
CREATE FUNCTION delete_course(course_id CHAR(36)) RETURNS BOOLEAN
MODIFIES SQL DATA
DETERMINISTIC
BEGIN
    IF NOT is_admin() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only administrators can delete courses';
    END IF;
    
    DELETE FROM courses WHERE id = course_id;
    RETURN ROW_COUNT() > 0;
END$$

DELIMITER ;

-- ====================================
-- CONFIGURAÇÃO DE VARIÁVEL DE SESSÃO
-- ====================================

-- Para usar as funções que verificam permissões, defina o ID do usuário atual:
-- SET @current_user_id = 1; -- Substitua pelo ID do usuário logado
