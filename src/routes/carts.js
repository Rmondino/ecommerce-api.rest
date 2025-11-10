const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware } = require('../middlewares/auth');

// Get cart for user
router.get('/:userId', authMiddleware(), async (req,res,next) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate('items.product');
    if (!cart) return res.status(404).json({ success:false, error: 'Cart not found' });
    res.json({ success:true, data: cart });
  } catch (err) { next(err); }
});

// Get total
router.get('/:userId/total', authMiddleware(), async (req,res,next) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate('items.product');
    if (!cart) return res.status(404).json({ success:false, error: 'Cart not found' });
    let total = 0;
    const items = cart.items.map(it => {
      const subtotal = (it.product.price || 0) * it.quantity;
      total += subtotal;
      return { product: it.product, quantity: it.quantity, subtotal };
    });
    res.json({ success:true, data: { items, total } });
  } catch (err) { next(err); }
});

// Add or update item
router.post('/:userId', authMiddleware(), async (req,res,next) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) cart = await Cart.create({ user: req.params.userId, items: [] });
    const found = cart.items.find(i => i.product.toString() === productId);
    if (found) {
      found.quantity = quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
    const populated = await cart.populate('items.product');
    res.json({ success:true, data: populated });
  } catch (err) { next(err); }
});

// Remove item
router.delete('/:userId/:productId', authMiddleware(), async (req,res,next) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) return res.status(404).json({ success:false, error: 'Cart not found' });
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
    res.json({ success:true, data: cart });
  } catch (err) { next(err); }
});

module.exports = router;
