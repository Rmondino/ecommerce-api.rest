const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// Create order from cart
router.post('/', authMiddleware(), async (req,res,next) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) return res.status(400).json({ success:false, error: 'Cart empty' });
    const items = cart.items.map(i => ({ product: i.product._id, quantity: i.quantity, subtotal: (i.product.price||0)*i.quantity }));
    const total = items.reduce((s,i)=>s+(i.subtotal||0),0);
    const order = await Order.create({ user: userId, items, total, paymentMethod: req.body.paymentMethod });
    // clear cart
    cart.items = [];
    await cart.save();
    res.json({ success:true, data: order });
  } catch (err) { next(err); }
});

// List orders (admin)
router.get('/', authMiddleware(), requireRole('admin'), async (req,res,next) => {
  try {
    const orders = await Order.find().populate('user');
    res.json({ success:true, data: orders });
  } catch (err) { next(err); }
});

// Stats: total orders by status
router.get('/stats', authMiddleware(), requireRole('admin'), async (req,res,next) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success:true, data: stats });
  } catch (err) { next(err); }
});

// Orders of a user (owner or admin)
router.get('/user/:userId', authMiddleware(), async (req,res,next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) 
      return res.status(403).json({ success:false, error: 'Forbidden' });
    const orders = await Order.find({ user: req.params.userId }).populate('items.product');
    res.json({ success:true, data: orders });
  } catch (err) { next(err); }
});

// Update status (admin)
router.patch('/:id/status', authMiddleware(), requireRole('admin'), async (req,res,next) => {
  try {
    const { status } = req.body;
    const o = await Order.findByIdAndUpdate(req.params.id, { $set: { status } }, { new:true });
    res.json({ success:true, data: o });
  } catch (err) { next(err); }
});

module.exports = router;
