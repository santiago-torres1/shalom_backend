const express = require('express');
const router = express.Router();

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

router.get('/', (req, res) => {
    console.log(req);
    res.redirect('/')
});

router.post('/', (req, res) => {
    console.log(req);
});

module.exports = router;
