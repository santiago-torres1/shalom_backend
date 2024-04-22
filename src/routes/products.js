const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => {
  pool.query('SELECT p.*, pi.image_url, pi.is_main FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id', (error, results) => {
    if (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Group the results by product ID and collect image URLs into an array
      const productsWithImages = results.reduce((acc, product) => {
        const productId = product.id;
        if (!acc[productId]) {
          acc[productId] = { ...product, images: [] };
        }
        if (product.image_url) {
          const imageObj = { url: product.image_url, isMain: product.is_main };
          if (product.is_main === 'Y') {
            acc[productId].images.unshift(imageObj);
          } else {
            acc[productId].images.push(imageObj);
          }
        }
        delete acc[productId].image_url; // Remove the individual image URL from the product object
        delete acc[productId].is_main; // Remove is_main from the product object
        return acc;
      }, {});
      console.log(Object.values(productsWithImages)[7].images);
      res.json(Object.values(productsWithImages)); // Convert the object to an array and send as response
    }
  });
});

router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  pool.query('SELECT p.*, pi.image_url, pi.is_main FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id WHERE p.id = ?', [productId], (error, results) => {
    if (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      // Group the results by product ID and collect image URLs into an array
      const productWithImages = results.reduce((acc, product) => {
        if (!acc.id) {
          acc = { ...product, images: [] };
        }
        if (product.image_url) {
          acc.images.push({ url: product.image_url, isMain: product.is_main });
        }
        delete acc.image_url; // Remove the individual image URL from the product object
        delete acc.is_main; // Remove is_main from the product object
        return acc;
      }, {});
      res.json(productWithImages); // Send the product object with image URLs as response
    }
  });
});

router.post('/', (req, res) => {
  const { name, description, images, quantity, price } = req.body;
  pool.getConnection((err, connection) => {
      if (err) {
          console.error('Error getting database connection:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }
      connection.beginTransaction(async (transactionErr) => {
          if (transactionErr) {
              console.error('Error beginning transaction:', transactionErr);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
          }
          try {
              const productInsertResult = await new Promise((resolve, reject) => {
                  connection.query(
                      'INSERT INTO products (name, description, quantity, price) VALUES (?, ?, ?, ?)',
                      [name, description, quantity, price],
                      (insertError, results) => {
                          if (insertError) {
                              reject(insertError);
                              return;
                          }
                          resolve(results);
                      }
                  );
              });
              const productId = productInsertResult.insertId;
              const insertImagePromises = images.map((image) => {
                  return new Promise((resolve, reject) => {
                      connection.query(
                          'INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)',
                          [productId, image.url, image.isMain],
                          (imageInsertError, results) => {
                              if (imageInsertError) {
                                  reject(imageInsertError);
                                  return;
                              }
                              resolve(results);
                          }
                      );
                  });
              });
              await Promise.all(insertImagePromises);
              connection.commit((commitErr) => {
                  if (commitErr) {
                      console.error('Error committing transaction:', commitErr);
                      connection.rollback(() => {
                          console.error('Transaction rolled back.');
                          res.status(500).json({ error: 'Internal Server Error' });
                      });
                      return;
                  }
                  res.status(201).json({ message: 'Product and images added successfully' });
              });
          } catch (error) {
              console.error('Error adding product and images:', error);
              connection.rollback(() => {
                  console.error('Transaction rolled back.');
                  res.status(500).json({ error: 'Internal Server Error' });
              });
          } finally {
              connection.release();
          }
      });
  });
});


router.put('/:id', (req, res) => {
  const productId = req.params.id;
  const { name, description, images, quantity, price } = req.body; 
  pool.getConnection((err, connection) => {
      if (err) {
          console.error('Error getting database connection:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }
      connection.beginTransaction(async (transactionErr) => {
          if (transactionErr) {
              console.error('Error beginning transaction:', transactionErr);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
          }
          try {
              // Update the product details in the 'products' table
              await new Promise((resolve, reject) => {
                  connection.query(
                      'UPDATE products SET name = ?, description = ?, quantity = ?, price = ? WHERE id = ?',
                      [name, description, quantity, price, productId],
                      (updateError, results) => {
                          if (updateError) {
                              reject(updateError);
                              return;
                          }
                          resolve(results);
                      }
                  );
              });
              // Delete existing product images
              await new Promise((resolve, reject) => {
                  connection.query(
                      'DELETE FROM product_images WHERE product_id = ?',
                      [productId],
                      (deleteError, results) => {
                          if (deleteError) {
                              reject(deleteError);
                              return;
                          }
                          resolve(results);
                      }
                  );
              });
              // Insert new product images
              const insertImagePromises = images.map((image) => {
                  return new Promise((resolve, reject) => {
                      connection.query(
                          'INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)',
                          [productId, image.url, image.isMain],
                          (imageInsertError, results) => {
                              if (imageInsertError) {
                                  reject(imageInsertError);
                                  return;
                              }
                              resolve(results);
                          }
                      );
                  });
              });

              await Promise.all(insertImagePromises);

              connection.commit((commitErr) => {
                  if (commitErr) {
                      console.error('Error committing transaction:', commitErr);
                      connection.rollback(() => {
                          console.error('Transaction rolled back.');
                          res.status(500).json({ error: 'Internal Server Error' });
                      });
                      return;
                  }
                  res.status(200).json({ message: 'Product updated successfully' });
              });
          } catch (error) {
              console.error('Error updating product:', error);
              connection.rollback(() => {
                  console.error('Transaction rolled back.');
                  res.status(500).json({ error: 'Internal Server Error' });
              });
          } finally {
              connection.release();
          }
      });
  });
});

router.delete('/:id', (req, res) => {
  const productId = req.params.id;
  pool.getConnection((err, connection) => {
      if (err) {
          console.error('Error getting database connection:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      connection.beginTransaction(async (transactionErr) => {
          if (transactionErr) {
              console.error('Error beginning transaction:', transactionErr);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
          }

          try {
              // Delete rows from product_images associated with the product ID
              await new Promise((resolve, reject) => {
                  connection.query(
                      'DELETE FROM product_images WHERE product_id = ?',
                      productId,
                      (deleteError, deleteResults) => {
                          if (deleteError) {
                              reject(deleteError);
                              return;
                          }
                          resolve(deleteResults);
                      }
                  );
              });

              // Now delete the product itself
              connection.query(
                  'DELETE FROM products WHERE id = ?',
                  productId,
                  (error, results) => {
                      if (error) {
                          console.error('Error removing product:', error);
                          res.status(500).json({ error: 'Internal Server Error' });
                      } else {
                          // Commit the transaction
                          connection.commit((commitErr) => {
                              if (commitErr) {
                                  console.error('Error committing transaction:', commitErr);
                                  connection.rollback(() => {
                                      console.error('Transaction rolled back.');
                                      res.status(500).json({ error: 'Internal Server Error' });
                                  });
                                  return;
                              }
                              res.json({ message: 'Product and associated images deleted successfully' });
                          });
                      }
                  }
              );
          } catch (error) {
              console.error('Error deleting product and associated images:', error);
              connection.rollback(() => {
                  console.error('Transaction rolled back.');
                  res.status(500).json({ error: 'Internal Server Error' });
              });
          } finally {
              connection.release();
          }
      });
  });
});

module.exports = router;
