const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());


const connection = mysql.createConnection({
  host: 'db-shalom.cds6c28ae9a0.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Concentrix*2022*',
  database: 'db_shalom',
});


connection.connect((error) => {
  if (error) {
    console.error('Error connecting to MySQL database:', error);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.get('/api/products', (req, res) => {
  connection.query('SELECT * FROM products', (error, results) => {
    if (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/signup', (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, confirmPassword } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if(err) {
      console.log(err);
    } else {
      password = hash;
      console.log('Hashed password');
      const sql = 'INSERT INTO customers (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)'
      const values = [firstName, lastName, email, phoneNumber, password]
      connection.query(sql, values, (error, results) => {
        if (error) {
          console.error('Error creating account:', error);
          res.status(500).json({error: 'Error creating account'});
        } else {
          console.log('Account created successfully');
          res.status(200).json({ message: 'Account created successfully'});
        }
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});