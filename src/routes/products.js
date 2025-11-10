const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// Create product (admin)
router.post('/', authMiddleware(), requireRole('admin'), async (req,res,next) => {
  try {
    const p = await Product.create(req.body);
    res.json({ success:true, data: p });
  } catch (err) { next(err); }
});

// List products with category
router.get('/', async (req,res,next) => {
  try {
    const prods = await Product.find().populate('category');
    res.json({ success:true, data: prods });
  } catch (err) { next(err); }
});

// Filter by price range and brand: /filtro?min=10&max=100&brand=X
router.get('/filtro', async (req,res,next) => {
  try {
    const min = parseFloat(req.query.min) || 0;
    const max = parseFloat(req.query.max) || Number.MAX_SAFE_INTEGER;
    const brand = req.query.brand;
    const q = { price: { $gte: min, $lte: max } };
    if (brand) q.brand = brand;
    const prods = await Product.find(q);
    res.json({ success:true, data: prods });
  } catch (err) { next(err); }
});

// Top products by number of reviews
router.get('/top', async (req,res,next) => {
  try {
    const agg = await Product.aggregate([
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'reviews' } },
      { $project: { name:1, nReviews: { $size: '$reviews' }, avgRating: { $avg: '$reviews.rating' } } },
      { $sort: { nReviews: -1 } },
      { $limit: 10 }
    ]);
    res.json({ success:true, data: agg });
  } catch (err) { next(err); }
});

// Update stock
router.patch('/:id/stock', authMiddleware(), requireRole('admin'), async (req,res,next) => {
  try {
    const { stock } = req.body;
    const p = await Product.findByIdAndUpdate(req.params.id, { $set: { stock } }, { new:true });
    res.json({ success:true, data: p });
  } catch (err) { next(err); }
});

module.exports = router;
