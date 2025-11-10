const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authMiddleware } = require('../middlewares/auth');

// List all reviews with user and product
router.get('/', async (req,res,next) => {
  try {
    const reviews = await Review.find().populate('user').populate('product');
    res.json({ success:true, data: reviews });
  } catch (err) { next(err); }
});

// Reviews for a product
router.get('/product/:productId', async (req,res,next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user');
    res.json({ success:true, data: reviews });
  } catch (err) { next(err); }
});

// Top: average rating per product
router.get('/top', async (req,res,next) => {
  try {
    const agg = await Review.aggregate([
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id:0, product: '$product.name', avgRating:1, count:1 } },
      { $sort: { avgRating: -1 } }
    ]);
    res.json({ success:true, data: agg });
  } catch (err) { next(err); }
});

// Create review only if user bought the product
router.post('/', authMiddleware(), async (req,res,next) => {
  try {
    const userId = req.user._id;
    const { productId, rating, comment } = req.body;
    const bought = await Order.findOne({ user: userId, 'items.product': productId });
    if (!bought) return res.status(400).json({ success:false, error: 'User did not buy this product' });
    const r = await Review.create({ user: userId, product: productId, rating, comment });
    // push review id to product.reviews
    await Product.findByIdAndUpdate(productId, { $push: { reviews: r._id } });
    res.json({ success:true, data: r });
  } catch (err) { next(err); }
});

module.exports = router;
