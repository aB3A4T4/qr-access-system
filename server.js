// server.js - Backend API сервер
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Подключение к MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root', // Укажите ваш пароль MySQL
    database: process.env.DB_NAME || 'qr_access_control',
    charset: 'utf8mb4'
};

let pool;

async function initDB() {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Подключено к MySQL');
}

// ==================== AUTH ====================

// Вход в систему
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

// ==================== EMPLOYEES ====================

// Получить всех сотрудников
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

// Добавить сотрудника
app.post('/api/employees', async (req, res) => {
    try {
        const { name, email, position, department, valid_until, work_start, work_end } = req.body;

        const [result] = await pool.query(
            `INSERT INTO users (email, password, role, name, position, department, valid_until, work_start, work_end, active) 
             VALUES (?, 'user123', 'employee', ?, ?, ?, ?, ?, ?, TRUE)`,
            [email, name, position, department, valid_until, work_start, work_end]
        );

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`Добавлен сотрудник: ${name}`]
        );

        await pool.query(
            'INSERT INTO notifications (message) VALUES (?)',
            [`Новый сотрудник: ${name}`]
        );

        res.json({ id: result.insertId, message: 'Сотрудник добавлен' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Удалить сотрудника
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [id]);
        const name = users[0]?.name || 'Неизвестный';

        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`Удален сотрудник: ${name}`]
        );

        res.json({ message: 'Сотрудник удален' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Переключить активность сотрудника
app.patch('/api/employees/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query('SELECT name, active FROM users WHERE id = ?', [id]);
        const user = users[0];
        const newActive = !user.active;

        await pool.query('UPDATE users SET active = ? WHERE id = ?', [newActive, id]);

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`${newActive ? 'Активирован' : 'Заблокирован'} сотрудник: ${user.name}`]
        );

        res.json({ active: newActive });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== GUESTS ====================

// Получить всех гостей
app.get('/api/guests', async (req, res) => {
    try {
        const [guests] = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
        res.json(guests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Добавить гостя
app.post('/api/guests', async (req, res) => {
    try {
        const { name, telegram, valid_from, valid_to } = req.body;

        const [result] = await pool.query(
            'INSERT INTO guests (name, telegram, valid_from, valid_to, active) VALUES (?, ?, ?, ?, TRUE)',
            [name, telegram, valid_from, valid_to]
        );

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`Добавлен гость: ${name}`]
        );

        await pool.query(
            'INSERT INTO notifications (message) VALUES (?)',
            [`Новый гость: ${name}`]
        );

        res.json({ id: result.insertId, message: 'Гость добавлен' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Удалить гостя
app.delete('/api/guests/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [guests] = await pool.query('SELECT name FROM guests WHERE id = ?', [id]);
        const name = guests[0]?.name || 'Неизвестный';

        await pool.query('DELETE FROM guests WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`Удален гость: ${name}`]
        );

        res.json({ message: 'Гость удален' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== TERMINALS ====================

// Получить все терминалы
app.get('/api/terminals', async (req, res) => {
    try {
        const [terminals] = await pool.query(
            "SELECT id, name, terminal_id, terminal_type FROM users WHERE role = 'terminal'"
        );
        res.json(terminals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Добавить терминал
app.post('/api/terminals', async (req, res) => {
    try {
        const { name, email, type } = req.body;

        const [terminals] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'terminal'");
        const termId = `TERM-${String(terminals[0].count + 1).padStart(3, '0')}`;

        const [result] = await pool.query(
            `INSERT INTO users (email, password, role, name, terminal_id, terminal_type, valid_until, active) 
             VALUES (?, '123', 'terminal', ?, ?, ?, '2030-12-31', TRUE)`,
            [email, name, termId, type]
        );

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`Добавлен терминал: ${name}`]
        );

        res.json({ id: result.insertId, terminalId: termId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Удалить терминал
app.delete('/api/terminals/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [id]);
        const name = users[0]?.name || 'Неизвестный';

        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO admin_logs (message) VALUES (?)',
            [`Удален терминал: ${name}`]
        );

        res.json({ message: 'Терминал удален' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== VISITS & SCANNING ====================

// Получить все посещения
app.get('/api/visits', async (req, res) => {
    try {
        const [visits] = await pool.query('SELECT * FROM visits ORDER BY timestamp DESC LIMIT 500');
        res.json(visits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обработать сканирование QR
app.post('/api/scan', async (req, res) => {
    try {
        const { qrData, terminalType } = req.body;
        const data = JSON.parse(qrData);

        let user;
        let userType;

        // Найти пользователя
        if (data.type === 'employee') {
            const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "employee"', [data.id]);
            user = users[0];
            userType = 'employee';
        } else if (data.type === 'guest') {
            const [guests] = await pool.query('SELECT * FROM guests WHERE id = ?', [data.id]);
            user = guests[0];
            userType = 'guest';
        }

        if (!user) {
            await pool.query(
                'INSERT INTO security_logs (user_name, message, log_type) VALUES (?, ?, ?)',
                ['Неизвестный', 'QR не найден', 'error']
            );
            return res.status(404).json({ success: false, message: 'QR не найден' });
        }

        // Проверить активность
        if (!user.active) {
            await pool.query(
                'INSERT INTO security_logs (user_name, message, log_type) VALUES (?, ?, ?)',
                [user.name, 'Доступ заблокирован', 'error']
            );
            return res.status(403).json({
                success: false,
                name: user.name,
                message: 'Доступ заблокирован',
                department: user.department,
                position: user.position
            });
        }

        // Проверить срок действия
        const now = new Date();
        let valid = false;

        if (userType === 'employee') {
            const validUntil = new Date(user.valid_until);
            valid = now <= validUntil;
        } else {
            const validFrom = new Date(user.valid_from);
            const validTo = new Date(user.valid_to);
            valid = now >= validFrom && now <= validTo;
        }

        if (!valid) {
            await pool.query(
                'INSERT INTO security_logs (user_name, message, log_type) VALUES (?, ?, ?)',
                [user.name, 'Пропуск истёк', 'error']
            );
            return res.status(403).json({
                success: false,
                name: user.name,
                message: 'Срок истёк',
                department: user.department || 'Guest',
                position: user.position || 'Guest'
            });
        }

        // Успешный вход
        await pool.query(
            'INSERT INTO visits (user_id, user_type, employee_name, department, position, terminal_type) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, userType, user.name, user.department || 'Guest', user.position || 'Guest', terminalType]
        );

        await pool.query(
            'INSERT INTO security_logs (user_name, message, log_type) VALUES (?, ?, ?)',
            [user.name, 'Успешный вход', 'success']
        );

        res.json({
            success: true,
            name: user.name,
            message: 'Доступ разрешён',
            department: user.department || 'Guest',
            position: user.position || 'Guest'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== LOGS ====================

// Получить логи безопасности
app.get('/api/security-logs', async (req, res) => {
    try {
        const [logs] = await pool.query('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 200');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить логи администратора
app.get('/api/admin-logs', async (req, res) => {
    try {
        const [logs] = await pool.query('SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT 200');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== NOTIFICATIONS ====================

// Получить уведомления
app.get('/api/notifications', async (req, res) => {
    try {
        const [notifications] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== SETTINGS ====================

// Получить настройки
app.get('/api/settings', async (req, res) => {
    try {
        const [settings] = await pool.query('SELECT * FROM settings LIMIT 1');
        res.json(settings[0] || { company_name: 'ТОО "Secure Access"', logo_url: '' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Обновить настройки
app.put('/api/settings', async (req, res) => {
    try {
        const { company_name, logo_url } = req.body;

        const [settings] = await pool.query('SELECT id FROM settings LIMIT 1');

        if (settings.length === 0) {
            await pool.query(
                'INSERT INTO settings (company_name, logo_url) VALUES (?, ?)',
                [company_name, logo_url]
            );
        } else {
            await pool.query(
                'UPDATE settings SET company_name = ?, logo_url = ? WHERE id = ?',
                [company_name, logo_url, settings[0].id]
            );
        }

        res.json({ message: 'Настройки обновлены' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Запуск сервера
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });
});
