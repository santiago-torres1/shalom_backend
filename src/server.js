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
  store: sessionStore,
  cookie: {
    maxAge: THREE_HOURS, 
    sameSite: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.get('/api/authenticated', (req, res) => {
  const userData = req.session.userData ? req.session.userData : { name: null, isAdmin: false, isAuthenticated: false};
  res.send(userData);
});

app.use('/api/products', productsRoute);
app.use('/api/signup', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api/logout', logoutRoute)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});