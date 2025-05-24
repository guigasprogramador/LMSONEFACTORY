-- ================================
-- CRIAÇÃO DA TABELA DE CERTIFICADOS
-- ================================

USE learning_platform;

-- Criar a tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    course_id CHAR(36) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_number VARCHAR(50) GENERATED ALWAYS AS (CONCAT('CERT-', SUBSTRING(id, 1, 8))) STORED,
    certificate_url VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course_cert (user_id, course_id),
    INDEX idx_certificates_user_id (user_id),
    INDEX idx_certificates_course_id (course_id),
    INDEX idx_certificates_issue_date (issue_date)
);

-- Verificar se a tabela foi criada corretamente
SELECT 
    TABLE_NAME, 
    TABLE_ROWS, 
    CREATE_TIME, 
    UPDATE_TIME
FROM 
    information_schema.tables 
WHERE 
    TABLE_SCHEMA = 'learning_platform' 
    AND TABLE_NAME = 'certificates';

-- Mostrar estrutura da tabela
DESCRIBE certificates;
