# Guia de Migração para MySQL na Azure

Este guia contém instruções para executar o projeto LMS com o banco de dados MySQL na Azure.

## Configurações do Banco de Dados

O projeto já está configurado para se conectar ao banco de dados MySQL na Azure com as seguintes credenciais:

- **Host:** app-lm-server.mysql.database.azure.com
- **Usuário:** qworxozamz
- **Senha:** 5r5QFzgfWdQpzs
- **Banco de Dados:** learning_platform
- **Porta:** 3306
- **SSL:** Habilitado

Estas configurações estão no arquivo `.env` na pasta `api`.

## Preparação do Banco de Dados

Antes de executar o projeto, você precisa verificar se o banco de dados está configurado corretamente e se todos os scripts SQL foram executados.

### 1. Verificar a Configuração do MySQL

Para verificar se o banco de dados está configurado corretamente, execute:

```bash
cd api
npm run check-mysql
```

Este comando irá verificar:
- Conexão com o banco de dados
- Existência do schema de autenticação
- Existência das tabelas principais
- Existência das funções e procedures MySQL

### 2. Inicializar o Banco de Dados (se necessário)

Se a verificação mostrar que algum componente está faltando, você pode inicializar o banco de dados com:

```bash
cd api
npm run init-mysql
```

Este comando oferece um menu interativo para executar os scripts SQL necessários:
- Script de autenticação (auth_schema_final_corrigido.sql)
- Script da plataforma de aprendizado (learning_platform_schema_corrigido.sql)
- Script de funções migradas do Supabase (funções do arquivo enviado)

**Nota:** Este comando requer o cliente MySQL instalado no seu computador.

## Executando o Projeto

### Iniciar os Servidores

Para iniciar ambos os servidores (autenticação e API REST) simultaneamente:

```bash
cd api
npm run start:all
```

Para iniciar apenas o servidor de autenticação MySQL:

```bash
cd api
npm start
```

Para iniciar em modo de desenvolvimento (com reinicialização automática):

```bash
cd api
npm run dev:all
```

### Iniciar o Ambiente Completo

Para iniciar tanto o frontend quanto os servidores de API em um único comando:

```bash
npm run start:full
```

Este comando iniciará:
1. O servidor de autenticação MySQL
2. O servidor REST API 
3. O frontend Vite

## Funções MySQL Migradas

As seguintes funções do Supabase foram migradas para MySQL:

1. `update_lesson` - Atualizar aula
2. `get_all_users` - Obter todos os usuários
3. `update_user_metadata` - Atualizar metadados do usuário
4. `delete_user` - Excluir usuário
5. `is_admin` - Verificar se é administrador
6. `create_course` - Criar curso
7. `update_course` - Atualizar curso
8. `delete_course` - Excluir curso

## Endpoints da API

### Cursos
- `GET /api/courses` - Listar todos os cursos
- `GET /api/courses/:id` - Obter curso por ID
- `POST /api/courses` - Criar curso (admin)
- `PUT /api/courses/:id` - Atualizar curso (admin)
- `DELETE /api/courses/:id` - Excluir curso (admin)

### Módulos
- `GET /api/courses/:courseId/modules` - Listar módulos de um curso
- `GET /api/modules/:id` - Obter módulo por ID
- `POST /api/courses/:courseId/modules` - Criar módulo (admin)
- `PUT /api/modules/:id` - Atualizar módulo (admin)
- `DELETE /api/modules/:id` - Excluir módulo (admin)

### Aulas
- `GET /api/modules/:moduleId/lessons` - Listar aulas de um módulo
- `GET /api/lessons/:id` - Obter aula por ID
- `POST /api/modules/:moduleId/lessons` - Criar aula (admin)
- `PUT /api/lessons/:id` - Atualizar aula (admin)
- `DELETE /api/lessons/:id` - Excluir aula (admin)

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `POST /auth/logout` - Logout
- `GET /auth/user` - Obter usuário autenticado
- `GET /auth/admin/users` - Listar todos os usuários (admin)

## Resolução de Problemas

Se encontrar problemas com a conexão do banco de dados:

1. Verifique se as credenciais no arquivo `.env` estão corretas
2. Verifique se o firewall da Azure permite conexões do seu IP
3. Verifique se os scripts SQL foram executados corretamente
4. Verifique os logs dos servidores para identificar erros específicos

Para problemas com a aplicação frontend:
1. Verifique se os servidores de API estão rodando
2. Verifique o console do navegador para erros
3. Verifique se a URL da API está configurada corretamente (http://localhost:3000)
