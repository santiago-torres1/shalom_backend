const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db.js');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const productsRoute = require('./routes/products');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const logoutRoute = require('./routes/logout');

const app = express();

app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

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
const sessionStore = new MySQLStore(options);

app.use(session({
  name: process.env.SESS_NAME,
  secret: process.env.SESS_SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: THREE_HOURS, 
    sameSite: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.get('/api/authenticated', (req, res) => {
  console.log(req.sessionID);
  console.log(req.session.userData);
  const userData = req.session.userData || {name: null, isAdmin: false, isAuthenticated: false};
  res.json(userData);
});

app.use('/api/products', productsRoute);
app.use('/api/signup', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api/logout', logoutRoute)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});