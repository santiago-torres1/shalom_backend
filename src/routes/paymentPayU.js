/*
codigos de estado:
1 - pago pendiente
2 - pago aprobado
3 - pago rechazado
4 - enviado
5 - recibido
6 - cancelado
*/

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db')

const APIkey = '4Vj8eK4rloUd272L48hsrarnUA';

const checkSignature = (signature, data, type) => {
    const { ...dataWithoutSignature } = data;
    const dataString = APIkey + '~' + Object.values(dataWithoutSignature).join('~');
    const hash = crypto.createHash(type);
    hash.update(dataString);
    const generatedSignature = hash.digest('hex');
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
            const redirectURL = `http://localhost:3000/payment-confirmation?transactionState=${getResponse.transactionState}&referenceCode=${getResponse.referenceCode}&buyerEmail=${getResponse.buyerEmail}`
            res.redirect(redirectURL)
        } else {
            res.redirect('https://www.tiendashalom.top/payment-error')
        }
    } catch (error) {
        console.log('There was an error during your request:', error);
    }
});

router.post('/', (req, res) => {
    const postResponse = req.body;
    let { sign, merchant_id, reference_sale, value, currency, state_pol } = postResponse;
    value = roundCurrencyPost(value);
    const filteredData = { merchant_id, reference_sale, value, currency, state_pol };
    checkSignature(sign, filteredData, 'sha256');
    res.status(200).send('data received')
});

module.exports = router;
