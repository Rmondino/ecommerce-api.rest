const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authMiddleware(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      if (required) return res.status(401).json({ success: false, error: 'No token' });
      req.user = null;
      return next();
    }
    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ success: false, error: 'User not found' });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ success: false, error: 'Forbidden: requires ' + role });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
