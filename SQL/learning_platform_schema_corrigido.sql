-- ================================
-- MIGRAu00c7u00c3O SUPABASE PARA MYSQL AZURE (VERSu00c3O OTIMIZADA)
-- ================================

-- 1. CRIAu00c7u00c3O DO BANCO DE DADOS
CREATE DATABASE IF NOT EXISTS learning_platform
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE learning_platform;

-- 2. TABELA PROFILES (criar primeiro devido u00e0s dependu00eancias)
CREATE TABLE profiles (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    job_title VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(1024),
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student',
    PRIMARY KEY (id),
    INDEX idx_profiles_email (email),
    INDEX idx_profiles_role (role)
);

-- 3. TABELA COURSES
CREATE TABLE courses (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(1024),
    duration VARCHAR(100),
    instructor VARCHAR(255) NOT NULL,
    enrolledcount INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_courses_title (title),
    INDEX idx_courses_instructor (instructor)
);

-- 4. TABELA MODULES
CREATE TABLE modules (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    course_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_modules_course_id (course_id),
    INDEX idx_modules_order (order_number)
);

-- 5. TABELA LESSONS
CREATE TABLE lessons (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    module_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(100),
    video_url VARCHAR(1024),
    content LONGTEXT,
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_lessons_module_id (module_id),
    INDEX idx_lessons_order (order_number)
);

-- 6. TABELA ENROLLMENTS
CREATE TABLE enrollments (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    course_id CHAR(36) NOT NULL,
    progress INT DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'active',
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id),
    INDEX idx_enrollments_user_id (user_id),
    INDEX idx_enrollments_course_id (course_id),
    INDEX idx_enrollments_status (status)
);

-- 7. TABELA LESSON_PROGRESS
CREATE TABLE lesson_progress (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    lesson_id CHAR(36) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    INDEX idx_lesson_progress_user_id (user_id),
    INDEX idx_lesson_progress_lesson_id (lesson_id)
);

-- 8. TABELA CERTIFICATES
CREATE TABLE certificates (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    course_id CHAR(36) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NULL,
    certificate_url VARCHAR(1024),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_certificates_user_id (user_id),
    INDEX idx_certificates_course_id (course_id),
    INDEX idx_certificates_issue_date (issue_date)
);

-- 9. VIEW RECENT_CERTIFICATES (substituindo a tabela)
CREATE VIEW recent_certificates AS
SELECT 
    id,
    user_id,
    course_id,
    issue_date,
    course_name,
    user_name
FROM certificates 
ORDER BY issue_date DESC 
LIMIT 10;

-- ================================
-- FUNu00c7u00d5ES E PROCEDURES PARA SEGURANu00c7A
-- ================================

