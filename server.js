// server.js - Backend API сервер
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ======== Подключение к MySQL ========
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'qr_access_control',
  charset: 'utf8mb4'
};

let pool;

async function initDB() {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Подключено к MySQL');
}

// ======== AUTH ========
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======== EMPLOYEES ========
app.get('/api/employees', async (req, res) => {
  try {
    const [employees] = await pool.query(
      "SELECT * FROM users WHERE role = 'employee' ORDER BY name"
    );
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, email, position, department, valid_until, work_start, work_end } = req.body;

    const [result] = await pool.query(
      `INSERT INTO users (email, password, role, name, position, department, valid_until, work_start, work_end, active) 
       VALUES (?, 'user123', 'employee', ?, ?, ?, ?, ?, ?, TRUE)`,
      [email, name, position, department, valid_until, work_start, work_end]
    );

    await pool.query('INSERT INTO admin_logs (message) VALUES (?)', [`Добавлен сотрудник: ${name}`]);
    await pool.query('INSERT INTO notifications (message) VALUES (?)', [`Новый сотрудник: ${name}`]);

    res.json({ id: result.insertId, message: 'Сотрудник добавлен' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [id]);
    const name = users[0]?.name || 'Неизвестный';

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    await pool.query('INSERT INTO admin_logs (message) VALUES (?)', [`Удален сотрудник: ${name}`]);

    res.json({ message: 'Сотрудник удален' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======== GUESTS ========
app.get('/api/guests', async (req, res) => {
  try {
    const [guests] = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/guests', async (req, res) => {
  try {
    const { name, telegram, valid_from, valid_to } = req.body;

    const [result] = await pool.query(
      'INSERT INTO guests (name, telegram, valid_from, valid_to, active) VALUES (?, ?, ?, ?, TRUE)',
      [name, telegram, valid_from, valid_to]
    );

    await pool.query('INSERT INTO admin_logs (message) VALUES (?)', [`Добавлен гость: ${name}`]);
    await pool.query('INSERT INTO notifications (message) VALUES (?)', [`Новый гость: ${name}`]);

    res.json({ id: result.insertId, message: 'Гость добавлен' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/guests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [guests] = await pool.query('SELECT name FROM guests WHERE id = ?', [id]);
    const name = guests[0]?.name || 'Неизвестный';

    await pool.query('DELETE FROM guests WHERE id = ?', [id]);
    await pool.query('INSERT INTO admin_logs (message) VALUES (?)', [`Удален гость: ${name}`]);

    res.json({ message: 'Гость удален' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======== FRONTEND SERVE (Vue) ========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

// Все маршруты → index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ======== HEALTH CHECK (для Render) ========
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// ======== ЗАПУСК СЕРВЕРА ========
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порт ${PORT}`);
  });
});
