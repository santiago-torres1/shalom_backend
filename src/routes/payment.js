const express = require('express');
const router = express.Router();

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

router.get('/', (req, res) => {
    console.log(req);
    res.redirect('https://localhost:3000/')
});

router.post('/', (req, res) => {
    console.log(req);
    res.status(200).send('data received')
});

module.exports = router;
