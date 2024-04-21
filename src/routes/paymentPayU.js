/*
codigos de estado:
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

const APIkey = '4Vj8eK4rloUd272L48hsrarnUA';

const checkSignature = (signature, data, type) => {
    const { ...dataWithoutSignature } = data;
    const dataString = APIkey + '~' + Object.values(dataWithoutSignature).join('~');
    const hash = crypto.createHash(type);
    hash.update(dataString);
    const generatedSignature = hash.digest('hex');
    console.log(generatedSignature, 'and', signature)
    return generatedSignature === signature;
};

const roundCurrency = (currency) => {
    const decimalCurrency = parseFloat(currency);
    const multipliedCurrency = decimalCurrency*10; //1232.5
    const firstDecimal = Math.floor(multipliedCurrency % 10);
    const secondDecimal = Math.floor((multipliedCurrency * 10) % 10);
    let roundedCurrency;
    if (secondDecimal === 5) {
        if (firstDecimal % 2 === 0) {
            roundedCurrency = Math.floor(multipliedCurrency) / 10;
        } else {
            roundedCurrency = Math.ceil(multipliedCurrency) / 10;
        }
    } else {
        roundedCurrency = Math.round(multipliedCurrency) / 10;
    }

    return roundedCurrency.toFixed(1); 
};

const roundCurrencyPost = (currency) => {
    const decimalCurrency = parseFloat(currency);
    const multipliedCurrency = decimalCurrency*10; //1232.5
    const firstDecimal = Math.floor(multipliedCurrency % 10);
    const secondDecimal = Math.floor((multipliedCurrency * 10) % 10);
    if (secondDecimal === 0) {
        return (decimalCurrency.toFixed(1));
    } else {
        return (decimalCurrency);
    }
}


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
