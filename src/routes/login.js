const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/', (req, res) => {
    const { email, password } = req.body;
    pool.query('SELECT * FROM admins WHERE username = ?', [email], (error, adminResults) => {
      if (error) {
        res.status(500).json({ error: 'Error querying admins table:', error });
      } else if (adminResults.length > 0) {
        const admin = adminResults[0];
        if (admin.password_hash == password) {
          req.session.userData = {
            name: admin.username,
            isAdmin: true,
            isAuthenticated: true,
          }
          res.status(200).send(req.session.userData);
          console.log(req.session.userData);
        } else {
          res.status(401).json({ error: 'Incorrect password' });
        }
      } else {
        pool.query('SELECT * FROM customers WHERE email = ?', [email], (error, results) => {
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
                req.session.userData = {
                  name: user.first_name,
                  isAdmin: false,
                  isAuthenticated: true,
                }
                res.status(200).send(req.session.userData);
                console.log(req.session.userData);
              } else {
                res.status(401).json({ error: 'Incorrect password' });
              }
            });
          };
        });
      }
    });
  });

module.exports = router;
