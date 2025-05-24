/**
 * Script para verificar a configuração do MySQL na Azure
 * Verifica a conexão, a existência das tabelas e funções/procedures
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Configuração do MySQL na Azure
const poolConfig = {
  host: process.env.DB_HOST || 'app-lm-server.mysql.database.azure.com',
  user: process.env.DB_USER || 'qworxozamz',
  password: process.env.DB_PASSWORD || '5r5QFzgfWdQpzs',
  database: process.env.DB_NAME || 'learning_platform',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
};

async function checkDatabaseSetup() {
  console.log(`${colors.blue}=== Verificando configuração do MySQL na Azure ===${colors.reset}`);
  console.log(`${colors.blue}Conectando ao servidor: ${poolConfig.host}${colors.reset}`);
  
  let connection;
  
  try {
    // Testar conexão
    const pool = mysql.createPool(poolConfig);
    connection = await pool.getConnection();
    console.log(`${colors.green}✓ Conexão com o MySQL estabelecida com sucesso${colors.reset}`);
    
    // Verificar banco de dados
    console.log(`\n${colors.magenta}Verificando banco de dados: ${poolConfig.database}${colors.reset}`);
    const [dbResult] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, 
      [poolConfig.database]
    );
    
    if (dbResult.length > 0) {
      console.log(`${colors.green}✓ Banco de dados '${poolConfig.database}' existe${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Banco de dados '${poolConfig.database}' não encontrado${colors.reset}`);
      return;
    }
    
    // Verificar schema auth
    const [authResult] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'auth'`
    );
    
    if (authResult.length > 0) {
      console.log(`${colors.green}✓ Schema 'auth' existe${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Schema 'auth' não encontrado${colors.reset}`);
    }
    
    // Verificar tabelas principais
    console.log(`\n${colors.magenta}Verificando tabelas principais:${colors.reset}`);
    const mainTables = ['profiles', 'courses', 'modules', 'lessons', 'enrollments', 'lesson_progress'];
    
    for (const table of mainTables) {
      const [tableResult] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [poolConfig.database, table]
      );
      
      if (tableResult.length > 0) {
        console.log(`${colors.green}✓ Tabela '${table}' existe${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Tabela '${table}' não encontrada${colors.reset}`);
      }
    }
    
    // Verificar tabelas de autenticação
    console.log(`\n${colors.magenta}Verificando tabelas de autenticação:${colors.reset}`);
    const authTables = ['users', 'sessions', 'profiles'];
    
    for (const table of authTables) {
      const [tableResult] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'auth' AND TABLE_NAME = ?`,
        [table]
      );
      
      if (tableResult.length > 0) {
        console.log(`${colors.green}✓ Tabela 'auth.${table}' existe${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Tabela 'auth.${table}' não encontrada${colors.reset}`);
      }
    }
    
    // Verificar funções MySQL
    console.log(`\n${colors.magenta}Verificando funções MySQL:${colors.reset}`);
    const functions = [
      'update_lesson', 'is_admin', 'create_course', 
      'update_course', 'delete_course', 'update_user_metadata'
    ];
    
    for (const func of functions) {
      const [funcResult] = await connection.query(
        `SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ? AND ROUTINE_TYPE = 'FUNCTION'`,
        [poolConfig.database, func]
      );
      
      if (funcResult.length > 0) {
        console.log(`${colors.green}✓ Função '${func}' existe${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Função '${func}' não encontrada${colors.reset}`);
      }
    }
    
    // Verificar procedures
    console.log(`\n${colors.magenta}Verificando procedures:${colors.reset}`);
    const procedures = ['get_all_users'];
    
    for (const proc of procedures) {
      const [procResult] = await connection.query(
        `SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = ? AND ROUTINE_TYPE = 'PROCEDURE'`,
        [poolConfig.database, proc]
      );
      
      if (procResult.length > 0) {
        console.log(`${colors.green}✓ Procedure '${proc}' existe${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Procedure '${proc}' não encontrada${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}=== Verificação concluída ====${colors.reset}`);
    console.log(
      `\nSe algum componente não foi encontrado, execute os scripts SQL:\n` +
      `${colors.yellow}- auth_schema_final_corrigido.sql${colors.reset}: para configurar autenticação\n` +
      `${colors.yellow}- learning_platform_schema_corrigido.sql${colors.reset}: para o LMS\n` +
      `${colors.yellow}- funcoes_mysql.sql${colors.reset}: para as funções migradas do Supabase`
    );
    
  } catch (error) {
    console.error(`${colors.red}Erro ao verificar configuração:${colors.reset}`, error);
  } finally {
    if (connection) {
      connection.release();
      console.log(`${colors.blue}Conexão fechada${colors.reset}`);
      process.exit(0);
    }
  }
}

// Executar verificação
checkDatabaseSetup();
