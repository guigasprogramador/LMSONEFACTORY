/**
 * Script para inicializar o banco de dados MySQL na Azure
 * Executa os scripts SQL necessários para configurar o banco de dados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do MySQL na Azure
const dbConfig = {
  host: process.env.DB_HOST || 'app-lm-server.mysql.database.azure.com',
  user: process.env.DB_USER || 'qworxozamz',
  password: process.env.DB_PASSWORD || '5r5QFzgfWdQpzs',
  database: process.env.DB_NAME || 'learning_platform',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? '--ssl-mode=required' : ''
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Caminhos para os scripts SQL
const sqlPath = path.join(__dirname, '..', 'SQL');
const authSchemaScript = path.join(sqlPath, 'auth_schema_final_corrigido.sql');
const platformSchemaScript = path.join(sqlPath, 'learning_platform_schema_corrigido.sql');
const funcoesScript = path.join(sqlPath, 'funcoes_mysql.sql');

// Verificar se os scripts existem
if (!fs.existsSync(authSchemaScript)) {
  console.error(`${colors.red}Erro: Script de auth não encontrado em ${authSchemaScript}${colors.reset}`);
  process.exit(1);
}

if (!fs.existsSync(platformSchemaScript)) {
  console.error(`${colors.red}Erro: Script de learning platform não encontrado em ${platformSchemaScript}${colors.reset}`);
  process.exit(1);
}

// Função para executar um script SQL
function executeScript(scriptPath, description) {
  console.log(`${colors.blue}Executando ${description}...${colors.reset}`);
  
  try {
    const command = `mysql -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.ssl} < "${scriptPath}"`;
    
    // No Windows, é melhor usar um arquivo temporário para evitar problemas com senhas na linha de comando
    const tempFile = path.join(__dirname, 'temp_mysql_command.cmd');
    fs.writeFileSync(tempFile, `@echo off\n${command}`);
    
    execSync(`cmd /c "${tempFile}"`, { stdio: 'inherit' });
    
    // Remover arquivo temporário
    fs.unlinkSync(tempFile);
    
    console.log(`${colors.green}✓ ${description} executado com sucesso${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Erro ao executar ${description}:${colors.reset}`, error.message);
    return false;
  }
}

// Menu de opções
console.log(`${colors.magenta}=== Inicialização do Banco de Dados MySQL na Azure ===${colors.reset}`);
console.log(`\nEste script ajudará a configurar o banco de dados MySQL para o LMS.`);
console.log(`\nOpções:`);
console.log(`${colors.yellow}1. Executar script de autenticação (auth_schema_final_corrigido.sql)${colors.reset}`);
console.log(`${colors.yellow}2. Executar script da plataforma de aprendizado (learning_platform_schema_corrigido.sql)${colors.reset}`);
console.log(`${colors.yellow}3. Executar script de funções migradas do Supabase (funcoes_mysql.sql)${colors.reset}`);
console.log(`${colors.yellow}4. Executar todos os scripts acima${colors.reset}`);
console.log(`${colors.yellow}5. Sair${colors.reset}`);

// Verificar se o MySQL está disponível
try {
  console.log(`\n${colors.blue}Verificando se o MySQL está disponível...${colors.reset}`);
  execSync(`mysql --version`, { stdio: 'pipe' });
} catch (error) {
  console.error(`${colors.red}MySQL não encontrado. Você precisa instalar o MySQL Client ou adicionar ao PATH.${colors.reset}`);
  console.log(`\nDicas:`);
  console.log(`1. Instale o MySQL Client: https://dev.mysql.com/downloads/`);
  console.log(`2. Ou use Azure Data Studio com extensão MySQL`);
  console.log(`3. Ou execute os scripts diretamente no Azure Portal`);
  process.exit(1);
}

// Leitura da opção do usuário
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(`\n${colors.blue}Digite o número da opção desejada:${colors.reset} `, (option) => {
  readline.close();
  
  switch (option.trim()) {
    case '1':
      executeScript(authSchemaScript, 'script de autenticação');
      break;
    case '2':
      executeScript(platformSchemaScript, 'script da plataforma de aprendizado');
      break;
    case '3':
      if (fs.existsSync(funcoesScript)) {
        executeScript(funcoesScript, 'script de funções migradas');
      } else {
        console.log(`${colors.yellow}Aviso: O arquivo de funções migradas não foi encontrado. Usando funções dos outros scripts.${colors.reset}`);
      }
      break;
    case '4':
      console.log(`${colors.magenta}Executando todos os scripts...${colors.reset}`);
      const auth = executeScript(authSchemaScript, 'script de autenticação');
      const platform = executeScript(platformSchemaScript, 'script da plataforma de aprendizado');
      
      if (fs.existsSync(funcoesScript)) {
        executeScript(funcoesScript, 'script de funções migradas');
      } else {
        console.log(`${colors.yellow}Aviso: O arquivo de funções migradas não foi encontrado. Usando funções dos outros scripts.${colors.reset}`);
      }
      
      if (auth && platform) {
        console.log(`${colors.green}Todos os scripts foram executados com sucesso!${colors.reset}`);
      } else {
        console.log(`${colors.red}Alguns scripts não foram executados corretamente. Verifique os erros acima.${colors.reset}`);
      }
      break;
    case '5':
      console.log(`${colors.blue}Saindo...${colors.reset}`);
      break;
    default:
      console.log(`${colors.red}Opção inválida.${colors.reset}`);
  }
});
