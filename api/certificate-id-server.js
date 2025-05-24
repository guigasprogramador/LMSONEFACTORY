/**
 * Servidor temporário para endpoint de certificado por ID
 */
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'app-lm-server.mysql.database.azure.com',
  user: process.env.DB_USER || 'qworxozamz',
  password: process.env.DB_PASSWORD || '5r5QFzgfWdQpzs',
  database: process.env.DB_NAME || 'learning_platform',
  ssl: { rejectUnauthorized: true }
});

// Endpoint para buscar certificado por ID
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando certificado com ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({ error: 'ID do certificado é obrigatório' });
    }
    
    const [certificateRows] = await pool.query(
      `SELECT c.*, co.title as course_title, co.thumbnail as course_thumbnail,
      p.name as user_name, p.email as user_email
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN profiles p ON c.user_id = p.id
      WHERE c.id = ?`,
      [id]
    );
    
    if (certificateRows.length === 0) {
      console.log(`Certificado com ID ${id} não encontrado`);
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    console.log(`Certificado encontrado: ${certificateRows[0].id}`);
    res.json(certificateRows[0]);
  } catch (error) {
    console.error('Erro ao buscar certificado por ID:', error);
    res.status(500).json({ error: 'Erro ao buscar certificado', details: error.message });
  }
});

// Inicia o servidor na porta 3002
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor de certificados por ID rodando na porta ${PORT}`);
});
