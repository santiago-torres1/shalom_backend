const express = require('express');
const router = express.Router();

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

router.get('/', (req, res) => {
    const cart = req.cookies.cartShalom || {items: []};
    res.status(200).json(cart);
});

router.post('/', (req, res) => {
    const { itemId, quantity } = req.body;
    if (!req.cookies.cartShalom) {
        res.cookie('cartShalom', JSON.stringify({ items: [{ itemId, quantity }] }), { maxAge: SEVEN_DAYS, httpOnly: true });
        res.status(200).json({ message: 'Cart created successfully' });
    }
    const cart = req.cookies.cartShalom;
    const existingItemIndex = cart.items.findIndex(item => item.itemId === itemId);
    if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({ itemId, quantity });
    }
    res.cookie('cartShalom', cart, { maxAge: SEVEN_DAYS, httpOnly: false });
    res.status(200).json({message: 'Item added to cart successfully'});
});

router.delete('/', (req, res) => {
    const { itemId, quantity } = req.body;
    if (!req.cookies.cartShalom) {
        res.status(404).json({ message: 'Cart not found' });
    }
    const cart = req.cookies.cartShalom;
    const existingItemIndex = cart.items.findIndex(item => item.itemId === itemId);
    if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity -= quantity;
        if (cart.items[existingItemIndex].quantity <= 0) {
            cart.items.splice(existingItemIndex, 1);
        }
        res.cookie('cartShalom', cart, { maxAge: SEVEN_DAYS, httpOnly: false });
        res.status(200).json({message: 'Item deleted from cart successfully'});
    }
    res.status(404).json({ message: 'Item not found in cart' });
});

module.exports = router;
