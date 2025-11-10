const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// Register
// http://localhost:3000/api/usuarios
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success:false, error: 'Email already used' });
    const user = await User.create({ name, email, password, role });
    // create empty cart
    await Cart.create({ user: user._id, items: [] });
    res.json({ success:true, data: user });
  } catch (err) { next(err); }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success:false, error: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ success:false, error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ success:true, data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) { next(err); }
});

// List users (admin)
//http://localhost:3000/api/usuarios/login 
//{
// "email": "pepen@mail.com",
//  "password": "133455"
//}

router.get('/', authMiddleware(), requireRole('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success:true, data: users });
  } catch (err) { next(err); }
});

// Get user detail
router.get('/:id', authMiddleware(false), async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select('-password');
    if (!u) return res.status(404).json({ success:false, error: 'Not found' });
    res.json({ success:true, data: u });
  } catch (err) { next(err); }
});

// Delete user (and cart)
router.delete('/:id', authMiddleware(), requireRole('admin'), async (req, res, next) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return res.status(404).json({ success:false, error:'Not found' });
    await Cart.findOneAndDelete({ user: req.params.id });
    res.json({ success:true, data: 'deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
