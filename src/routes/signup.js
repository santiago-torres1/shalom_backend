const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/', (req, res) => {
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
        pool.query(sql, values, (error, results) => {
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
module.exports = router;
