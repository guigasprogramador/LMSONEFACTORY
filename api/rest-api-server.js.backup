/**
 * API REST para LMS - Gerenciamento de cursos, mu00f3dulos e aulas
 * Implementa endpoints para CRUD completo com MySQL
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Implementação manual de proxy para redirecionar chamadas /auth/* para o servidor de autenticação

// Endpoint para listar usuários (proxy para o servidor de autenticação)
app.get('/auth/admin/users', async (req, res) => {
  try {
    console.log('Encaminhando requisição para /auth/admin/users para o servidor de autenticação');
    const authResponse = await fetch('http://localhost:3000/auth/admin/users', {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await authResponse.json();
    return res.status(authResponse.status).json(data);
  } catch (error) {
    console.error('Erro ao encaminhar requisição para o servidor de autenticação:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com o servidor de autenticação' });
  }
});

// Endpoint para criar um novo usuário (proxy para o servidor de autenticação)
app.post('/auth/admin/users', async (req, res) => {
  try {
    console.log('Encaminhando requisição POST para /auth/admin/users para o servidor de autenticação');
    const authResponse = await fetch('http://localhost:3000/auth/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await authResponse.json();
    return res.status(authResponse.status).json(data);
  } catch (error) {
    console.error('Erro ao encaminhar requisição POST para o servidor de autenticação:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com o servidor de autenticação' });
  }
});

// Endpoint para atualizar um usuário (proxy para o servidor de autenticação)
app.put('/auth/admin/users/:userId', async (req, res) => {
  try {
    console.log(`Encaminhando requisição PUT para /auth/admin/users/${req.params.userId} para o servidor de autenticação`);
    const authResponse = await fetch(`http://localhost:3000/auth/admin/users/${req.params.userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await authResponse.json();
    return res.status(authResponse.status).json(data);
  } catch (error) {
    console.error('Erro ao encaminhar requisição PUT para o servidor de autenticação:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com o servidor de autenticação' });
  }
});

// Endpoint para excluir um usuário (proxy para o servidor de autenticação)
app.delete('/auth/admin/users/:userId', async (req, res) => {
  try {
    console.log(`Encaminhando requisição DELETE para /auth/admin/users/${req.params.userId} para o servidor de autenticação`);
    const authResponse = await fetch(`http://localhost:3000/auth/admin/users/${req.params.userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': req.headers.authorization,
      }
    });
    
    const data = await authResponse.json();
    return res.status(authResponse.status).json(data);
  } catch (error) {
    console.error('Erro ao encaminhar requisição DELETE para o servidor de autenticação:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com o servidor de autenticação' });
  }
});

// Endpoint para atualizar papel de usuário por email (proxy para o servidor de autenticação)
app.put('/auth/admin/users/role-by-email', async (req, res) => {
  try {
    console.log('Encaminhando requisição PUT para /auth/admin/users/role-by-email para o servidor de autenticação');
    const authResponse = await fetch('http://localhost:3000/auth/admin/users/role-by-email', {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await authResponse.json();
    return res.status(authResponse.status).json(data);
  } catch (error) {
    console.error('Erro ao encaminhar requisição PUT para o servidor de autenticação:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com o servidor de autenticação' });
  }
});

// Configurau00e7u00e3o do MySQL na Azure
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'app-lm-server.mysql.database.azure.com',
  user: process.env.DB_USER || 'qworxozamz',
  password: process.env.DB_PASSWORD || '5r5QFzgfWdQpzs',
  database: process.env.DB_NAME || 'learning_platform',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || '689fb08f03a163f4236cc53dda2f243935c6b51fb25d992fb166020d09a3f837';

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
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar se o usuário é admin
const isAdmin = async (req, res, next) => {
  try {
    // MODO DE DESENVOLVIMENTO: Permitir que todos os usuários acessem recursos admin
    // IMPORTANTE: Remover isto em produção!
    console.log('Autorizando acesso admin para:', req.user.id, '(Modo de desenvolvimento)');
    
    // Configurar variável de sessão para outras operações
    await pool.query('SET @current_user_id = ?', [req.user.id]);
    next();
    
    /* Descomente este código quando quiser voltar à verificação normal de admin
    // Consultar diretamente se o usuário é admin na tabela profiles
    const [users] = await pool.query(
      'SELECT * FROM profiles WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se o papel do usuário é 'admin' (insensivelmente)
    const userRole = users[0].role?.toLowerCase();
    
    if (userRole === 'admin') {
      // Configurar variável de sessão para outras operações
      await pool.query('SET @current_user_id = ?', [req.user.id]);
      next();
    } else {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores podem acessar este recurso' });
    }
    */
  } catch (error) {
    console.error('Erro ao verificar permissão de administrador:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Helper para gerar UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ============================
// ENDPOINTS PARA CURSOS
// ============================

// Obter todos os cursos
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

// Obter um curso por ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ error: 'Erro ao buscar curso' });
  }
});

