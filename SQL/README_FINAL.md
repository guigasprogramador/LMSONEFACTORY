# Configurau00e7u00e3o do Banco de Dados MySQL para o LMS

## Visu00e3o Geral

Este projeto utiliza MySQL na Azure para armazenar dados de autenticau00e7u00e3o e da plataforma de aprendizado. A estrutura do banco de dados u00e9 dividida em duas partes principais:

1. **Esquema de Autenticau00e7u00e3o (`auth`)**: Gerencia usuu00e1rios, sessu00f5es e perfis de autenticau00e7u00e3o
2. **Esquema da Plataforma (`learning_platform`)**: Gerencia cursos, mu00f3dulos, aulas e progresso dos alunos

## Instruu00e7u00f5es para Configurau00e7u00e3o

### 1. Executar o Script de Autenticau00e7u00e3o

```bash
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/auth_schema_final.sql
```

Este script criaru00e1:
- Banco de dados `learning_platform`
- Esquema `auth`
- Tabelas de usuu00e1rios, sessu00f5es e perfis
- Procedures e funu00e7u00f5es para autenticau00e7u00e3o
- Usuu00e1rios de teste (admin e student)

### 2. Executar o Script da Plataforma de Aprendizado

```bash
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < SQL/learning_platform_schema_corrigido.sql
```

Este script criaru00e1:
- Tabelas para cursos, mu00f3dulos, aulas, matru00edculas, etc.
- Procedures para operau00e7u00f5es seguras
- Triggers para manter consistu00eancia
- u00cdndices para otimizar performance

## Configurau00e7u00e3o do Servidor de API

1. Certifique-se de que o arquivo `.env` na pasta `api` contenha as configurau00e7u00f5es corretas:

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

2. Inicie o servidor:

```bash
cd api
npm start
```

## Usuu00e1rios de Teste

O script de autenticau00e7u00e3o cria dois usuu00e1rios para teste:

1. **Administrador**
   - Email: admin@example.com
   - Senha: admin123
   - Papel: admin

2. **Estudante**
   - Email: student@example.com
   - Senha: student123
   - Papel: student

## Soluu00e7u00e3o de Problemas

### Erro de Conexu00e3o

Se vocu00ea encontrar erros de conexu00e3o, verifique:
- Credenciais no arquivo `.env`
- Regras de firewall no Azure MySQL
- Conexu00e3o SSL ativada

### Erro de Autenticau00e7u00e3o

Se houver problemas com login/registro:
- Verifique se o esquema `auth` foi criado corretamente
- Confirme que as procedures de autenticau00e7u00e3o estu00e3o funcionando
- Teste com os usuu00e1rios padru00e3o criados

### Erro com Tabelas da Plataforma

Se houver problemas com as tabelas da plataforma:
- Verifique se o script `learning_platform_schema_corrigido.sql` foi executado com sucesso
- Confirme que todas as tabelas foram criadas

## Backup e Restaurau00e7u00e3o

Para fazer backup do banco de dados:

```bash
mysqldump -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required --databases learning_platform > backup_learning_platform.sql
```

Para restaurar o banco de dados:

```bash
mysql -h app-lm-server.mysql.database.azure.com -u qworxozamz -p --ssl-mode=required < backup_learning_platform.sql
```
