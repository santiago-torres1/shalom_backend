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

router.post('/', (req, res) => {
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

router.put('/:id', (req, res) => {
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

router.delete('/:id', (req, res) => {
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

module.exports = router;
