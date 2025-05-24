/**
 * Script para iniciar os servidores (autenticação, API REST e Certificados)
 * Para uso com MySQL na Azure
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidores para MySQL na Azure...');

// Iniciar o servidor de autenticação MySQL
const authServer = spawn('node', ['mysql-auth-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Iniciar o servidor REST API
const restServer = spawn('node', ['rest-api-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Iniciar o servidor de certificados
const certServer = spawn('node', ['certificate-id-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Lidar com o encerramento dos processos
process.on('SIGINT', () => {
  console.log('⚠️ Encerrando servidores...');
  authServer.kill('SIGINT');
  restServer.kill('SIGINT');
  certServer.kill('SIGINT');
  process.exit();
});

authServer.on('close', (code) => {
  console.log(`🛑 Servidor de autenticação encerrado com código ${code}`);
});

restServer.on('close', (code) => {
  console.log(`🛑 Servidor REST API encerrado com código ${code}`);
});

certServer.on('close', (code) => {
  console.log(`🛑 Servidor de certificados encerrado com código ${code}`);
});

console.log('✅ Servidores em execução. Pressione Ctrl+C para encerrar.');
