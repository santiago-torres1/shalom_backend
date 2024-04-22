const express = require('express');
const router = express.Router();
const pool = require('../db.js'); // Assuming you have a pool configured for your database connection

// Route to fetch orders
router.get('/', (req, res) => {
    const { orderBy, search } = req.query;
    let queryString = `
                SELECT
                    o.reference_number AS referenceNumber,
                    o.order_name AS orderName,
                    o.email AS email,
                    o.address AS address,
                    o.address_secondary AS addressSecondary,
                    o.special_instructions AS specialInstructions,
                    o.city AS city,
                    o.department AS department,
                    o.postal_code AS postalCode,
                    o.id_type AS idType,
                    o.id_number AS idNumber,
                    GROUP_CONCAT(op.product_id SEPARATOR ', ') AS productIds,
                    GROUP_CONCAT(op.quantity SEPARATOR ', ') AS quantities,
                    CONVERT_TZ(o.order_date, '+00:00', '-05:00') AS orderDate,
                    o.total_amount AS totalAmount,
                    o.order_status AS orderStatus
                FROM
                    orders o
                LEFT JOIN
                    order_products op ON o.reference_number = op.order_id
                    `;

    const conditions = [];
    const queryParams = [];
    if (search) {
        conditions.push(`(o.reference_number LIKE ? OR o.order_name LIKE ? OR o.email LIKE ?)`);
        const searchParam = `%${search}%`;
        queryParams.push(searchParam, searchParam, searchParam);
    }

    if (conditions.length > 0) {
        queryString += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryString += ` GROUP BY o.reference_number`;
    if (orderBy) {
        queryString += ` ORDER BY ${orderBy}`;
    }

    pool.query(queryString, queryParams, async (error, results) => {
        if (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            for (const order of results) {
                if (order.productIds && order.quantities) {
                    const productIds = order.productIds.split(',');
                    const quantities = order.quantities.split(',');
                    const products = [];
    
                    // Create an array of promises for each product query
                    const productPromises = productIds.map((productId, index) => {
                        return new Promise((resolve, reject) => {
                            pool.query('SELECT name FROM products WHERE id = ?', [productId], (error, results) => {
                                if (error) {
                                    console.error('Error fetching product info:', error);
                                    reject(error);
                                } else {
                                    const productInfo = results[0];
                                    const { name } = productInfo;
                                    products.push({ productId, quantity: quantities[index], name });
                                    resolve();
                                }
                            });
                        });
                    });
    
                    // Wait for all product queries to complete
                    await Promise.all(productPromises);
    
                    order.products = products;
                    delete order.productIds;
                    delete order.quantities;
                }
            }
            console.log(results);
            res.json(results);
        }
    });
});

router.put('/:referenceNumber', async (req, res) => {
    const { referenceNumber } = req.params;
    const { orderStatus, trackingId } = req.body;

    try {
        let updateQuery = 'UPDATE orders SET order_status = ? WHERE reference_number = ?';
        const queryParams = [orderStatus, referenceNumber];

        // If tracking ID is provided, add it to the update query
        if (trackingId) {
            updateQuery = 'UPDATE orders SET order_status = ?, tracking_id = ? WHERE reference_number = ?';
            queryParams.unshift(trackingId);
        }

        // Update the order status (and tracking ID if provided) in the database
        await pool.query(updateQuery, queryParams);

        // Send a success response
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;