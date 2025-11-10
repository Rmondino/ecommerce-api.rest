/*
Run this file manually with node to create an admin user for testing:
node src/seed/seedAdmin.js

Make sure MONGO_URI is set in .env
*/
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommercenode';

mongoose.connect(MONGO).then(async () => {
  const existing = await User.findOne({ email: 'admin@local' });
  if (existing) {
    console.log('admin exists');
    process.exit(0);
  }
  const admin = await User.create({ name: 'Admin', email: 'admin@local', password: 'admin123', role: 'admin' });
  console.log('created admin', admin.email);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
