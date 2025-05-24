# Instruu00e7u00f5es para Execuu00e7u00e3o do LMS com MySQL na Azure

## 1. Configurau00e7u00e3o do Banco de Dados

Os scripts SQL para configurar o banco de dados estu00e3o na pasta `SQL`. Execute-os na seguinte ordem:

```bash
# 1. Criar o esquema de autenticau00e7u00e3o
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/auth_schema_final_corrigido.sql

# 2. Criar o esquema da plataforma de aprendizado
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/learning_platform_schema_corrigido.sql
```

## 2. Configurau00e7u00e3o do Ambiente

Antes de executar o projeto, certifique-se de que todas as dependu00eancias estu00e3o instaladas:

```bash
# Instalar dependu00eancias do frontend (na raiz do projeto)
npm install

# Instalar dependu00eancias da API
cd api
npm install
cd ..
```

Alternativamente, execute o script de configurau00e7u00e3o do ambiente:

```bash
node setup-dev-environment.js
```

## 3. Configurau00e7u00e3o do Arquivo .env

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

## 4. Execuu00e7u00e3o do Servidor de API

Para iniciar o servidor de autenticau00e7u00e3o:

```bash
cd api
npm start
```

O servidor estaru00e1 disponu00edvel em `http://localhost:3000`.

## 5. Execuu00e7u00e3o do Frontend

Para iniciar o frontend:

```bash
npm start
```

## 6. Usuu00e1rios de Teste

O script de autenticau00e7u00e3o cria dois usuu00e1rios para teste:

1. **Administrador**
   - Email: admin@example.com
   - Senha: admin123
   - Papel: admin

2. **Estudante**
   - Email: student@example.com
   - Senha: student123
   - Papel: student

## 7. Soluu00e7u00e3o de Problemas

### Erro "Cannot find module 'express'"

Este erro indica que as dependu00eancias do Node.js nu00e3o estu00e3o instaladas na pasta `api`. Execute:

```bash
cd api
npm install
```

### Erro "process is not defined" em client.ts

Este erro foi corrigido definindo diretamente a URL da API no arquivo `src/integrations/auth/client.ts`.

### Erro de conexu00e3o com o banco de dados

Verifique se:

1. As credenciais no arquivo `.env` estu00e3o corretas
2. O servidor MySQL na Azure estu00e1 acessu00edvel
3. As regras de firewall permitem conexu00f5es do seu IP
4. SSL estu00e1 configurado corretamente

### Erro com tabelas ou procedures

Verifique se os scripts SQL foram executados na ordem correta e sem erros.

## 8. Implantau00e7u00e3o na Azure

Para implantar na Azure, siga as instruu00e7u00f5es detalhadas no arquivo `MIGRACAO_MYSQL_AZURE.md`.
