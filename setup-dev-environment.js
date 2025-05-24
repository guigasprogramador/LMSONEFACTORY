/**
 * Script para configurar o ambiente de desenvolvimento
 * Este script verifica e configura o ambiente para o LMS com MySQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n=== Configurando ambiente de desenvolvimento para LMS com MySQL ===\n');

// Verificar se as dependu00eancias estu00e3o instaladas
console.log('1. Verificando dependu00eancias...');

try {
  // Verificar pasta api
  console.log('   - Verificando dependu00eancias da API...');
  if (!fs.existsSync(path.join(__dirname, 'api', 'node_modules'))) {
    console.log('     Instalando dependu00eancias da API...');
    execSync('npm install', { cwd: path.join(__dirname, 'api'), stdio: 'inherit' });
  } else {
    console.log('     Dependu00eancias da API ju00e1 estu00e3o instaladas.');
  }

  // Verificar pasta raiz (frontend)
  console.log('   - Verificando dependu00eancias do frontend...');
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('     Instalando dependu00eancias do frontend...');
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
  } else {
    console.log('     Dependu00eancias do frontend ju00e1 estu00e3o instaladas.');
  }
} catch (error) {
  console.error('Erro ao verificar/instalar dependu00eancias:', error);
  process.exit(1);
}

// Verificar arquivo .env da API
console.log('\n2. Verificando configuracu00e3o do ambiente...');

const envPath = path.join(__dirname, 'api', '.env');
if (!fs.existsSync(envPath)) {
  console.log('   - Arquivo .env nu00e3o encontrado. Criando a partir do exemplo...');
  const envExamplePath = path.join(__dirname, 'api', '.env.mysql.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('     Arquivo .env criado com sucesso. Por favor, edite-o com suas configuracu00f5es.');
  } else {
    console.error('     Arquivo .env.mysql.example nu00e3o encontrado. Verifique a estrutura do projeto.');
  }
} else {
  console.log('   - Arquivo .env encontrado.');
  
  // Verificar se DB_NAME estu00e1 configurado corretamente
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('DB_NAME=learning_platform')) {
    console.log('     AVISO: O nome do banco de dados no arquivo .env pode nu00e3o estar configurado como "learning_platform".');
    console.log('     Verifique e atualize o arquivo .env se necessu00e1rio.');
  }
}

// Verificar se o servidor MySQL estu00e1 acessu00edvel
console.log('\n3. Verificando conexu00e3o com o banco de dados...');
console.log('   Para testar a conexu00e3o com o banco de dados, execute o servidor:');
console.log('   cd api && npm start');

// Instruu00e7u00f5es finais
console.log('\n=== Configuracu00e3o conclu00edda ===');
console.log('\nPara iniciar o servidor de autenticau00e7u00e3o:');
console.log('cd api && npm start');
console.log('\nPara iniciar o frontend:');
console.log('npm start');
console.log('\nCertifique-se de que o banco de dados MySQL na Azure estu00e1 configurado corretamente');
console.log('e que os scripts SQL foram executados na ordem correta:');
console.log('1. auth_schema_final_corrigido.sql');
console.log('2. learning_platform_schema_corrigido.sql');
