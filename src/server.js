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
  let passwordHash = password;
  bcrypt.hash(password, 10, (err, hash) => {
    if(err) {
      console.log(err);
    } else {
      passwordHash = hash;
      console.log('Hashed password');
      const sql = 'INSERT INTO customers (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)'
      const values = [firstName, lastName, email, phoneNumber, passwordHash]
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

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  connection.query('SELECT * FROM admins WHERE username = ?', [email], (error, adminResults) => {
    if (error) {
      res.status(500).json({ error: 'Error querying admins table:', error });
    } else if (adminResults.length > 0) {
      const admin = adminResults[0];
      if (admin.password_hash == password) {
        res.status(200).json({ isAuthenticated: true, isAdmin: true, name: admin.username })
      } else {
        res.status(401).json({ isAuthenticated: false, isAdmin: false, error: 'Incorrect password' });
      }
    } else {
      connection.query('SELECT * FROM customers WHERE email = ?', [email], (error, results) => {
        if (error) {
          console.error('Error querying database:', error);
          res.status(500).json({ error: 'Error querying database' });
        } else if (results.length === 0) {
          res.status(404).json({ error: 'Email not found' });
        } else {
          const user = results[0];

          bcrypt.compare(password, user.password_hash, (err, result) => {
            if (err) {
              console.error('Error comparing passwords:', err);
              res.status(500).json({ error: 'Error comparing passwords' });
            } else if (result) {
              res.status(200).json({ isAuthenticated: true, isAdmin: false, name: user.first_name })
            } else {
              res.status(401).json({ isAuthenticated: false, isAdmin: false, error: 'Incorrect password' });
            }
          });
        };
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});