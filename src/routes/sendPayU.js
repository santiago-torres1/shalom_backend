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
        const getReferenceCode = () => {
            const today = new Date();
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
        const referenceCode = getReferenceCode();
        let requestData = req.body;
        const signature = `${APIkey}~${merchantId}~${referenceCode}~${requestData.amount}~${currency}`
        const hash = crypto.createHash('sha256');
        hash.update(signature);
        const encryptedSignature = hash.digest('hex');
        console.log(encryptedSignature);
        requestData = {...requestData,
        APIkey: APIkey,
        merchantId: merchantId,
        accountId: accountId,
        signature: encryptedSignature,
        currency: currency,
        referenceCode: referenceCode, }
        console.log(requestData);
        res.status(200).send(requestData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error'})
    } 
})

module.exports = router;


// Create a SHA256 hash of the signature


