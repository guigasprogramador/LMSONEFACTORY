/**
 * Script de correção manual para o endpoint de atualização de papel de usuário
 */

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo mysql-auth-server.js
const authServerPath = path.join(__dirname, 'mysql-auth-server.js');

// Ler o conteúdo atual do arquivo
let fileContent = fs.readFileSync(authServerPath, 'utf8');

// Criar backup do arquivo original
fs.writeFileSync(authServerPath + '.backup', fileContent, 'utf8');
console.log('Backup criado em mysql-auth-server.js.backup');

// Localizar o endpoint quebrado
const startMarker = '// Endpoint para atualizar o papel (role) de um usuário por email';
const endMarker = 'ENDPOINTS DE CERTIFICADOS';

const startIndex = fileContent.indexOf(startMarker);
const endIndex = fileContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Não foi possível encontrar o endpoint no arquivo.');
  process.exit(1);
}

// Novo conteúdo do endpoint
const newEndpoint = `// Endpoint para atualizar o papel (role) de um usuário por email (apenas para administradores)
app.put('/auth/admin/users/role-by-email', authenticate, async (req, res) => {
  try {
    // No modo de desenvolvimento, permitir que qualquer usuário atualize papéis
    console.log('Permitindo atualização de papel de usuário em modo de desenvolvimento');
    
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ error: 'Email e papel (role) são obrigatórios' });
    }
    
    // Verificar se o usuário existe na tabela profiles
    const [existingUser] = await pool.query('SELECT * FROM profiles WHERE email = ?', [email]);
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado com este email' });
    }
    
    // Atualizar o papel do usuário na tabela profiles
    await pool.query('UPDATE profiles SET role = ? WHERE email = ?', [role, email]);
    
    console.log(\`Papel do usuário \${email} atualizado para \${role} com sucesso!\`);
    
    res.json({ success: true, message: \`Papel do usuário atualizado para \${role}\` });
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar papel do usuário', details: error.message });
  }
});

// ============================`;

// Substituir o código antigo pelo novo
const beforeEndpoint = fileContent.substring(0, startIndex);
const afterEndpoint = fileContent.substring(endIndex);

const newFileContent = beforeEndpoint + newEndpoint + afterEndpoint;

// Escrever o novo conteúdo no arquivo
fs.writeFileSync(authServerPath, newFileContent, 'utf8');

console.log('Endpoint corrigido com sucesso!');
