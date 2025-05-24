/**
 * Script para iniciar o ambiente de desenvolvimento completo
 * Inicia tanto o frontend quanto os servidores de API
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando ambiente de desenvolvimento completo...');

// Iniciar servidores de API (autenticação e REST)
const apiServer = spawn('npm', ['run', 'start:all'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'api')
});

// Iniciar o frontend
const frontendServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Lidar com o encerramento dos processos
process.on('SIGINT', () => {
  console.log('⚠️ Encerrando servidores...');
  apiServer.kill('SIGINT');
  frontendServer.kill('SIGINT');
  process.exit();
});

apiServer.on('close', (code) => {
  console.log(`🛑 Servidores de API encerrados com código ${code}`);
});

frontendServer.on('close', (code) => {
  console.log(`🛑 Frontend encerrado com código ${code}`);
});

console.log('✅ Ambiente de desenvolvimento em execução. Pressione Ctrl+C para encerrar.');
