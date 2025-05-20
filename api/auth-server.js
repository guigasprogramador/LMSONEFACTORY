/**
 * Servidor de autenticau00e7u00e3o para substituir o Supabase
 * Implementa uma API REST para autenticau00e7u00e3o com PostgreSQL na Azure
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configurau00e7u00e3o do PostgreSQL na Azure
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';
const JWT_EXPIRY = '7d'; // 7 dias

// Middleware de autenticau00e7u00e3o
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nu00e3o fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invu00e1lido' });
  }
};

// Endpoint de login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha su00e3o obrigatu00f3rios' });
  }
  
  try {
    // Usar a funu00e7u00e3o de autenticau00e7u00e3o do banco de dados
    const result = await pool.query(
      'SELECT * FROM auth.authenticate($1, $2)',
      [email, password]
    );
    
    const user = result.rows[0];
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Buscar perfil do usuu00e1rio
    const profileResult = await pool.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [user.id]
    );
    
    const profile = profileResult.rows[0] || {};
    
    // Retornar dados do usuu00e1rio e token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: {
          name: profile.name || user.email.split('@')[0],
          avatar: profile.avatar_url,
          role: user.role || 'student'
        }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(401).json({ error: 'Credenciais invu00e1lidas' });
  }
});

// Endpoint de registro
app.post('/auth/register', async (req, res) => {
  const { email, password, metadata = {} } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha su00e3o obrigatu00f3rios' });
  }
  
  try {
    // Verificar se o usuu00e1rio ju00e1 existe
    const checkResult = await pool.query(
      'SELECT * FROM auth.users WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email ju00e1 registrado' });
    }
    
    // Usar a funu00e7u00e3o de criau00e7u00e3o de usuu00e1rio do banco de dados
    const userResult = await pool.query(
      'SELECT * FROM auth.create_user($1, $2, $3, $4)',
      [email, password, metadata.role || 'student', JSON.stringify(metadata)]
    );
    
    const user = userResult.rows[0];
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Retornar dados do usuu00e1rio e token
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: {
          name: metadata.name || email.split('@')[0],
          avatar: metadata.avatar,
          role: user.role || 'student'
        }
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para obter usuu00e1rio atual
app.get('/auth/user', authenticate, async (req, res) => {
  try {
    // Buscar usuu00e1rio no banco de dados
    const result = await pool.query(
      'SELECT * FROM auth.get_user_by_id($1)',
      [req.user.id]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Usuu00e1rio nu00e3o encontrado' });
    }
    
    // Buscar perfil do usuu00e1rio
    const profileResult = await pool.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [user.id]
    );
    
    const profile = profileResult.rows[0] || {};
    
    // Retornar dados do usuu00e1rio
    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: {
        name: profile.name || user.email.split('@')[0],
        avatar: profile.avatar_url,
        role: user.role || 'student'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuu00e1rio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para atualizar usuu00e1rio
app.patch('/auth/user', authenticate, async (req, res) => {
  const { name, avatar, role, ...otherMetadata } = req.body;
  
  try {
    // Atualizar metadados do usuu00e1rio
    const metadata = {
      name,
      avatar,
      role,
      ...otherMetadata
    };
    
    const userResult = await pool.query(
      'SELECT * FROM auth.update_user_metadata($1, $2)',
      [req.user.id, JSON.stringify(metadata)]
    );
    
    const user = userResult.rows[0];
    
    // Atualizar perfil
    await pool.query(
      'UPDATE public.profiles SET name = $1, avatar_url = $2, updated_at = now() WHERE id = $3',
      [name, avatar, req.user.id]
    );
    
    // Retornar dados atualizados
    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: {
        name: name || user.email.split('@')[0],
        avatar,
        role: user.role || 'student',
        ...otherMetadata
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuu00e1rio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para verificar sessu00e3o
app.get('/auth/session', authenticate, (req, res) => {
  res.json({
    user_id: req.user.id,
    expires_at: new Date(req.user.exp * 1000).toISOString()
  });
});

// Endpoint para renovar token
app.post('/auth/refresh', authenticate, async (req, res) => {
  try {
    // Buscar usuu00e1rio no banco de dados
    const result = await pool.query(
      'SELECT * FROM auth.get_user_by_id($1)',
      [req.user.id]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Usuu00e1rio nu00e3o encontrado' });
    }
    
    // Gerar novo token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Buscar perfil do usuu00e1rio
    const profileResult = await pool.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [user.id]
    );
    
    const profile = profileResult.rows[0] || {};
    
    // Retornar novo token e dados do usuu00e1rio
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: {
          name: profile.name || user.email.split('@')[0],
          avatar: profile.avatar_url,
          role: user.role || 'student'
        }
      }
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para logout
app.post('/auth/logout', authenticate, (req, res) => {
  // No lado do servidor, nu00e3o precisamos fazer nada alu00e9m de validar o token
  // O cliente u00e9 responsu00e1vel por remover o token do armazenamento local
  res.json({ success: true });
});

// Endpoint para listar usuu00e1rios (apenas para administradores)
app.get('/auth/admin/users', authenticate, async (req, res) => {
  // Verificar se o usuu00e1rio u00e9 administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM auth.list_users()');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuu00e1rios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de autenticau00e7u00e3o rodando na porta ${PORT}`);
});
