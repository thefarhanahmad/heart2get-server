import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // Debug logs
      console.log('Received token:', token);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);

      // Find admin by decoded token data
      const admin = await Admin.findOne({
        _id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }).select('-password');

      if (!admin) {
        return res.status(401).json({
          status: false,
          message: 'Admin not found or unauthorized'
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.error('Token verification error:', error);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: false,
          message: 'Invalid token format or signature'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: false,
          message: 'Token has expired'
        });
      }

      return res.status(401).json({
        status: false,
        message: 'Token validation failed'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: false,
      message: 'Server error in authentication'
    });
  }
};