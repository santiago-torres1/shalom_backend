/*
codigos de estado:
0 - error
1 - pago aprobado
2 - pago pendiente
3 - pago rechazado
4 - enviado
5 - recibido
6 - cancelado
7 - pago siendo procesado por el cliente
8 - pago siendo procesado por PayU (efecty)
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const getResponse = req.query;
        let { signature, merchantId, referenceCode, TX_VALUE, currency, transactionState } = getResponse;
        TX_VALUE = roundCurrency(TX_VALUE);
        const filteredData = { merchantId, referenceCode, TX_VALUE, currency, transactionState };
        if(checkSignature(signature, filteredData, 'md5')){
            const redirectURL = `https://www.tiendashalom.top/payment-confirmation?transactionState=${getResponse.transactionState}&referenceCode=${getResponse.referenceCode}&buyerEmail=${getResponse.buyerEmail}`
            res.redirect(redirectURL)
        } else {
            res.redirect('https://www.tiendashalom.top/payment-error')
        }
    } catch (error) {
        console.log('There was an error during your request:', error);
    }
});

router.post('/', async (req, res) => {
    const postResponse = req.body;
    let { sign, merchant_id, reference_sale, value, currency, state_pol } = postResponse;
    value = roundCurrencyPost(value);
    const filteredData = { merchant_id, reference_sale, value, currency, state_pol };

    if (!checkSignature(sign, filteredData, 'sha256')) {
        return res.status(400).send('Invalid signature');
    }

    try {
        if (state_pol === '4') {
            const products = await getOrderProducts(reference_sale);
            await updateProductQuantities(products);
            await changeOrderStatus(reference_sale, '2'); 
            res.status(200).send('Order approved');
        } else if (state_pol === '6') {
            await changeOrderStatus(reference_sale, '3'); 
            res.status(200).send('Order declined');
        } else if (state_pol === '5') {
            await deleteOrderProducts([reference_sale]);
            await deleteOrder([reference_sale]);
            res.status(200).send('Order deleted due to payment timeout');
        } else {
            res.status(400).send('Unknown state');
        }
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).send('Error processing order');
    }
});

const getOrderProducts = (orderId) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM order_products WHERE order_id = ?', [orderId], (error, results) => {
            if (error) {
                console.error('Error querying order products:', error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

const updateProductQuantities = (products) => {
    return new Promise((resolve, reject) => {
        const updates = products.map(product => {
            return new Promise((resolveUpdate, rejectUpdate) => {
                pool.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [product.quantity, product.product_id], (error, results) => {
                    if (error) {
                        console.error('Error updating product quantity:', error);
                        rejectUpdate(error);
                    } else {
                        resolveUpdate();
                    }
                });
            });
        });

        Promise.all(updates)
            .then(() => resolve())
            .catch(error => reject(error));
    });
};

const changeOrderStatus = (orderId, status) => {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE orders SET status = ? WHERE reference_number = ?', [status, orderId], (error, results) => {
            if (error) {
                console.error('Error changing order status:', error);
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

const deleteOrderProducts = (orderId) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM order_products WHERE order_id = ?', [orderId], (error, results) => {
            if (error) {
                console.error('Error querying order products:', error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

const deleteOrder = (orderId) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM orders WHERE reference_number = ?', [orderId], (error, results) => {
            if (error) {
                console.error('Error querying order products:', error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

module.exports = router;