// Criar um novo curso (apenas admin)
app.post('/api/courses', authenticate, isAdmin, async (req, res) => {
  const { title, description, thumbnail, duration, instructor, enrolledCount, rating } = req.body;
  
  if (!title || !instructor) {
    return res.status(400).json({ error: 'Título e instrutor são obrigatórios' });
  }
  
  try {
    // Usar a função MySQL create_course
    const [result] = await pool.query(
      'SELECT create_course(?, ?, ?, ?, ?) as course_id',
      [title, description || '', thumbnail || '', parseInt(duration) || 0, instructor]
    );
    
    const courseId = result[0].course_id;
    
    res.status(201).json({
      id: courseId,
      title,
      description,
      thumbnail,
      duration,
      instructor,
      enrolledCount: 0,
      rating: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(500).json({ error: 'Erro ao criar curso' });
  }
});

// Atualizar um curso (apenas admin)
app.put('/api/courses/:id', authenticate, isAdmin, async (req, res) => {
  const { title, description, thumbnail, duration, instructor } = req.body;
  
  try {
    // Verificar se o curso existe
    const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Extrair apenas os números da duração (remover 'horas', etc)
    let durationValue = null;
    if (duration) {
      // Extrair apenas os dígitos
      const durationMatch = duration.toString().match(/\d+/);
      durationValue = durationMatch ? parseInt(durationMatch[0]) : null;
      console.log(`Convertendo duração de '${duration}' para valor numérico: ${durationValue}`);
    }
    
    // Usar a função MySQL update_course
    const [result] = await pool.query(
      'SELECT update_course(?, ?, ?, ?, ?, ?) as success',
      [req.params.id, title, description, thumbnail, durationValue, instructor]
    );
    
    if (result[0].success) {
      // Buscar o curso atualizado
      const [updatedRows] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
      res.json(updatedRows[0]);
    } else {
      return res.status(500).json({ error: 'Falha ao atualizar o curso' });
    }
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ error: 'Erro ao atualizar curso' });
  }
});

// Excluir um curso (apenas admin)
app.delete('/api/courses/:id', authenticate, isAdmin, async (req, res) => {
  try {
    // Usar a função MySQL delete_course
    const [result] = await pool.query(
      'SELECT delete_course(?) as success',
      [req.params.id]
    );
    
    if (result[0].success) {
      res.json({ success: true, message: 'Curso excluído com sucesso' });
    } else {
      return res.status(404).json({ error: 'Curso não encontrado ou erro ao excluir' });
    }
  } catch (error) {
    console.error('Erro ao excluir curso:', error);
    res.status(500).json({ error: 'Erro ao excluir curso' });
  }
});

// ============================
// ENDPOINTS PARA Mu00d3DULOS
// ============================

// Obter todos os mu00f3dulos de um curso
app.get('/api/courses/:courseId/modules', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY order_number ASC', 
      [req.params.courseId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar mu00f3dulos:', error);
    res.status(500).json({ error: 'Erro ao buscar mu00f3dulos' });
  }
});

// Obter um mu00f3dulo por ID
app.get('/api/modules/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mu00f3dulo nu00e3o encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar mu00f3dulo:', error);
    res.status(500).json({ error: 'Erro ao buscar mu00f3dulo' });
  }
});

// Criar um novo mu00f3dulo (apenas admin)
app.post('/api/courses/:courseId/modules', authenticate, isAdmin, async (req, res) => {
  const { title, description, order_number } = req.body;
  
  if (!title || order_number === undefined) {
    return res.status(400).json({ error: 'Tu00edtulo e ordem su00e3o obrigatu00f3rios' });
  }
  
  try {
    // Verificar se o curso existe
    const [courseRows] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
    
    if (courseRows.length === 0) {
      return res.status(404).json({ error: 'Curso nu00e3o encontrado' });
    }
    
    const id = generateUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.query(
      'INSERT INTO modules (id, course_id, title, description, order_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.courseId, title, description || '', order_number, now, now]
    );
    
    const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar mu00f3dulo:', error);
    res.status(500).json({ error: 'Erro ao criar mu00f3dulo' });
  }
});

// Atualizar um mu00f3dulo (apenas admin)
app.put('/api/modules/:id', authenticate, isAdmin, async (req, res) => {
  const { title, description, order_number } = req.body;
  
  try {
    const [existingRows] = await pool.query('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Mu00f3dulo nu00e3o encontrado' });
    }
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.query(
      'UPDATE modules SET title = ?, description = ?, order_number = ?, updated_at = ? WHERE id = ?',
      [title || existingRows[0].title, 
       description !== undefined ? description : existingRows[0].description, 
       order_number !== undefined ? order_number : existingRows[0].order_number, 
       now, 
       req.params.id]
    );
    
    const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar mu00f3dulo:', error);
    res.status(500).json({ error: 'Erro ao atualizar mu00f3dulo' });
  }
});

// Excluir um mu00f3dulo (apenas admin)
app.delete('/api/modules/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const [existingRows] = await pool.query('SELECT * FROM modules WHERE id = ?', [req.params.id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Mu00f3dulo nu00e3o encontrado' });
    }
    
    await pool.query('DELETE FROM modules WHERE id = ?', [req.params.id]);
    
    res.json({ success: true, message: 'Mu00f3dulo excluiu00eddo com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mu00f3dulo:', error);
    res.status(500).json({ error: 'Erro ao excluir mu00f3dulo' });
  }
});

// ============================
// ENDPOINTS PARA AULAS
// ============================

