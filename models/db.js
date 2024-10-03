const mysql = require('mysql2');

// Connessione mysql
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'user_management',
  port: 8889
});

// Gestione errori
db.connect((err) => {
  if (err) {
    console.error('Errore di connessione a mysql:', err);
    return;
  }
  console.log('Connessione a mysql riuscita');
});

module.exports = db;
