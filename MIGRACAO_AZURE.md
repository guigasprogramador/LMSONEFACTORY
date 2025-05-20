# Migrau00e7u00e3o do Supabase para PostgreSQL na Azure

Este documento descreve o processo de migrau00e7u00e3o da autenticau00e7u00e3o do Supabase para o PostgreSQL na Azure, permitindo que a aplicau00e7u00e3o LMS continue funcionando no novo ambiente.

## Visão Geral

A migrau00e7u00e3o envolve os seguintes componentes:

1. **Esquema de Banco de Dados**: Script SQL para criar as tabelas e funu00e7u00f5es necessárias no PostgreSQL da Azure
2. **API de Autenticau00e7u00e3o**: Servidor Node.js que implementa os endpoints de autenticau00e7u00e3o
3. **Cliente de Autenticau00e7u00e3o**: Adaptau00e7u00e3o do cliente frontend para usar a nova API

## Passos para Migração

### 1. Configurar o Banco de Dados PostgreSQL na Azure

1. Crie um servidor PostgreSQL na Azure
2. Execute o script `SQL/azure_auth_schema.sql` para criar o esquema de autenticau00e7u00e3o

```bash
psql -h seu-servidor.postgres.database.azure.com -U seu_usuario -d seu_banco -f SQL/azure_auth_schema.sql
```

### 2. Configurar e Iniciar a API de Autenticau00e7u00e3o

1. Navegue até o diretório da API:

```bash
cd api
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` baseado no `.env.example` e configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurau00e7u00f5es
```

4. Inicie o servidor:

```bash
npm start
```

### 3. Configurar o Cliente Frontend

O cliente frontend já foi adaptado para usar a nova API de autenticau00e7u00e3o. As principais alterau00e7u00f5es incluem:

1. Novo cliente de autenticau00e7u00e3o em `src/integrations/auth/client.ts`
2. Adaptau00e7u00e3o do cliente Supabase em `src/integrations/supabase/client.ts`

Para configurar o URL da API, edite o arquivo `src/integrations/auth/client.ts` e atualize a constante `API_URL` com o endereço da sua API de autenticau00e7u00e3o.

## Estrutura de Arquivos

```
├── SQL/
│   ├── azure_auth_schema.sql    # Esquema para PostgreSQL na Azure
├── api/
│   ├── auth-server.js           # Servidor de autenticau00e7u00e3o
│   ├── package.json             # Dependências da API
│   ├── .env.example             # Exemplo de configurau00e7u00e3o
├── src/
│   ├── integrations/
│   │   ├── auth/
│   │   │   ├── client.ts        # Novo cliente de autenticau00e7u00e3o
│   │   ├── supabase/
│   │   │   ├── client.ts        # Cliente adaptado para compatibilidade
```

## Migração de Dados

Para migrar os usuários existentes do Supabase para o PostgreSQL na Azure, você pode usar o seguinte processo:

1. Exporte os usuários do Supabase:
   - Use a interface de administrau00e7u00e3o do Supabase ou a API para exportar os usuários

2. Importe os usuários para o PostgreSQL na Azure:
   - Use o script de importau00e7u00e3o fornecido ou insira manualmente os usuários

```sql
-- Exemplo de inserção de usuário
SELECT * FROM auth.create_user(
  'email@exemplo.com',
  'senha_segura',
  'student',
  '{"name": "Nome do Usuário", "avatar": "url_do_avatar"}'::jsonb
);
```

## Resolução de Problemas

### Erro de Conexão com o Banco de Dados

Verifique se as configurau00e7u00f5es no arquivo `.env` estão corretas e se o servidor PostgreSQL está acessível.

### Erro de Autenticau00e7u00e3o

Verifique os logs do servidor para identificar o problema. Certifique-se de que o JWT_SECRET é o mesmo em todas as instâncias da API.

### Problemas com SSL

Se encontrar problemas de SSL ao conectar ao PostgreSQL na Azure, verifique a configurau00e7u00e3o SSL no objeto de conexão:

```javascript
ssl: { rejectUnauthorized: false } // Para desenvolvimento
// ou
ssl: true // Para produu00e7u00e3o com certificados válidos
```

## Considerau00e7u00f5es de Seguranau00e7a

1. **Chave JWT**: Use uma chave forte e segura para o JWT_SECRET em produu00e7u00e3o
2. **SSL**: Habilite SSL para todas as conexões em produu00e7u00e3o
3. **Senhas**: As senhas são armazenadas com hash usando bcrypt
4. **Firewall**: Configure o firewall da Azure para limitar o acesso ao banco de dados
