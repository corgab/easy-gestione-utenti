const mysql = require('mysql2');
require('dotenv').config() // Carico le variabili dall'env

// Connessione mysql
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
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
