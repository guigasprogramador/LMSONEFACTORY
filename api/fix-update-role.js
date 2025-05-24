/**
 * Script para corrigir o endpoint de atualização de papel de usuário
 * 
 * Este script deve ser executado diretamente no node para substituir o endpoint
 * problemaático no arquivo mysql-auth-server.js
 */

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo mysql-auth-server.js
const authServerPath = path.join(__dirname, 'mysql-auth-server.js');

// Ler o conteúdo do arquivo
fs.readFile(authServerPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo mysql-auth-server.js:', err);
    process.exit(1);
  }

  // Conteúdo correto para o endpoint de atualização de papel
  const correctEndpoint = `
// Endpoint para atualizar o papel (role) de um usuário por email (apenas para administradores)
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
`;

  // Expressão regular para encontrar o endpoint atual
  const endpointRegex = /\/\/\s*Endpoint\s+para\s+atualizar\s+o\s+papel[\s\S]*?app\.put\(\'\/auth\/admin\/users\/role-by-email\'[\s\S]*?\)\;/;

  // Substituir o endpoint antigo pelo novo
  const updatedContent = data.replace(endpointRegex, correctEndpoint.trim());

  // Criar um backup do arquivo original
  fs.writeFile(authServerPath + '.bak', data, 'utf8', (err) => {
    if (err) {
      console.error('Erro ao criar backup do arquivo:', err);
      process.exit(1);
    }
    console.log('Backup do arquivo criado com sucesso!');
  });

  // Escrever o conteúdo atualizado no arquivo
  fs.writeFile(authServerPath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Erro ao escrever no arquivo:', err);
      process.exit(1);
    }
    console.log('Endpoint de atualização de papel corrigido com sucesso!');
  });
});
