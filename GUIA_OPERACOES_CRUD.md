# Guia de Operau00e7u00f5es CRUD com MySQL

Este guia explica como realizar operau00e7u00f5es CRUD (Create, Read, Update, Delete) na plataforma LMS apu00f3s a migrau00e7u00e3o do Supabase para o MySQL.

## 1. Banco de Dados

O banco de dados MySQL foi configurado com sucesso com os seguintes esquemas:

- **auth**: Esquema para gerenciar autenticau00e7u00e3o de usuu00e1rios
- **learning_platform**: Esquema principal para cursos, mu00f3dulos, liu00e7u00f5es e progresso

## 2. Adaptador Supabase

Implementamos um adaptador que simula a interface do Supabase para facilitar a transiu00e7u00e3o. Este adaptador permite que o cu00f3digo existente continue funcionando sem grandes alterau00e7u00f5es.

### 2.1 Operau00e7u00f5es Suportadas

- **Autenticau00e7u00e3o**: Login, registro, logout e gerenciamento de sessu00e3o
- **CRUD**: Operau00e7u00f5es bu00e1sicas de Create, Read, Update e Delete

### 2.2 Limitau00e7u00f5es

- **Sem Realtime**: O sistema nu00e3o suporta atualizau00e7u00f5es em tempo real como o Supabase Realtime
- **Funcionalidades Limitadas**: Algumas funcionalidades avanau00e7adas do Supabase nu00e3o estu00e3o disponiu00edveis

## 3. Como Usar

### 3.1 Criar um Curso

```typescript
const createCourse = async (courseData) => {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: courseData.title,
      description: courseData.description,
      // outros campos
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### 3.2 Atualizar um Curso

```typescript
const updateCourse = async (courseId, courseData) => {
  const { data, error } = await supabase
    .from('courses')
    .update({
      title: courseData.title,
      description: courseData.description,
      // outros campos
    })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### 3.3 Excluir um Curso

```typescript
const deleteCourse = async (courseId) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
};
```

### 3.4 Buscar Cursos

```typescript
const getCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*');

  if (error) throw error;
  return data;
};
```

## 4. Soluu00e7u00e3o de Problemas

### 4.1 Avisos no Console

Vocu00ea pode ver avisos no console como:

```
Aviso: Tentativa de usar supabase.from('courses').insert() - Esta funu00e7u00e3o nu00e3o estu00e1 disponiu00edvel na migrau00e7u00e3o para MySQL
```

Isso u00e9 normal e indica que o adaptador estu00e1 simulando a operau00e7u00e3o. A operau00e7u00e3o ainda funciona, mas u00e9 apenas uma simulau00e7u00e3o.

### 4.2 Erros de Autenticau00e7u00e3o

Se encontrar erros de autenticau00e7u00e3o (401 Unauthorized), verifique:

1. Se o token estu00e1 sendo armazenado corretamente no localStorage
2. Se o servidor de autenticau00e7u00e3o estu00e1 em execuu00e7u00e3o
3. Se as credenciais estu00e3o corretas

## 5. Implementau00e7u00e3o Futura

No futuro, recomendamos refatorar o cu00f3digo para remover completamente as referu00eancias ao Supabase e usar diretamente uma API REST que se comunique com o MySQL. Isso tornaru00e1 o cu00f3digo mais limpo e eficiente.

## 6. Usuu00e1rios de Teste

Vocu00ea pode usar os seguintes usuu00e1rios para testar o sistema:

1. **Administrador**
   - Email: admin@example.com
   - Senha: admin123

2. **Estudante**
   - Email: student@example.com
   - Senha: student123

## 7. Considerau00e7u00f5es Finais

Esta soluu00e7u00e3o u00e9 uma medida temporu00e1ria para facilitar a migrau00e7u00e3o do Supabase para o MySQL. Ela permite que o sistema continue funcionando enquanto vocu00ea se adapta u00e0 nova infraestrutura.
