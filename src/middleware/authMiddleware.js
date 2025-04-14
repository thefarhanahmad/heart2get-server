import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];

        if (!token) {
          return res.status(401).json({
            status: false,
            message: 'Not authorized, no token provided'
          });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
          return res.status(401).json({
            status: false,
            message: 'Invalid token format'
          });
        }

        // Get admin from token
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
          return res.status(401).json({
            status: false,
            message: 'Not authorized, admin not found'
          });
        }

        // Add admin to request object
        req.admin = admin;
        next();
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          status: false,
          message: 'Not authorized, token expired or invalid'
        });
      }
    } else {
      return res.status(401).json({
        status: false,
        message: 'Not authorized, no token provided'
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