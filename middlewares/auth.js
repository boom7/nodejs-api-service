// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ message: 'Authentication failed!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).send({ message: 'User not found!' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ message: 'Authentication failed!' });
  }
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).send({ message: 'Permission denied!' });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };