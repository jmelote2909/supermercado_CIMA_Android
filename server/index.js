const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const dbPath = path.resolve(__dirname, 'database.sqlite');

let db;

(async () => {
  // Open database
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category_name TEXT,
      image TEXT,
      FOREIGN KEY(category_name) REFERENCES categories(name)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      items TEXT,
      status TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initial Data
  const adminUserExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminUserExists) {
    const hashedPass = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPass, 'Admin']);
  }

  const adminConfigExists = await db.get('SELECT key FROM config WHERE key = "admin_user"');
  if (!adminConfigExists) {
    const hashedPass = await bcrypt.hash('1234', 10);
    await db.run("INSERT INTO config (key, value) VALUES ('admin_user', 'admin')");
    await db.run("INSERT INTO config (key, value) VALUES ('admin_pass', ?)", [hashedPass]);
    await db.run("INSERT INTO config (key, value) VALUES ('target_email', 'tu-email@gmail.com')");
    await db.run("INSERT INTO config (key, value) VALUES ('smtp_pass', '')");
  }

  console.log('Database initialized');
})();


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
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUser = await db.get('SELECT value FROM config WHERE key = "admin_user"');
  const adminPass = await db.get('SELECT value FROM config WHERE key = "admin_pass"');

  if (adminUser && adminPass && username === adminUser.value && await bcrypt.compare(password, adminPass.value)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Acceso denegado' });
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
    await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPass, role || 'User']);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'El usuario ya existe' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const { username, password, role } = req.body;
  const { id } = req.params;
  try {
    if (password) {
      const hashedPass = await bcrypt.hash(password, 10);
      await db.run('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?', [username, hashedPass, role || 'User', id]);
    } else {
      await db.run('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role || 'User', id]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Error al actualizar usuario' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
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
    await db.run('INSERT INTO categories (name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'La categoría ya existe' });
  }
});

app.patch('/api/categories/:id', async (req, res) => {
  const { name } = req.body;
  await db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/categories/:id', async (req, res) => {
  await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- Products ---
app.get('/api/products', async (req, res) => {
  const products = await db.all('SELECT * FROM products');
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const { name, category_name, image } = req.body;
  await db.run('INSERT INTO products (name, category_name, image) VALUES (?, ?, ?)', [name, category_name, image]);
  res.json({ success: true });
});

app.patch('/api/products/:id', async (req, res) => {
  const { name, category_name, image } = req.body;
  await db.run('UPDATE products SET name = ?, category_name = ?, image = ? WHERE id = ?', [name, category_name, image, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
  await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- Orders ---
app.get('/api/orders', async (req, res) => {
  const orders = await db.all('SELECT * FROM orders ORDER BY id DESC');
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  console.log('Recibida petición de pedido:', req.body);
  const { username, items, status, date } = req.body;
  const result = await db.run('INSERT INTO orders (username, items, status, date) VALUES (?, ?, ?, ?)', [username, JSON.stringify(items), status, date]);
  
  // Obtener el correo destino de la configuración
  const config = await db.get('SELECT value FROM config WHERE key = "target_email"');
  console.log('Enviando email a:', config.value);
  
  // Enviar el correo
  await sendOrderEmail(config.value, { id: result.lastID, username, items: JSON.stringify(items), date });
  
  res.json({ success: true });
});

app.patch('/api/orders/:id', async (req, res) => {
  const { status } = req.body;
  await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true });
});

// --- Config ---
app.get('/api/config/:key', async (req, res) => {
  const row = await db.get('SELECT value FROM config WHERE key = ?', [req.params.key]);
  res.json({ [req.params.key]: row ? row.value : '' });
});

app.post('/api/config', async (req, res) => {
  const { key, value } = req.body;
  await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value]);
  res.json({ success: true });
});

app.post('/api/config/test_email', async (req, res) => {
  try {
    const target = await db.get('SELECT value FROM config WHERE key = "target_email"');
    const smtpPass = await db.get('SELECT value FROM config WHERE key = "smtp_pass"');
    
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

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
