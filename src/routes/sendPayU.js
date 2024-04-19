const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

const APIkey = '4Vj8eK4rloUd272L48hsrarnUA';
const merchantId = '508029';
const accountId = '512321';
const currency = 'COP';

router.post('/', async (req, res) => {
    try {
        let requestData = req.body;
        console.log(requestData);
        const signature = `${APIkey}~${merchantId}~TestPayU~${requestData.amount}~${currency}`
        const hash = crypto.createHash('sha256');
        hash.update(signature);
        const encryptedSignature = hash.digest('hex');
        console.log(encryptedSignature);
        requestData = {...requestData,
        APIkey: APIkey,
        merchantId: merchantId,
        accountId: accountId,
        signature: encryptedSignature,
        currency: currency}
        res.status(200).send(requestData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error'})
    } 
})

module.exports = router;


// Create a SHA256 hash of the signature


