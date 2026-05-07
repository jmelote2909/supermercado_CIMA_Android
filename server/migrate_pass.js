const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.sqlite');
const bcrypt = require('bcryptjs');

db.serialize(async () => {
  // Hash Admin Panel password
  const adminPass = '1234';
  const hashedAdmin = await bcrypt.hash(adminPass, 10);
  db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('admin_user', 'admin')");
  db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('admin_pass', ?)", [hashedAdmin]);
  console.log('Admin Panel password hashed.');

  // Hash existing user passwords (if they are not already hashed)
  db.all("SELECT id, password FROM users", async (err, rows) => {
    if (err) return console.error(err);
    for (const row of rows) {
      // Very simple check: if it doesn't look like a bcrypt hash (starts with $2), hash it
      if (!row.password.startsWith('$2')) {
        const hashed = await bcrypt.hash(row.password, 10);
        db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, row.id]);
        console.log(`User ID ${row.id} password hashed.`);
      }
    }
  });
});
