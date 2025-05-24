# Migrau00e7u00e3o para MySQL na Azure

Este documento descreve o processo de migrau00e7u00e3o da autenticau00e7u00e3o do PostgreSQL para o MySQL na Azure, permitindo que a aplicau00e7u00e3o LMS continue funcionando no novo ambiente com custos reduzidos.

## Visu00e3o Geral

A migrau00e7u00e3o envolve os seguintes componentes:

1. **Esquema de Banco de Dados**: Script SQL para criar as tabelas e procedimentos armazenados necessu00e1rios no MySQL da Azure
2. **API de Autenticau00e7u00e3o**: Servidor Node.js adaptado para usar MySQL em vez de PostgreSQL
3. **Cliente de Autenticau00e7u00e3o**: O cliente frontend permanece o mesmo, pois se comunica com a API e nu00e3o diretamente com o banco de dados

## Passos para Migrau00e7u00e3o

### 1. Configurar o Banco de Dados MySQL na Azure

1. Crie um servidor MySQL na Azure
2. Execute o script `SQL/mysql_auth_schema.sql` para criar o esquema de autenticau00e7u00e3o

```bash
mysql -h seu-servidor.mysql.database.azure.com -u seu_usuario -p seu_banco < SQL/mysql_auth_schema.sql
```

### 2. Configurar e Iniciar a API de Autenticau00e7u00e3o

1. Navegue atu00e9 o diretu00f3rio da API:

```bash
cd api
```

2. Instale as dependu00eancias (incluindo o driver MySQL):

```bash
npm install
```

3. Crie um arquivo `.env` baseado no `.env.mysql.example` e configure as variu00e1veis de ambiente:

```bash
cp .env.mysql.example .env
# Edite o arquivo .env com suas configurau00e7u00f5es
```

4. Inicie o servidor:

```bash
npm start
```

### 3. Configurar o Cliente Frontend

O cliente frontend nu00e3o precisa ser alterado, pois ele ju00e1 estu00e1 configurado para se comunicar com a API de autenticau00e7u00e3o, independentemente do banco de dados usado.

Para configurar o URL da API, edite o arquivo `src/integrations/auth/client.ts` e atualize a constante `API_URL` com o endereu00e7o da sua API de autenticau00e7u00e3o.

## Diferenu00e7as entre PostgreSQL e MySQL

### Principais diferenu00e7as no esquema

1. **UUIDs**: MySQL nu00e3o tem suporte nativo para UUIDs como PostgreSQL, entu00e3o implementamos uma funu00e7u00e3o `uuid_v4()` para gerar UUIDs

2. **JSON**: MySQL usa `JSON` em vez de `JSONB` do PostgreSQL, com funu00e7u00f5es diferentes para manipulau00e7u00e3o de JSON

3. **Procedimentos Armazenados**: MySQL usa `PROCEDURE` em vez de `FUNCTION` para a maioria das operau00e7u00f5es

4. **Timestamps**: MySQL usa `TIMESTAMP` com `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` para atualizau00e7u00e3o automu00e1tica

### Diferenu00e7as na API

1. **Driver**: Usamos `mysql2/promise` em vez de `pg`

2. **Resultados**: MySQL retorna resultados em um formato diferente, com o primeiro elemento do array contendo as linhas

3. **Procedimentos**: Chamamos procedimentos armazenados com `CALL` em vez de `SELECT`

## Estrutura de Arquivos

