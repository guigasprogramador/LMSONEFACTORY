# Guia Completo de Migrau00e7u00e3o do Supabase para MySQL na Azure

Este guia fornece instruu00e7u00f5es detalhadas para completar a migrau00e7u00e3o do sistema de autenticau00e7u00e3o e banco de dados do Supabase (PostgreSQL) para o MySQL na Azure.

## 1. Configurau00e7u00e3o do Banco de Dados MySQL na Azure

### 1.1 Executar os Scripts SQL

Execute os scripts SQL na seguinte ordem:

```bash
# 1. Criar o esquema de autenticau00e7u00e3o
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/auth_schema_final_corrigido.sql

# 2. Criar o esquema da plataforma de aprendizado
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/learning_platform_schema_corrigido.sql
```

### 1.2 Verificar a Configurau00e7u00e3o

Verifique se os esquemas e tabelas foram criados corretamente:

```sql
-- Verificar esquemas
SHOW DATABASES;

-- Verificar tabelas de autenticau00e7u00e3o
USE learning_platform;
SHOW TABLES IN auth;

-- Verificar tabelas da plataforma
SHOW TABLES;
```

## 2. Configurau00e7u00e3o do Ambiente de Desenvolvimento

### 2.1 Instalar Dependu00eancias

```bash
# Na pasta raiz do projeto
npm install

# Na pasta api
cd api
npm install
cd ..
```

### 2.2 Configurar Variu00e1veis de Ambiente

Verifique se o arquivo `.env` na pasta `api` contu00e9m as configurau00e7u00f5es corretas:

```
DB_HOST=app-lm-server.mysql.database.azure.com
DB_USER=qworxozamz
DB_PASSWORD=5r5QFzgfWdQpzs
DB_NAME=learning_platform
DB_PORT=3306
DB_SSL=true
JWT_SECRET=689fb08f03a163f4236cc53dda2f243935c6b51fb25d992fb166020d09a3f837
PORT=3000
```

## 3. Adaptau00e7u00f5es no Cu00f3digo

### 3.1 Adaptau00e7u00f5es Realizadas

As seguintes adaptau00e7u00f5es foram realizadas para migrar do Supabase para o MySQL:

1. **Cliente de Autenticau00e7u00e3o**: Implementamos um cliente de autenticau00e7u00e3o personalizado em `src/integrations/auth/client.ts` que se comunica com a API MySQL.

2. **Adaptador Supabase**: Criamos um adaptador em `src/integrations/supabase/client.ts` que simula a interface do Supabase usando nosso cliente MySQL.

3. **Tipos de Usuu00e1rio**: Adicionamos tipos em `src/types/user.ts` para garantir a compatibilidade com o novo sistema.

### 3.2 Possíveis Problemas

Se encontrar erros relacionados ao Supabase, verifique:

1. **Chamadas Diretas ao Supabase**: Procure por chamadas diretas ao Supabase que nu00e3o passam pelo adaptador.

2. **Recursos Nu00e3o Implementados**: Alguns recursos do Supabase (como Realtime) nu00e3o estu00e3o disponíveis no MySQL. Procure por avisos no console.

## 4. Execuu00e7u00e3o da Aplicau00e7u00e3o

### 4.1 Iniciar o Servidor de API

```bash
cd api
npm start
```

O servidor estaru00e1 disponível em `http://localhost:3000`.

### 4.2 Iniciar o Frontend

```bash
npm start
```

## 5. Migrau00e7u00e3o de Dados

Se você tiver dados existentes no Supabase que precisam ser migrados para o MySQL, siga estas etapas:

### 5.1 Exportar Dados do Supabase

```bash
# Exportar tabela de usuários
psql -h seu-projeto.supabase.co -p 5432 -d postgres -U postgres -c "\COPY auth.users TO 'users.csv' WITH CSV HEADER"

# Exportar outras tabelas necessárias
# ...
```

### 5.2 Importar Dados para o MySQL

```bash
# Importar usuários
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required learning_platform -e "LOAD DATA INFILE 'users.csv' INTO TABLE auth.users FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;"

# Importar outras tabelas
# ...
```

## 6. Implantau00e7u00e3o na Azure

### 6.1 Implantar o Servidor de API

1. **Criar um App Service**:
   - No Portal Azure, crie um novo App Service
   - Configure para usar Node.js
   - Configure a implantau00e7u00e3o contínua a partir do GitHub

2. **Configurar Variu00e1veis de Ambiente**:
   - Adicione as mesmas variu00e1veis do arquivo `.env` nas Configurau00e7u00f5es do App Service

### 6.2 Implantar o Frontend

1. **Criar um Static Web App**:
   - No Portal Azure, crie um novo Static Web App
   - Configure para usar React
   - Configure a implantau00e7u00e3o contínua a partir do GitHub

2. **Configurar a URL da API**:
   - Atualize a URL da API no arquivo `src/integrations/auth/client.ts` para apontar para o App Service

## 7. Soluu00e7u00e3o de Problemas

### 7.1 Erros de Conexu00e3o com o Banco de Dados

- Verifique as credenciais no arquivo `.env`
- Verifique se o servidor MySQL na Azure estu00e1 acessível
- Verifique se as regras de firewall permitem conexu00f5es do seu IP

### 7.2 Erros no Frontend

- Se encontrar erros relacionados ao Supabase, verifique o console para avisos
- Os avisos indicaru00e3o quais recursos do Supabase estu00e3o sendo chamados mas nu00e3o estu00e3o disponíveis

### 7.3 Erros de Autenticau00e7u00e3o

- Verifique se o JWT_SECRET u00e9 o mesmo no servidor e no cliente
- Verifique se as rotas de autenticau00e7u00e3o estu00e3o funcionando corretamente

## 8. Usuu00e1rios de Teste

O script de autenticau00e7u00e3o cria dois usuu00e1rios para teste:

1. **Administrador**
   - Email: admin@example.com
   - Senha: admin123
   - Papel: admin

2. **Estudante**
   - Email: student@example.com
   - Senha: student123
   - Papel: student

## 9. Backup e Restaurau00e7u00e3o

### 9.1 Backup do Banco de Dados

```bash
mysqldump -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required --databases learning_platform > backup_learning_platform.sql
```

### 9.2 Restaurau00e7u00e3o do Banco de Dados

```bash
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < backup_learning_platform.sql
```

## 10. Considerau00e7u00f5es Finais

- O adaptador Supabase u00e9 uma soluu00e7u00e3o temporu00e1ria para facilitar a migrau00e7u00e3o
- No futuro, considere refatorar o cu00f3digo para remover completamente as referu00eancias ao Supabase
- Monitore o desempenho do MySQL na Azure e ajuste conforme necessu00e1rio
