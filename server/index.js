require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir la versión Web (si existe la carpeta dist en la raíz)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Configuración de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'supermercado_cima',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Helper simplificado para PostgreSQL
const db = {
  get: async (query, params = []) => {
    const res = await pool.query(query, params);
    return res.rows[0];
  },
  all: async (query, params = []) => {
    const res = await pool.query(query, params);
    return res.rows;
  },
  run: async (query, params = []) => {
    const res = await pool.query(query, params);
    return { lastID: res.rows[0]?.id };
  }
};

// Función para obtener el transporter con los datos actuales de la DB
async function sendOrderEmail(targetEmail, order) {
  const smtpPass = await db.get('SELECT value FROM config WHERE key = ?', ['smtp_pass']);

  if (!targetEmail || !smtpPass) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: targetEmail,
      pass: smtpPass.value
    }
  });

  const items = JSON.parse(order.items);
  let itemsHtml = '<ul>';
  items.forEach(item => {
    itemsHtml += `<li><b>${item.name}</b> - Categoría: ${item.category_name}</li>`;
  });
  itemsHtml += '</ul>';

  const mailOptions = {
    from: `"Supermercado CIMA" <${targetEmail}>`,
    to: targetEmail,
    subject: `Nuevo Pedido Recibido - ${order.username}`,
    html: `
      <h2>Has recibido un nuevo pedido</h2>
      <p><b>Usuario:</b> ${order.username}</p>
      <p><b>Fecha:</b> ${order.date}</p>
      <hr />
      <h3>Listado de productos:</h3>
      ${itemsHtml}
      <hr />
      <p>Puedes gestionar este pedido desde el Panel de Administrador de la App.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email enviado con éxito');
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

// Routes

// --- Users ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE username = $1::text', [username]);
  
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

app.post('/api/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(`[Admin Login Attempt] User: ${username}`);

    const adminUser = await db.get("SELECT value FROM config WHERE key = 'admin_user'");
    const adminPass = await db.get("SELECT value FROM config WHERE key = 'admin_pass'");

    if (adminUser && adminPass && username === adminUser.value && await bcrypt.compare(password, adminPass.value)) {
      console.log('[Admin Login] Success');
      res.json({ success: true });
    } else {
      console.warn(`[Admin Login] Failed attempt for user: ${username}`);
      res.status(401).json({ success: false, message: 'Acceso denegado' });
    }
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    next(error);
  }
});

app.get('/api/users', async (req, res) => {
  const users = await db.all('SELECT id, username, role FROM users');
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hashedPass, role || 'User']);
    res.json({ success: true });
  } catch (e) {
    console.error('Error creating user:', e);
    res.status(400).json({ success: false, message: 'Error al crear usuario o el usuario ya existe' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const { username, password, role } = req.body;
  const { id } = req.params;
  try {
    if (password) {
      const hashedPass = await bcrypt.hash(password, 10);
      await db.run('UPDATE users SET username = $1, password = $2, role = $3 WHERE id = $4', [username, hashedPass, role || 'User', id]);
    } else {
      await db.run('UPDATE users SET username = $1, role = $2 WHERE id = $3', [username, role || 'User', id]);
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Error updating user:', e);
    res.status(400).json({ success: false, message: 'Error al actualizar usuario' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  await db.run('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// --- Categories ---
app.get('/api/categories', async (req, res) => {
  const categories = await db.all('SELECT * FROM categories');
  res.json(categories);
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  try {
    await db.run('INSERT INTO categories (name) VALUES ($1::text)', [name]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error creating category:', e);
    res.status(400).json({ success: false, message: 'La categoría ya existe o error de permisos' });
  }
});

app.patch('/api/categories/:id', async (req, res) => {
  const { name } = req.body;
  try {
    await db.run('UPDATE categories SET name = $1::text WHERE id = $2', [name, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error updating category:', e);
    res.status(400).json({ success: false, message: 'Error al actualizar categoría' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  await db.run('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// --- Products ---
app.get('/api/products', async (req, res) => {
  const products = await db.all('SELECT * FROM products');
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const { name, category_name, image } = req.body;
  try {
    await db.run('INSERT INTO products (name, category_name, image) VALUES ($1, $2, $3)', [name, category_name, image]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error creating product:', e);
    res.status(400).json({ success: false, message: 'Error al crear producto' });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  const { name, category_name, image } = req.body;
  try {
    await db.run('UPDATE products SET name = $1, category_name = $2, image = $3 WHERE id = $4', [name, category_name, image, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error updating product:', e);
    res.status(400).json({ success: false, message: 'Error al actualizar producto' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  await db.run('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// --- Orders ---
app.get('/api/orders', async (req, res) => {
  const orders = await db.all('SELECT * FROM orders ORDER BY id DESC');
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  try {
    console.log('Recibida petición de pedido:', req.body);
    const { username, items, status, date } = req.body;
    const result = await db.run('INSERT INTO orders (username, items, status, date) VALUES ($1, $2, $3, $4) RETURNING id', [username, JSON.stringify(items), status, date]);
    
    // Obtener el correo destino de la configuración
    const config = await db.get("SELECT value FROM config WHERE key = 'target_email'");
    console.log('Enviando email a:', config.value);
    
    // Enviar el correo
    await sendOrderEmail(config.value, { id: result.lastID, username, items: JSON.stringify(items), date });
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error creating order:', e);
    res.status(500).json({ success: false, message: 'Error al procesar el pedido' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await db.run('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error updating order:', e);
    res.status(400).json({ success: false, message: 'Error al actualizar pedido' });
  }
});

// --- Config ---
app.get('/api/config/:key', async (req, res) => {
  const row = await db.get('SELECT value FROM config WHERE key = $1::text', [req.params.key]);
  res.json({ [req.params.key]: row ? row.value : '' });
});

app.post('/api/config', async (req, res) => {
  const { key, value } = req.body;
  await db.run('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, value]);
  res.json({ success: true });
});

app.post('/api/config/test_email', async (req, res) => {
  try {
    const target = await db.get("SELECT value FROM config WHERE key = 'target_email'");
    const smtpPass = await db.get("SELECT value FROM config WHERE key = 'smtp_pass'");
    
    if (!target || !smtpPass) {
      throw new Error('Configuración incompleta');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: target.value,
        pass: smtpPass.value
      }
    });

    await transporter.sendMail({
      from: `"Supermercado CIMA" <${target.value}>`,
      to: target.value,
      subject: 'Prueba de Conexión - Supermercado CIMA',
      text: 'Si recibes esto, la configuración de tu App es correcta.'
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error en test de email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Actualizar Credenciales Admin ---
app.post('/api/admin/update_credentials', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (username) {
      await db.run("UPDATE config SET value = $1 WHERE key = 'admin_user'", [username.trim()]);
    }
    if (password) {
      const hashedPass = await bcrypt.hash(password.trim(), 10);
      await db.run("UPDATE config SET value = $1 WHERE key = 'admin_pass'", [hashedPass]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error al actualizar credenciales' });
  }
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
(async () => {
  try {
    // Probar conexión a PostgreSQL
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected');

    // Create tables (PostgreSQL dialect)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password TEXT,
        role VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        category_name VARCHAR(255),
        image TEXT,
        FOREIGN KEY(category_name) REFERENCES categories(name) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255),
        items TEXT,
        status VARCHAR(50),
        date VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);

    // Initial Data
    const adminUserExists = await db.get('SELECT * FROM users WHERE username = $1', ['admin']);
    if (!adminUserExists) {
      const hashedPass = await bcrypt.hash('1234', 10);
      await db.run('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', hashedPass, 'Admin']);
    }

    const adminConfigExists = await db.get('SELECT key FROM config WHERE key = $1', ['admin_user']);
    if (!adminConfigExists) {
      const hashedPass = await bcrypt.hash('1234', 10);
      await db.run("INSERT INTO config (key, value) VALUES ($1, $2)", ['admin_user', 'admin']);
      await db.run("INSERT INTO config (key, value) VALUES ($1, $2)", ['admin_pass', hashedPass]);
      await db.run("INSERT INTO config (key, value) VALUES ($1, $2)", ['target_email', 'tu-email@gmail.com']);
      await db.run("INSERT INTO config (key, value) VALUES ($1, $2)", ['smtp_pass', '']);
    }

    console.log('Database initialized');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor iniciado con éxito.`);
      console.log(`Acceso local: http://localhost:${PORT}`);
      console.log(`Acceso red: http://10.198.37.158:${PORT} (Verifica tu IP con ipconfig)`);
    });
  } catch (error) {
    console.error('Critical Error during initialization:', error);
    process.exit(1);
  }
})();