// Obter todas as aulas de um mu00f3dulo
app.get('/api/modules/:moduleId/lessons', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_number ASC', 
      [req.params.moduleId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    res.status(500).json({ error: 'Erro ao buscar aulas' });
  }
});

// Obter uma aula por ID
app.get('/api/lessons/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aula nu00e3o encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ error: 'Erro ao buscar aula' });
  }
});

// Criar uma nova aula (apenas admin)
app.post('/api/modules/:moduleId/lessons', authenticate, isAdmin, async (req, res) => {
  const { title, description, duration, video_url, content, order_number } = req.body;
  
  if (!title || order_number === undefined) {
    return res.status(400).json({ error: 'Tu00edtulo e ordem su00e3o obrigatu00f3rios' });
  }
  
  try {
    // Verificar se o mu00f3dulo existe
    const [moduleRows] = await pool.query('SELECT * FROM modules WHERE id = ?', [req.params.moduleId]);
    
    if (moduleRows.length === 0) {
      return res.status(404).json({ error: 'Mu00f3dulo nu00e3o encontrado' });
    }
    
    const id = generateUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.query(
      'INSERT INTO lessons (id, module_id, title, description, duration, video_url, content, order_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.moduleId, title, description || '', duration || '', video_url || '', content || '', order_number, now, now]
    );
    
    const [rows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: 'Erro ao criar aula' });
  }
});

// Atualizar uma aula (apenas admin)
app.put('/api/lessons/:id', authenticate, isAdmin, async (req, res) => {
  const { title, description, duration, video_url, content, order_number, module_id } = req.body;
  
  try {
    const [existingRows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }
    
    // Usar a função MySQL update_lesson
    const [result] = await pool.query(
      'SELECT update_lesson(?, ?, ?, ?, ?, ?, ?, ?) as success',
      [
        req.params.id,
        title || existingRows[0].title,
        description !== undefined ? description : existingRows[0].description,
        duration !== undefined ? parseInt(duration) : existingRows[0].duration,
        video_url !== undefined ? video_url : existingRows[0].video_url,
        content !== undefined ? content : existingRows[0].content,
        order_number !== undefined ? order_number : existingRows[0].order_number,
        module_id || existingRows[0].module_id
      ]
    );
    
    if (!result[0].success) {
      return res.status(500).json({ error: 'Falha ao atualizar a aula' });
    }
    
    const [rows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ error: 'Erro ao atualizar aula' });
  }
});

// Excluir uma aula (apenas admin)
app.delete('/api/lessons/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const [existingRows] = await pool.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Aula nu00e3o encontrada' });
    }
    
    await pool.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
    
    res.json({ success: true, message: 'Aula excluiu00edda com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir aula:', error);
    res.status(500).json({ error: 'Erro ao excluir aula' });
  }
});

// ============================
// ENDPOINTS PARA PROGRESSO DO ALUNO
// ============================