```
u251cu2500u2500 SQL/
u2502   u251cu2500u2500 mysql_auth_schema.sql    # Esquema para MySQL na Azure
u2502   u251cu2500u2500 azure_auth_schema.sql    # Esquema original para PostgreSQL (mantido para referu00eancia)
u251cu2500u2500 api/
u2502   u251cu2500u2500 mysql-auth-server.js     # Servidor de autenticau00e7u00e3o para MySQL
u2502   u251cu2500u2500 auth-server.js           # Servidor original para PostgreSQL (mantido para referu00eancia)
u2502   u251cu2500u2500 package.json             # Dependu00eancias da API (atualizado para incluir mysql2)
u2502   u251cu2500u2500 .env.mysql.example       # Exemplo de configurau00e7u00e3o para MySQL
u2502   u251cu2500u2500 .env.example             # Exemplo de configurau00e7u00e3o original para PostgreSQL
u251cu2500u2500 src/
u2502   u251cu2500u2500 integrations/
u2502   u2502   u251cu2500u2500 auth/
u2502   u2502   u2502   u251cu2500u2500 client.ts        # Cliente de autenticau00e7u00e3o (sem alterau00e7u00f5es)
u2502   u2502   u251cu2500u2500 supabase/
u2502   u2502   u2502   u251cu2500u2500 client.ts        # Cliente adaptado para compatibilidade (sem alterau00e7u00f5es)
```

## Migrau00e7u00e3o de Dados

Para migrar os usuu00e1rios existentes do PostgreSQL para o MySQL na Azure, vocu00ea pode usar o seguinte processo:

1. Exporte os usuu00e1rios do PostgreSQL:
   ```sql
   \COPY (SELECT id, email, encrypted_password, role, created_at, updated_at, last_sign_in_at, confirmed_at, user_metadata FROM auth.users) TO 'users.csv' WITH CSV HEADER;
   ```

2. Importe os usuu00e1rios para o MySQL:
   ```sql
   LOAD DATA INFILE 'users.csv' INTO TABLE auth.users
   FIELDS TERMINATED BY ',' ENCLOSED BY '"'
   LINES TERMINATED BY '\n'
   IGNORE 1 ROWS;
   ```

3. Exporte os perfis do PostgreSQL:
   ```sql
   \COPY (SELECT id, name, avatar_url, bio, created_at, updated_at FROM public.profiles) TO 'profiles.csv' WITH CSV HEADER;
   ```

4. Importe os perfis para o MySQL:
   ```sql
   LOAD DATA INFILE 'profiles.csv' INTO TABLE profiles
   FIELDS TERMINATED BY ',' ENCLOSED BY '"'
   LINES TERMINATED BY '\n'
   IGNORE 1 ROWS;
   ```

## Resoluu00e7u00e3o de Problemas

### Erro de Conexu00e3o com o Banco de Dados

Verifique se as configurau00e7u00f5es no arquivo `.env` estu00e3o corretas e se o servidor MySQL estu00e1 acessu00edvel.

```javascript
// Exemplo de configurau00e7u00e3o de conexu00e3o MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false
});
```

### Erro de Autenticau00e7u00e3o

Verifique os logs do servidor para identificar o problema. Certifique-se de que o JWT_SECRET u00e9 o mesmo em todas as instu00e2ncias da API.

### Problemas com Procedimentos Armazenados

Se encontrar erros relacionados a procedimentos armazenados, verifique se eles foram criados corretamente executando o script SQL novamente ou verificando manualmente:

```sql
SHOW PROCEDURE STATUS WHERE Db = 'auth';
```

## Considerau00e7u00f5es de Seguranu00e7a

1. **Chave JWT**: Use uma chave forte e segura para o JWT_SECRET em produu00e7u00e3o
2. **SSL**: Habilite SSL para todas as conexu00f5es em produu00e7u00e3o definindo `DB_SSL=true` no arquivo `.env`
3. **Senhas**: As senhas su00e3o armazenadas com hash usando a funu00e7u00e3o `PASSWORD()` do MySQL combinada com um salt
4. **Firewall**: Configure o firewall da Azure para limitar o acesso ao banco de dados

## Vantagens do MySQL na Azure

1. **Custo reduzido**: MySQL geralmente tem um custo menor que PostgreSQL na Azure
2. **Desempenho**: Para aplicau00e7u00f5es com muitas leituras, MySQL pode oferecer bom desempenho
3. **Familiaridade**: Muitos desenvolvedores ju00e1 estu00e3o familiarizados com MySQL
4. **Integrau00e7u00e3o com Azure**: Benefu00edcios de integrau00e7u00e3o com outros serviu00e7os Azure
