const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const pool = require('./db.js');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const logoutRoute = require('./routes/logout');

const app = express();

app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
const THREE_HOURS = 3 * 60 * 60 * 1000;

const options = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
  createDatabaseTable: true,
}
const sessionStore = new MySQLStore(options, pool);

app.use(session({
  name: process.env.SESS_NAME,
  secret: process.env.SESS_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    maxAge: THREE_HOURS, 
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.get('/api/authenticated', (req, res) => {
  const userData = req.session.userData ? req.session.userData : { name: null, isAdmin: false, isAuthenticated: false};
  res.send(userData);
});

app.get('/api/products', (req, res) => {
  pool.query('SELECT * FROM products', (error, results) => {
    if (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/products', (req, res) => {
  const { name, description, imgurl, quantity, price } = req.body;
  pool.query('INSERT INTO products (name, description, imgurl, quantity, price) VALUES (?, ?, ?, ?, ?)',
      [name, description, imgurl, quantity, price],
      (error, results) => {
          if (error) {
              console.error('Error adding product:', error);
              res.status(500).json({ error: 'Internal Server Error' });
          } else {
              res.status(201).json({ message: 'Product added successfully' });
          }
      }
  );
});

app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const { name, description, imgurl, quantity, price } = req.body;
  pool.query('UPDATE products SET name = ?, description = ?, imgurl = ?, quantity = ?, price = ? WHERE id = ?',
      [name, description, imgurl, quantity, price, productId],
      (error, results) => {
          if (error) {
              console.error('Error editing product:', error);
              res.status(500).json({ error: 'Internal Server Error' });
          } else {
              res.json({ message: 'Product updated successfully' });
          }
      }
  );
});

app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  pool.query('DELETE FROM products WHERE id = ?', productId, (error, results) => {
      if (error) {
          console.error('Error removing product:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.json({ message: 'Product deleted successfully' });
      }
  });
});

app.use('/api/signup', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api/logout', logoutRoute)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});