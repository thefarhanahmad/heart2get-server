import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};

// Get single user
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        status: false,
        message: 'User not found' 
      });
    }
    res.status(200).json({
      status: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};

// Create user
export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    const token = generateToken(savedUser._id);

    res.status(201).json({
      status: true,
      data: {
        user: savedUser,
        token
      }
    });
  } catch (error) {
    res.status(400).json({ 
      status: false,
      message: error.message 
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ 
        status: false,
        message: 'User not found' 
      });
    }
    res.status(200).json({
      status: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({ 
      status: false,
      message: error.message 
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        status: false,
        message: 'User not found' 
      });
    }
    res.status(200).json({ 
      status: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};