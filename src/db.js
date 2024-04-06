const mysql = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

pool.on('connection', function (connection) {
    console.log('Connected to MySQL database');
  });
  
pool.on('error', function (error) {
console.error('Error connecting to MySQL database:', error);
});

module.exports = pool;
