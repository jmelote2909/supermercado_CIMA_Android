const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/database.sqlite');

db.get('SELECT value FROM config WHERE key = "target_email"', [], (err, row) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Target Email in DB:', row.value);
  db.close();
});
