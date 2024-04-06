const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'Error destroying session' });
        } else {
            res.status(200).json({ message: 'Logout successful' });
        }
    });
});

module.exports = router;