-- 10. FUNu00c7u00c3O PARA VERIFICAR SE u00c9 ADMIN
DELIMITER //
CREATE FUNCTION is_admin(user_id CHAR(36)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE user_role VARCHAR(50) DEFAULT '';
    
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = user_id;
    
    RETURN user_role = 'admin';
END //
DELIMITER ;

-- 11. FUNu00c7u00c3O PARA OBTER USER_ID DA SESSu00c3O (simulau00e7u00e3o do auth.uid())
DELIMITER //
CREATE FUNCTION get_current_user_id() 
RETURNS CHAR(36)
READS SQL DATA
DETERMINISTIC
BEGIN
    -- Esta funu00e7u00e3o deve ser adaptada conforme sua implementau00e7u00e3o de autenticau00e7u00e3o
    DECLARE user_id CHAR(36) DEFAULT NULL;
    
    -- Exemplo usando variu00e1vel de sessu00e3o MySQL
    SET user_id = @current_user_id;
    
    IF user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuu00e1rio nu00e3o autenticado';
    END IF;
    
    RETURN user_id;
END //
DELIMITER ;

-- ================================
-- VIEWS PARA APLICAR POLu00cdTICAS DE SEGURANu00c7A
-- ================================

-- 12. VIEW PARA COURSES (todos podem ver)
CREATE VIEW v_courses AS
SELECT * FROM courses;

-- 13. VIEW PARA ENROLLMENTS DO USUu00c1RIO ATUAL
CREATE VIEW v_user_enrollments AS
SELECT * 
FROM enrollments 
WHERE user_id = get_current_user_id();

-- 14. VIEW PARA LESSON_PROGRESS DO USUu00c1RIO ATUAL
CREATE VIEW v_user_lesson_progress AS
SELECT * 
FROM lesson_progress 
WHERE user_id = get_current_user_id();

-- 15. VIEW PARA PROFILES DO USUu00c1RIO ATUAL
CREATE VIEW v_user_profile AS
SELECT * 
FROM profiles 
WHERE id = get_current_user_id();

-- ================================
-- PROCEDURES PARA OPERAu00c7u00d5ES SEGURAS
-- ================================

-- 16. PROCEDURE PARA INSERIR ENROLLMENT
DELIMITER //
CREATE PROCEDURE sp_insert_enrollment(
    IN p_user_id CHAR(36),
    IN p_course_id CHAR(36)
)
BEGIN
    DECLARE user_id CHAR(36);
    
    -- Obter o usuu00e1rio atual com tratamento de erro
    SET user_id = get_current_user_id();
    
    -- Verifica se o usuu00e1rio estu00e1 tentando inserir para si mesmo
    IF p_user_id = user_id THEN
        INSERT INTO enrollments (user_id, course_id) 
        VALUES (p_user_id, p_course_id);
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acesso negado: vocu00ea su00f3 pode criar enrollments para si mesmo';
    END IF;
END //
DELIMITER ;

-- 17. PROCEDURE PARA ATUALIZAR LESSON_PROGRESS
DELIMITER //
CREATE PROCEDURE sp_update_lesson_progress(
    IN p_lesson_progress_id CHAR(36),
    IN p_completed BOOLEAN,
    IN p_completed_at TIMESTAMP
)
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE user_id CHAR(36);
    
    -- Obter o usuu00e1rio atual com tratamento de erro
    SET user_id = get_current_user_id();
    
    -- Verifica se o lesson_progress pertence ao usuu00e1rio atual
    SELECT user_id INTO v_user_id 
    FROM lesson_progress 
    WHERE id = p_lesson_progress_id;
    
    IF v_user_id = user_id THEN
        UPDATE lesson_progress 
        SET completed = p_completed, 
            completed_at = p_completed_at 
        WHERE id = p_lesson_progress_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acesso negado: vocu00ea su00f3 pode atualizar seu pru00f3prio progresso';
    END IF;
END //
DELIMITER ;

-- 18. PROCEDURE PARA INSERIR CERTIFICATE
DELIMITER //
CREATE PROCEDURE sp_insert_certificate(
    IN p_user_id CHAR(36),
    IN p_course_id CHAR(36),
    IN p_course_name VARCHAR(255),
    IN p_user_name VARCHAR(255),
    IN p_certificate_url VARCHAR(1024)
)
BEGIN
    DECLARE user_id CHAR(36);
    
    -- Obter o usuu00e1rio atual com tratamento de erro
    SET user_id = get_current_user_id();
    
    -- Verifica se o usuu00e1rio estu00e1 inserindo certificado para si mesmo
    IF p_user_id = user_id THEN
        INSERT INTO certificates (user_id, course_id, course_name, user_name, certificate_url) 
        VALUES (p_user_id, p_course_id, p_course_name, p_user_name, p_certificate_url);
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acesso negado: vocu00ea su00f3 pode criar certificados para si mesmo';
    END IF;
END //
DELIMITER ;

-- 19. PROCEDURE PARA OPERAu00c7u00d5ES DE ADMIN EM COURSES
DELIMITER //
CREATE PROCEDURE sp_admin_insert_course(
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_thumbnail VARCHAR(1024),
    IN p_duration VARCHAR(100),
    IN p_instructor VARCHAR(255)
)
BEGIN
    DECLARE user_id CHAR(36);
    
    -- Obter o usuu00e1rio atual com tratamento de erro
    SET user_id = get_current_user_id();
    
    IF is_admin(user_id) THEN
        INSERT INTO courses (title, description, thumbnail, duration, instructor) 
        VALUES (p_title, p_description, p_thumbnail, p_duration, p_instructor);
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acesso negado: apenas administradores podem inserir cursos';
    END IF;
END //
DELIMITER ;

-- 20. PROCEDURE PARA OPERAu00c7u00d5ES DE ADMIN EM MODULES
DELIMITER //
CREATE PROCEDURE sp_admin_insert_module(
    IN p_course_id CHAR(36),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_order_number INT
)
BEGIN
    DECLARE user_id CHAR(36);
    
    -- Obter o usuu00e1rio atual com tratamento de erro
    SET user_id = get_current_user_id();
    
    IF is_admin(user_id) THEN
        INSERT INTO modules (course_id, title, description, order_number) 
        VALUES (p_course_id, p_title, p_description, p_order_number);
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acesso negado: apenas administradores podem inserir mu00f3dulos';
    END IF;
END //
DELIMITER ;

-- ================================
-- TRIGGERS PARA MANTER CONSISTu00caNCIA
-- ================================

-- 21. TRIGGER PARA ATUALIZAR ENROLLED_COUNT
DELIMITER //
CREATE TRIGGER tr_enrollment_insert 
AFTER INSERT ON enrollments
FOR EACH ROW
BEGIN
    UPDATE courses 
    SET enrolledcount = enrolledcount + 1 
    WHERE id = NEW.course_id;
END //

CREATE TRIGGER tr_enrollment_delete 
AFTER DELETE ON enrollments
FOR EACH ROW
BEGIN
    UPDATE courses 
    SET enrolledcount = enrolledcount - 1 
    WHERE id = OLD.course_id;
END //
DELIMITER ;

-- ================================
-- u00cdNDICES ADICIONAIS PARA PERFORMANCE
-- ================================

-- 22. u00cdNDICES COMPOSTOS
CREATE INDEX idx_enrollments_user_status ON enrollments(user_id, status);
CREATE INDEX idx_lesson_progress_user_completed ON lesson_progress(user_id, completed);
CREATE INDEX idx_certificates_user_issue_date ON certificates(user_id, issue_date);

-- ================================
-- COMANDOS PARA CONFIGURAR USUu00c1RIO DA APLICAu00c7u00c3O
-- ================================

-- 23. CONFIGURAu00c7u00c3O DE USUu00c1RIOS E PERMISSu00d5ES
-- Remover usuu00e1rios se existirem
DROP USER IF EXISTS 'app_user'@'%';
DROP USER IF EXISTS 'admin_user'@'%';

-- Criar usuu00e1rio especu00edfico para a aplicau00e7u00e3o
CREATE USER 'app_user'@'%' IDENTIFIED BY 'SuaSenhaSegura123!';

-- Conceder permissu00f5es bu00e1sicas
GRANT SELECT ON learning_platform.* TO 'app_user'@'%';
GRANT INSERT, UPDATE, DELETE ON learning_platform.profiles TO 'app_user'@'%';
GRANT INSERT ON learning_platform.enrollments TO 'app_user'@'%';
GRANT INSERT, UPDATE ON learning_platform.lesson_progress TO 'app_user'@'%';
GRANT INSERT ON learning_platform.certificates TO 'app_user'@'%';
GRANT EXECUTE ON learning_platform.* TO 'app_user'@'%';

-- Criar usuu00e1rio admin
CREATE USER 'admin_user'@'%' IDENTIFIED BY 'SuaSenhaAdminSegura123!';
GRANT ALL PRIVILEGES ON learning_platform.* TO 'admin_user'@'%';

-- Foru00e7ar SSL para todos os usuu00e1rios (recomendado para Azure)
ALTER USER 'app_user'@'%' REQUIRE SSL;
ALTER USER 'admin_user'@'%' REQUIRE SSL;

FLUSH PRIVILEGES;

-- ================================
-- EXEMPLO DE USO DAS PROCEDURES
-- ================================

-- Para definir o usuu00e1rio atual da sessu00e3o:
-- SET @current_user_id = 'uuid-do-usuario-logado';

-- Para inserir enrollment:
-- CALL sp_insert_enrollment('user-uuid', 'course-uuid');

-- Para atualizar progresso da liu00e7u00e3o:
-- CALL sp_update_lesson_progress('lesson-progress-uuid', TRUE, NOW());

-- ================================
-- INTEGRAu00c7u00c3O COM O SISTEMA DE AUTENTICAu00c7u00c3O
-- ================================

-- Para integrar com o sistema de autenticau00e7u00e3o MySQL existente (mysql_auth_schema.sql),
-- vocu00ea pode adicionar uma trigger que cria automaticamente um perfil quando um novo usuu00e1rio u00e9 registrado.
-- NOTA: Execute este cu00f3digo SOMENTE DEPOIS de criar o esquema de autenticau00e7u00e3o (auth)

/*
DELIMITER //
CREATE TRIGGER tr_create_profile_after_user_registration
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
*/

-- Nota: Esta trigger assume que o esquema de autenticau00e7u00e3o (auth.users) ju00e1 existe
-- e contu00e9m as colunas id, username, email e role.
-- Se a estrutura for diferente, ajuste conforme necessu00e1rio.

-- ================================
-- BACKUP E RESTAURAu00c7u00c3O
-- ================================

-- Para fazer backup do banco de dados, use o comando:
-- mysqldump -h seu-servidor.mysql.database.azure.com -u seu_usuario -p --ssl-mode=required --databases learning_platform > backup_learning_platform.sql

-- Para restaurar o banco de dados, use o comando:
-- mysql -h seu-servidor.mysql.database.azure.com -u seu_usuario -p --ssl-mode=required < backup_learning_platform.sql
