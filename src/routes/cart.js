const express = require('express');
const router = express.Router();

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

router.get('/', (req, res) => {
    const cart = req.cookies.cartShalom || {items: []};
    res.status(200).json(cart);
});

router.post('/', (req, res) => {
    const { itemId, quantity } = req.body;
    const cart = req.cookies.cartShalom;
    const existingItemIndex = cart.items.findIndex(item => item.itemId === itemId);
    console.log(req.body);
    if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({ itemId, quantity });
    }
    res.cookie('cartShalom', cart, { maxAge: SEVEN_DAYS, httpOnly: false });
    return res.status(200).json({message: 'Item added to cart successfully'});
});

router.patch('/', (req, res) => {
    const { itemId, quantity } = req.body;
    const cart = req.cookies.cartShalom;
    const existingItemIndex = cart.items.findIndex(item => item.itemId === itemId);
    console.log(req.body);
    if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity -= quantity;
        if (cart.items[existingItemIndex].quantity <= 0) {
            cart.items.splice(existingItemIndex, 1);
        }
        res.cookie('cartShalom', cart, { maxAge: SEVEN_DAYS, httpOnly: false });
        return res.status(200).json({message: 'Item deleted from cart successfully'});
    }
    return res.status(404).json({ message: 'Item not found in cart' });
});

module.exports = router;
