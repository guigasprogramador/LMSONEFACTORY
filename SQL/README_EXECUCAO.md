# Instruções para Execução dos Scripts SQL

## Ordem de Execução

Para configurar corretamente o banco de dados para o LMS, siga esta ordem de execução:

### 1. Criar o esquema de autenticação

```bash
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/mysql_auth_schema.sql
```

Este script criará o esquema `auth` com as tabelas e procedimentos necessários para autenticação.

### 2. Criar o esquema da plataforma de aprendizado

```bash
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/learning_platform_schema_corrigido.sql
```

Este script criará o banco de dados `learning_platform` com todas as tabelas e procedimentos necessários para o LMS.

### 3. Configurar a integração entre autenticação e plataforma

Após executar os dois scripts acima, você pode configurar a integração entre o sistema de autenticação e a plataforma de aprendizado. Para isso, execute o seguinte código SQL:

```sql
USE learning_platform;

DELIMITER //
CREATE TRIGGER tr_create_profile_after_user_registration
AFTER INSERT ON auth.users
FOR EACH ROW
BEGIN
    -- Verifica se já existe um perfil para este usuário
    IF NOT EXISTS (SELECT 1 FROM learning_platform.profiles WHERE id = NEW.id) THEN
        -- Cria um novo perfil
        INSERT INTO learning_platform.profiles (
            id, 
            name, 
            email, 
            role
        ) VALUES (
            NEW.id, 
            COALESCE(NEW.username, 'Usuário'), 
            NEW.email, 
            CASE WHEN NEW.role = 'admin' THEN 'admin' ELSE 'student' END
        );
    END IF;
END //
DELIMITER ;
```

## Configuração do Ambiente

### Variáveis de Ambiente

Certifique-se de que o arquivo `.env` na pasta `api` contém as configurações corretas:

```
DB_HOST=app-lm-server.mysql.database.azure.com
DB_USER=qworxozamz
DB_PASSWORD=5r5QFzgfWdQpzs
DB_NAME=lms_database
DB_PORT=3306
DB_SSL=true
JWT_SECRET=689fb08f03a163f4236cc53dda2f243935c6b51fb25d992fb166020d09a3f837
PORT=3000
```

### Testando a Conexão

Para testar se a conexão com o banco de dados está funcionando corretamente, execute:

```bash
cd api
npm start
```

Se tudo estiver configurado corretamente, o servidor deverá iniciar sem erros.

## Solução de Problemas

### Erro "Unknown database 'auth'"

Se você encontrar este erro, significa que o esquema de autenticação ainda não foi criado. Execute primeiro o script `mysql_auth_schema.sql`.

### Erro com "current_user"

Se você encontrar erros relacionados a "current_user", use o script corrigido `learning_platform_schema_corrigido.sql` que já resolve este problema.

### Problemas de Conexão SSL

Certifique-se de usar a flag `--ssl-mode=required` ao conectar-se ao MySQL na Azure, ou defina `DB_SSL=true` no arquivo `.env`.