// Obter progresso de um aluno em um curso
app.get('/api/user/courses/:courseId/progress', authenticate, async (req, res) => {
  try {
    // Verificar se o aluno estu00e1 matriculado no curso
    const [enrollmentRows] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', 
      [req.user.id, req.params.courseId]
    );
    
    if (enrollmentRows.length === 0) {
      return res.status(404).json({ error: 'Matruu00edcula nu00e3o encontrada' });
    }
    
    // Obter todas as aulas do curso
    const [lessonRows] = await pool.query(
      'SELECT l.* FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?', 
      [req.params.courseId]
    );
    
    // Obter progresso do aluno nas aulas
    const [progressRows] = await pool.query(
      'SELECT lp.* FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE lp.user_id = ? AND m.course_id = ?', 
      [req.user.id, req.params.courseId]
    );
    
    // Calcular porcentagem de progresso
    const totalLessons = lessonRows.length;
    const completedLessons = progressRows.filter(p => p.completed).length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    res.json({
      enrollment: enrollmentRows[0],
      totalLessons,
      completedLessons,
      progressPercentage
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

// Marcar uma aula como concluiu00edda
app.post('/api/user/lessons/:lessonId/complete', authenticate, async (req, res) => {
  try {
    // Verificar se o progresso ju00e1 existe
    const [existingRows] = await pool.query(
      'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', 
      [req.user.id, req.params.lessonId]
    );
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    if (existingRows.length > 0) {
      // Atualizar progresso existente
      await pool.query(
        'UPDATE lesson_progress SET completed = TRUE, completed_at = ? WHERE user_id = ? AND lesson_id = ?', 
        [now, req.user.id, req.params.lessonId]
      );
    } else {
      // Criar novo progresso
      const id = generateUUID();
      await pool.query(
        'INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, TRUE, ?)', 
        [id, req.user.id, req.params.lessonId, now]
      );
    }
    
    // Buscar a aula para obter o mu00f3dulo e o curso
    const [lessonRows] = await pool.query(
      'SELECT l.*, m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ?', 
      [req.params.lessonId]
    );
    
    if (lessonRows.length === 0) {
      return res.status(404).json({ error: 'Aula nu00e3o encontrada' });
    }
    
    const courseId = lessonRows[0].course_id;
    
    // Atualizar progresso do curso
    const [allLessonsRows] = await pool.query(
      'SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?', 
      [courseId]
    );
    
    const [completedLessonsRows] = await pool.query(
      'SELECT lp.lesson_id FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = TRUE', 
      [req.user.id, courseId]
    );
    
    const totalLessons = allLessonsRows.length;
    const completedLessons = completedLessonsRows.length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    
    // Atualizar a matruu00edcula com o progresso
    await pool.query(
      'UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?', 
      [progressPercentage, req.user.id, courseId]
    );
    
    // Se todas as aulas foram concluiu00eddas, marcar o curso como concluiu00eddo
    if (progressPercentage === 100) {
      await pool.query(
        'UPDATE enrollments SET completed_at = ?, status = "completed" WHERE user_id = ? AND course_id = ? AND completed_at IS NULL', 
        [now, req.user.id, courseId]
      );
    }
    
    res.json({
      success: true,
      message: 'Aula marcada como concluiu00edda',
      progress: progressPercentage
    });
  } catch (error) {
    console.error('Erro ao marcar aula como concluiu00edda:', error);
    res.status(500).json({ error: 'Erro ao marcar aula como concluiu00edda' });
  }
});

// ============================
// ENDPOINTS PARA CERTIFICADOS
// ============================

// Obter certificados (do usuário ou todos)
app.get('/api/certificates', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const courseId = req.query.course_id;
    
    console.log('Recebida requisição para /api/certificates');
    console.log('Query params:', req.query);
    
    // Base da consulta
    let query = `
      SELECT c.*, co.title as course_title, co.thumbnail as course_thumbnail, 
      p.name as user_name, p.email as user_email
      FROM certificates c 
      JOIN courses co ON c.course_id = co.id
      JOIN profiles p ON c.user_id = p.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Adicionar filtros se fornecidos
    if (userId) {
      conditions.push('c.user_id = ?');
      params.push(userId);
      console.log(`Filtrando por usuário: ${userId}`);
    }
    
    if (courseId) {
      conditions.push('c.course_id = ?');
      params.push(courseId);
      console.log(`Filtrando por curso: ${courseId}`);
    }
    
    // Adicionar condições à consulta se houver
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY c.issue_date DESC';
    
    console.log('Executando consulta de certificados:', query);
    const [rows] = await pool.query(query, params);
    
    console.log(`Encontrados ${rows.length} certificados`);
    res.json(rows || []);
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    res.status(500).json({ error: 'Erro ao buscar certificados', details: error.message });
  }
});

// Criar certificado
app.post('/api/certificates', async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    
    if (!user_id || !course_id) {
      return res.status(400).json({ error: 'IDs do usuário e do curso são obrigatórios' });
    }
    
    console.log(`Criando certificado para o usuário ${user_id} no curso ${course_id}`);
    
    // Verificar se o usuário já tem certificado neste curso
    const [existingCerts] = await pool.query(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
      [user_id, course_id]
    );
    
    if (existingCerts.length > 0) {
      return res.status(400).json({ error: 'Certificado já existe para este curso' });
    }
    
    // Buscar informações do curso para preencher o certificado
    const [courseInfo] = await pool.query(
      'SELECT title as course_name FROM courses WHERE id = ?',
      [course_id]
    );
    
    if (!courseInfo || courseInfo.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Buscar informações do usuário para preencher o certificado
    const [userInfo] = await pool.query(
      'SELECT name as user_name FROM profiles WHERE id = ?',
      [user_id]
    );
    
    if (!userInfo || userInfo.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Gerar ID para o certificado
    const id = generateUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Inserir novo certificado com todos os campos obrigatórios
    await pool.query(
      'INSERT INTO certificates (id, user_id, course_id, course_name, user_name, issue_date) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user_id, course_id, courseInfo[0].course_name, userInfo[0].user_name, now]
    );
    
    const [newCert] = await pool.query(
      'SELECT * FROM certificates WHERE id = ?',
      [id]
    );
    
    res.status(201).json(newCert[0]);
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    res.status(500).json({ error: 'Erro ao criar certificado', details: error.message });
  }
});

// ============================
// ENDPOINTS PARA MATRÍCULAS
// ============================

// Obter matrículas por usuário
app.get('/api/enrollments', async (req, res) => {
  try {
    console.log('Recebida requisição para /api/enrollments');
    console.log('Query params:', req.query);
    
    const userId = req.query.user_id;
    const courseId = req.query.course_id;
    
    console.log(`userId: ${userId}, courseId: ${courseId}`);
    
    // Se tiver courseId, retorna matrículas do curso
    if (courseId) {
      console.log(`Buscando matrículas para o curso ${courseId}`);
      try {
        const [rows] = await pool.query(
          'SELECT e.*, u.name as user_name, u.email as user_email FROM enrollments e JOIN profiles u ON e.user_id = u.id WHERE e.course_id = ?',
          [courseId]
        );
        
        console.log(`Encontradas ${rows.length} matrículas para o curso ${courseId}`);
        return res.json(rows);
      } catch (innerError) {
        console.error('Erro específico na consulta de matrículas por curso:', innerError);
        throw innerError;
      }
    }
    
    // Se tiver userId, retorna matrículas do usuário
    if (userId) {
      console.log(`Buscando matrículas para o usuário ${userId}`);
      try {
        // Primeiro, verificar se o usuário existe
        const [userExists] = await pool.query('SELECT id FROM profiles WHERE id = ?', [userId]);
        
        if (userExists.length === 0) {
          console.log(`Usuário ${userId} não encontrado`);
          return res.json([]);
        }
        
        // Buscar matrículas sem JOIN para evitar erros de chave estrangeira
        const [enrollments] = await pool.query(
          'SELECT * FROM enrollments WHERE user_id = ?',
          [userId]
        );
        
        console.log(`Encontradas ${enrollments.length} matrículas para o usuário ${userId}`);
        
        if (enrollments.length === 0) {
          return res.json([]);
        }
        
        // Obter IDs dos cursos
        const courseIds = enrollments.map(e => e.course_id);
        
        // Buscar informações dos cursos separadamente
        let courses = [];
        
        if (courseIds.length > 0) {
          // Construir consulta adequada para evitar problemas com IN
          let placeholders = courseIds.map(() => '?').join(',');
          const [coursesResult] = await pool.query(
            `SELECT id, title, thumbnail FROM courses WHERE id IN (${placeholders})`,
            courseIds
          );
          courses = coursesResult;
        }
        
        // Mapear cursos por ID para fácil acesso
        const courseMap = new Map();
        courses.forEach(course => {
          courseMap.set(course.id, course);
        });
        
        // Combinar matrículas com informações de cursos
        const result = enrollments.map(enrollment => {
          const course = courseMap.get(enrollment.course_id) || {};
          return {
            ...enrollment,
            course_title: course.title || 'Curso não encontrado',
            thumbnail: course.thumbnail || null
          };
        });
        
        return res.json(result);
      } catch (innerError) {
        console.error('Erro específico na consulta de matrículas por usuário:', innerError);
        throw innerError;
      }
    }
    
    console.log('Requisição inválida: faltando user_id ou course_id');
    return res.status(400).json({ error: 'user_id ou course_id é obrigatório' });
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    res.status(500).json({ error: 'Erro ao buscar matrículas', details: error.message });
  }
});

// Verificar se um usuário está matriculado em um curso
app.get('/api/enrollments/:userId/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    console.log(`Verificando matrícula do usuário ${userId} no curso ${courseId}`);
    
    const [rows] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (rows.length === 0) {
      // Retornar null em vez de 404 para compatibilidade com o frontend
      return res.json(null);
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao verificar matrícula:', error);
    res.status(500).json({ error: 'Erro ao verificar matrícula' });
  }
});

// Endpoint alternativo para checar matrícula (usar caso haja algum problema com o endpoint original)
app.get('/api/check-enrollment', async (req, res) => {
  try {
    const { user_id, course_id } = req.query;
    
    if (!user_id || !course_id) {
      return res.status(400).json({ error: 'IDs do usuário e do curso são obrigatórios' });
    }
    
    console.log(`Verificando matrícula alternativa do usuário ${user_id} no curso ${course_id}`);
    
    const [rows] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [user_id, course_id]
    );
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Erro ao verificar matrícula:', error);
    res.status(500).json({ error: 'Erro ao verificar matrícula' });
  }
});

// Matricular um usuário em um curso
app.post('/api/enrollments', async (req, res) => {
  try {
    console.log('Recebida requisição POST para /api/enrollments');
    console.log('Request body:', req.body);
    
    const { course_id, user_id } = req.body;
    
    if (!course_id || !user_id) {
      console.log('Erro: Parâmetros faltando:', { course_id, user_id });
      return res.status(400).json({ error: 'ID do curso e ID do usuário são obrigatórios' });
    }
    
    // Verificar se o usuário existe em auth.users
    console.log(`Verificando se o usuário ${user_id} existe em auth.users`);
    const [authUsers] = await pool.query('SELECT id, email, username FROM auth.users WHERE id = ?', [user_id]);
    
    if (authUsers.length === 0) {
      console.log(`Usuário ${user_id} não encontrado em auth.users`);
      return res.status(404).json({ error: 'Usuário não encontrado no sistema de autenticação' });
    }
    
    console.log(`Usuário ${user_id} encontrado em auth.users:`, authUsers[0]);
    
    // Verificar se o usuário existe em profiles
    console.log(`Verificando se o usuário ${user_id} existe em profiles`);
    const [profileExists] = await pool.query('SELECT id FROM profiles WHERE id = ?', [user_id]);
    
    // Se o usuário não existe em profiles, mas existe em auth.users, cria o profile
    if (profileExists.length === 0) {
      console.log(`Usuário ${user_id} não encontrado em profiles, mas existe em auth.users. Criando profile...`);
      
      // Obter informações do usuário de auth.profiles se disponível
      const [authProfile] = await pool.query('SELECT id, name, avatar_url FROM auth.profiles WHERE id = ?', [user_id]);
      
      // Valores padrão
      let name = authUsers[0].username || authUsers[0].email.split('@')[0];
      let avatar_url = null;
      
      // Se encontrou perfil no auth.profiles, usar esses dados
      if (authProfile.length > 0) {
        name = authProfile[0].name || name;
        avatar_url = authProfile[0].avatar_url;
      }
      
      try {
        // Criar o profile na tabela profiles
        await pool.query(
          'INSERT INTO profiles (id, name, avatar_url, created_at) VALUES (?, ?, ?, NOW())',
          [user_id, name, avatar_url]
        );
        
        console.log(`Perfil criado com sucesso para o usuário ${user_id}`);
      } catch (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Vamos tentar continuar mesmo com erro na criação do perfil
      }
    }
    
    // Verificar se o curso existe
    console.log(`Verificando se o curso ${course_id} existe`);
    const [courseExists] = await pool.query('SELECT id FROM courses WHERE id = ?', [course_id]);
    
    if (courseExists.length === 0) {
      console.log(`Curso ${course_id} não encontrado`);
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Verificar se o usuário já está matriculado
    console.log(`Verificando se o usuário ${user_id} já está matriculado no curso ${course_id}`);
    try {
      const [existingRows] = await pool.query(
        'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
        [user_id, course_id]
      );
      
      if (existingRows.length > 0) {
        console.log(`Usuário ${user_id} já está matriculado no curso ${course_id}`);
        return res.status(200).json({ 
          success: true,
          message: 'Usuário já está matriculado neste curso',
          enrollment: existingRows[0] 
        });
      }
    } catch (checkError) {
      console.error('Erro ao verificar matrícula existente:', checkError);
      // Continuar mesmo com erro na verificação
    }
    
    // Gerar UUID para nova matrícula
    const id = generateUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`Matriculando usuário ${user_id} no curso ${course_id} com ID ${id}`);
    
    try {
      // Tentar criar um registro na tabela de usuários caso não exista
      await pool.query(
        'INSERT IGNORE INTO profiles (id, name, created_at) VALUES (?, ?, NOW())',
        [user_id, authUsers[0].email.split('@')[0]]
      );
      
      // Inserir matrícula no banco de dados - agora com controle de erro mais granular
      await pool.query(
        'INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress, status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, user_id, course_id, now, 0, 'active']
      );
      
      // Buscar a matrícula recém-criada
      const [rows] = await pool.query('SELECT * FROM enrollments WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        console.error(`Erro: Matrícula ${id} não encontrada após inserção`);
        return res.status(500).json({ error: 'Erro ao criar matrícula' });
      }
      
      console.log(`Matrícula realizada com sucesso: ID ${id}`);
      res.status(201).json({
        success: true,
        message: 'Matrícula realizada com sucesso',
        enrollment: rows[0]
      });
      
    } catch (insertError) {
      console.error('Erro ao inserir matrícula:', insertError);
      console.error('Detalhes completos:', {
        error: insertError.message,
        code: insertError.code,
        errno: insertError.errno,
        sqlState: insertError.sqlState,
        sqlMessage: insertError.sqlMessage
      });
      
      return res.status(500).json({ 
        error: 'Erro ao matricular usuário', 
        details: insertError.message,
        code: insertError.code,
        sqlState: insertError.sqlState
      });
    }
  } catch (error) {
    console.error('Erro ao matricular usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao matricular usuário', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// ============================

// ENDPOINTS DE PROGRESSO DE AULAS

// Endpoint para obter o progresso de várias aulas de um usuário
app.post('/api/progress/:userId/lessons', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { lessonIds } = req.body;
    
    if (!userId || !lessonIds || !Array.isArray(lessonIds)) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    // Consulta para obter o progresso das aulas
    const query = `
      SELECT lesson_id, completed 
      FROM lesson_progress 
      WHERE user_id = ? AND lesson_id IN (?)
    `;
    
    const [results] = await pool.query(query, [userId, lessonIds]);
    
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar progresso das aulas:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso das aulas' });
  }
});

// ENDPOINTS PARA PROGRESSO DE MATRÍCULAS
// ============================

// Atualizar progresso de uma matrícula
app.put('/api/enrollments/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    console.log(`Atualizando progresso da matrícula ${id} para ${progress}%`);
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progresso inválido. Deve ser um valor entre 0 e 100.' });
    }
    
    // Verificar se a matrícula existe
    const [enrollmentRows] = await pool.query(
      'SELECT * FROM enrollments WHERE id = ?',
      [id]
    );
    
    if (enrollmentRows.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }
    
    // Atualizar o progresso com updated_at (depois que a coluna for adicionada)
    try {
      await pool.query(
        'UPDATE enrollments SET progress = ?, updated_at = NOW() WHERE id = ?',
        [progress, id]
      );
    } catch (updateError) {
      // Fallback para o caso da coluna updated_at ainda não ter sido adicionada
      if (updateError.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('Coluna updated_at não existe, fazendo update sem ela');
        await pool.query(
          'UPDATE enrollments SET progress = ? WHERE id = ?',
          [progress, id]
        );
      } else {
        throw updateError;
      }
    }
    
    res.json({ success: true, message: `Progresso atualizado para ${progress}%` });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso', details: error.message });
  }
});

// ============================
// ENDPOINTS PARA PROGRESSO DE AULAS
// ============================

// Obter progresso de aulas para um usuário
app.get('/api/lesson-progress', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }
    
    console.log(`Buscando progresso de aulas para o usuário ${user_id}`);
    
    // Buscar progresso de aulas do usuário
    const [progressRows] = await pool.query(
      'SELECT lesson_id, completed, completed_at FROM lesson_progress WHERE user_id = ?',
      [user_id]
    );
    
    console.log(`Encontrados ${progressRows.length} registros de progresso para o usuário ${user_id}`);
    res.json(progressRows);
  } catch (error) {
    console.error('Erro ao buscar progresso de aulas:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso de aulas', details: error.message });
  }
});

// Marcar aula como concluída
app.post('/api/lesson-progress', async (req, res) => {
  try {
    const { user_id, lesson_id, completed } = req.body;
    
    if (!user_id || !lesson_id) {
      return res.status(400).json({ error: 'IDs do usuário e da aula são obrigatórios' });
    }
    
    console.log(`Marcando aula ${lesson_id} como ${completed ? 'concluída' : 'não concluída'} para o usuário ${user_id}`);
    
    // Verificar se já existe um registro de progresso para esta aula e usuário
    const [existingRows] = await pool.query(
      'SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
      [user_id, lesson_id]
    );
    
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    if (existingRows.length > 0) {
      // Se já existe um registro, atualizar
      await pool.query(
        'UPDATE lesson_progress SET completed = ?, completed_at = ? WHERE user_id = ? AND lesson_id = ?',
        [completed ? 1 : 0, now, user_id, lesson_id]
      );
      console.log(`Progresso atualizado para a aula ${lesson_id}`);
    } else {
      // Se não existe, criar um novo registro
      const id = generateUUID();
      await pool.query(
        'INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, ?, ?)',
        [id, user_id, lesson_id, completed ? 1 : 0, now]
      );
      console.log(`Novo progresso criado para a aula ${lesson_id}`);
    }
    
    // Buscar informações da aula e do módulo
    const [lessonRows] = await pool.query(
      'SELECT l.id as lesson_id, l.module_id, m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ?',
      [lesson_id]
    );
    
    if (lessonRows.length > 0) {
      const { module_id, course_id } = lessonRows[0];
      
      // Calcular progresso total do curso
      const [totalLessons] = await pool.query(
        'SELECT COUNT(*) as total FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?',
        [course_id]
      );
      
      const [completedLessons] = await pool.query(
        'SELECT COUNT(*) as completed FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE m.course_id = ? AND lp.user_id = ? AND lp.completed = 1',
        [course_id, user_id]
      );
      
      const total = totalLessons[0].total || 0;
      const completed = completedLessons[0].completed || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Atualizar progresso do curso na tabela de matrículas
      await pool.query(
        'UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?',
        [progress, user_id, course_id]
      );
      
      console.log(`Progresso do curso ${course_id} atualizado para ${progress}%`);
    }
    
    res.status(200).json({ success: true, message: 'Progresso atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar progresso da aula:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso da aula', details: error.message });
  }
});

// Obter todos os usuários matriculados em um curso com detalhes de perfil
app.get('/api/enrollments/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Buscar matrículas e dados de usuários em uma única consulta com JOIN
    const [rows] = await pool.query(`
      SELECT 
        e.id as enrollment_id,
        e.user_id,
        e.course_id,
        e.enrolled_at,
        e.progress,
        e.status,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        u.avatar_url as user_avatar_url,
        u.created_at as user_created_at
      FROM 
        enrollments e
      JOIN 
        users u ON e.user_id = u.id
      WHERE 
        e.course_id = ?
      ORDER BY 
        e.enrolled_at DESC
    `, [courseId]);
    
    if (rows.length === 0) {
      return res.json([]);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar alunos matriculados:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos matriculados' });
  }
});

// Atualizar progresso de uma matrícula
app.put('/api/enrollments/progress', async (req, res) => {
  try {
    const { course_id, user_id, progress } = req.body;
    
    if (!course_id || !user_id || progress === undefined) {
      return res.status(400).json({ error: 'ID do curso, ID do usuário e progresso são obrigatórios' });
    }
    
    // Verificar se a matrícula existe
    const [existingRows] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [user_id, course_id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }
    
    await pool.query(
      'UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?',
      [progress, user_id, course_id]
    );
    
    res.json({ success: true, message: 'Progresso atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar progresso da matrícula:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso da matrícula' });
  }
});

// ============================
// ENDPOINTS PARA CERTIFICADOS
// ============================

// Obter certificados por curso_id ou user_id
app.get('/api/certificates', authenticate, async (req, res) => {
  try {
    const courseId = req.query.course_id;
    const userId = req.query.user_id;
    
    if (!courseId && !userId) {
      return res.status(400).json({ error: 'course_id ou user_id é obrigatório' });
    }
    
    let query = 'SELECT c.*, u.name as user_name, u.email as user_email, co.title as course_title FROM certificates c';
    query += ' JOIN profiles u ON c.user_id = u.id';
    query += ' JOIN courses co ON c.course_id = co.id';
    
    const params = [];
    if (courseId) {
      query += ' WHERE c.course_id = ?';
      params.push(courseId);
      
      if (userId) {
        query += ' AND c.user_id = ?';
        params.push(userId);
      }
    } else if (userId) {
      query += ' WHERE c.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    res.status(500).json({ error: 'Erro ao buscar certificados' });
  }
});

// Verificar se um certificado existe para um usuário e curso
app.get('/api/certificates/check', async (req, res) => {
  try {
    console.log('Recebida requisição para /api/certificates/check');
    console.log('Query params:', req.query);
    
    const { user_id, course_id } = req.query;
    
    if (!user_id || !course_id) {
      return res.status(400).json({ error: 'ID do usuário e ID do curso são obrigatórios' });
    }
    
    console.log(`Verificando certificado para user_id=${user_id} e course_id=${course_id}`);
    
    // Verificar se o certificado já existe
    const [existingCertificates] = await pool.query(
      `SELECT c.*, co.title as course_name, p.name as user_name 
       FROM certificates c 
       JOIN courses co ON c.course_id = co.id 
       JOIN profiles p ON c.user_id = p.id 
       WHERE c.user_id = ? AND c.course_id = ?`,
      [user_id, course_id]
    );
    
    if (existingCertificates.length === 0) {
      console.log('Certificado não encontrado, retornando objeto vazio');
      // Retorna objeto vazio com status 200 (não é erro, apenas não existe)
      return res.status(200).json(null);
    }
    
    console.log('Certificado encontrado, retornando dados');
    res.json(existingCertificates[0]);
  } catch (error) {
    console.error('Erro ao verificar certificado:', error);
    res.status(500).json({ error: 'Erro ao verificar certificado' });
  }
});

// Criar certificado
app.post('/api/certificates', authenticate, isAdmin, async (req, res) => {
  try {
    const { 
      user_id, 
      course_id, 
      course_name, 
      user_name,
      course_hours,
      issue_date,
      expiry_date,
      certificate_url,
      certificate_html,
      certificate_number
    } = req.body;
    
    if (!user_id || !course_id) {
      return res.status(400).json({ error: 'ID do usuário e ID do curso são obrigatórios' });
    }
    
    // Verificar se o certificado já existe
    const [existingCertificates] = await pool.query(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
      [user_id, course_id]
    );
    
    if (existingCertificates.length > 0) {
      // Em vez de retornar erro, retorna o certificado existente
      const [existingCertificateData] = await pool.query(
        `SELECT c.*, u.name as user_name, u.email as user_email, co.title as course_title 
         FROM certificates c 
         JOIN profiles u ON c.user_id = u.id 
         JOIN courses co ON c.course_id = co.id 
         WHERE c.id = ?`,
        [existingCertificates[0].id]
      );
      return res.status(200).json(existingCertificateData[0]);
    }
    
    // Verificar se o aluno concluiu o curso
    const [enrollments] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [user_id, course_id]
    );
    
    if (enrollments.length === 0) {
      return res.status(400).json({ error: 'Aluno não está matriculado neste curso' });
    }
    
    const certificateId = generateUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const issueDate = issue_date || now;
    
    // Verificar se a tabela tem a coluna user_name
    const [columnsResult] = await pool.query(
      "SHOW COLUMNS FROM certificates LIKE 'user_name'"
    );
    
    const hasUserNameColumn = columnsResult.length > 0;
    
    // Obter nome do curso se não fornecido
    let finalCourseName = course_name;
    if (!finalCourseName) {
      const [courseResult] = await pool.query(
        'SELECT title FROM courses WHERE id = ?',
        [course_id]
      );
      if (courseResult.length > 0) {
        finalCourseName = courseResult[0].title;
      }
    }
    
    // Obter nome do usuário se não fornecido
    let finalUserName = user_name;
    if (!finalUserName) {
      const [userResult] = await pool.query(
        'SELECT name FROM profiles WHERE id = ?',
        [user_id]
      );
      if (userResult.length > 0) {
        finalUserName = userResult[0].name;
      }
    }
    
    // SQL base para inserção
    let insertSQL = 'INSERT INTO certificates (id, user_id, course_id, course_name';
    let insertParams = [certificateId, user_id, course_id, finalCourseName];
    
    // Adicionar colunas opcionais ao SQL se existirem
    if (hasUserNameColumn) {
      insertSQL += ', user_name';
      insertParams.push(finalUserName);
    }
    
    if (certificate_url) {
      insertSQL += ', certificate_url';
      insertParams.push(certificate_url);
    }
    
    if (issue_date) {
      insertSQL += ', issue_date';
      insertParams.push(issueDate);
    }
    
    // Finalizar SQL
    insertSQL += ', created_at, updated_at) VALUES (' + '?,'.repeat(insertParams.length) + '?, ?)';
    insertParams.push(now, now);
    
    await pool.query(insertSQL, insertParams);
    
    // Buscar os dados completos do certificado criado
    const [certificateRows] = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email, co.title as course_title 
       FROM certificates c 
       JOIN profiles u ON c.user_id = u.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE c.id = ?`,
      [certificateId]
    );
    
    res.status(201).json(certificateRows[0]);
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    res.status(500).json({ error: 'Erro ao criar certificado', details: error.message });
  }
});

// Excluir certificado
app.delete('/api/certificates/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    res.json({ success: true, message: 'Certificado excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir certificado:', error);
    res.status(500).json({ error: 'Erro ao excluir certificado' });
  }
});

// Porta do servidor
const PORT = process.env.REST_API_PORT || 3001; // Alterando para porta 3001 para evitar conflito com o servidor de autenticação

app.listen(PORT, () => {
  console.log(`Servidor REST API rodando na porta ${PORT}`);
});
