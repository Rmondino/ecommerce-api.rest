const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// Create
router.post('/', authMiddleware(), requireRole('admin'), async (req,res,next) => {
  try {
    const c = await Category.create(req.body);
    res.json({ success:true, data: c });
  } catch (err) { next(err); }
});

// List
router.get('/', async (req,res,next) => {
  try {
    const cats = await Category.find();
    res.json({ success:true, data: cats });
  } catch (err) { next(err); }
});

// Stats: products per category (aggregation)
router.get('/stats', async (req,res,next) => {
  try {
    const stats = await Product.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, category: '$category.name', count: 1 } }
    ]);
    res.json({ success:true, data: stats });
  } catch (err) { next(err); }
});

module.exports = router;
