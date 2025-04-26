import User from '../models/userModel.js';
import { generateOTP, sendSMS } from '../utils/otp.js';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    // Generate fixed OTP for testing
    const otp = generateOTP();

    // Save OTP to user document (create if not exists)
    const user = await User.findOneAndUpdate(
      { mobile },
      {
        mobile,
        otp,
        otpExpiry: Date.now() + 10 * 60 * 1000 // 10 minutes
      },
      { upsert: true, new: true }
    );

    // Send OTP via dummy SMS service
    await sendSMS(mobile, `Your OTP is: ${otp}`);

    res.status(200).json({
      status: true,
      message: "OTP sent successfully",
      // Include this in development mode only
      devInfo: {
        note: "For testing purposes, use OTP: 1234",
        expiresIn: "10 minutes"
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      status: false,
      message: error.message || 'Error sending OTP'
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile });
    console.log('user', user);

    if (!user || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        status: false,
        message: "OTP expired or invalid mobile number"
      });
    }
    // For development, accept both actual OTP and dummy OTP
    if (user.otp !== otp && otp !== '1234') {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP"
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      data: {
        token,
        user: {
          _id: user._id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          isProfileComplete: Boolean(user.name && user.email)
        }
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: false,
      message: error.message || 'Error verifying OTP'
    });
  }
};