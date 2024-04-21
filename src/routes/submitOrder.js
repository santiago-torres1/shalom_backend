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
const axios = require('axios');
const pool = require('../db');

const APIkey = '4Vj8eK4rloUd272L48hsrarnUA';
const merchantId = '508029';
const accountId = '512321';
const currency = 'COP';

router.post('/', async (req, res) => {

    const getReferenceCode = () => {
        const today = new Date();
        const offset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
        today.setTime(today.getTime() - offset); // Adjust time to UTC-5
        const year = today.getFullYear().toString().slice(-2);
        const month = ('0' + (today.getMonth() + 1)).slice(-2);
        const day = ('0' + today.getDate()).slice(-2);
        const hours = ('0' + today.getHours()).slice(-2);
        const minutes = ('0' + today.getMinutes()).slice(-2);
        const seconds = ('0' + today.getSeconds()).slice(-2);
        const datePart = year + month + day + hours + minutes + seconds;
        const randomPart = ('0000' + Math.floor(Math.random() * 10000)).slice(-4);
        return datePart + randomPart;
    };

    let referenceCode = getReferenceCode();
    console.log(referenceCode);
    let requestData = req.body;
    console.log(requestData.paymentType);
    const signature = `${APIkey}~${merchantId}~${referenceCode}~${requestData.amount}~${currency}`;
    const hash = crypto.createHash('sha256');
    hash.update(signature);
    const encryptedSignature = hash.digest('hex');
    requestData = {
        ...requestData,
        APIkey: APIkey,
        merchantId: merchantId,
        accountId: accountId,
        signature: encryptedSignature,
        currency: currency,
        referenceCode: referenceCode,
    };
    const orderData = {
        total_amount: requestData.amount,
        address: requestData.address,
        city: requestData.city,
        department: requestData.department,
        postal_code: requestData.postalCode,
        email: requestData.email,
        order_status: requestData.paymentType === 'PayU' ? '7' : '2',
        id_type: requestData.idType,
        id_number: requestData.idNumber,
        address_secondary: requestData.addressSecondary,
        special_instructions: requestData.specialInstructions,
        reference_number: referenceCode, 
    };

    const orderProducts = requestData.products.map(item => [
        referenceCode,
        item.id,
        item.quantity,
    ]);

    const orderSql = 'INSERT INTO orders SET ?';
    pool.query(orderSql, orderData, (orderError, orderResults) => {
        if (orderError) {
            console.error('Error inserting order data:', orderError);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log('Order data inserted successfully');
            const orderProductsSql = 'INSERT INTO order_products (order_id, product_id, quantity) VALUES ?';
            pool.query(orderProductsSql, [orderProducts], (productsError, productsResults) => {
                if (productsError) {
                    console.error('Error inserting order products:', productsError);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log('Order products inserted successfully');
                    res.status(200).send(requestData);
                }
            });
        }
    });
});

module.exports = router;



