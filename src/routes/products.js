const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => {
    pool.query('SELECT * FROM products', (error, results) => {
      if (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  });

module.exports = router;
