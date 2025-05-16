import User from "../models/userModel.js";
import { generateOTP, sendSMS } from "../utils/otp.js";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const sendOTP = async (req, res) => {
  try {
    const { mobile, countryCode } = req.body;
    const fullMobile = `${countryCode}${mobile}`;

    const otp = generateOTP();
    console.log("Generated OTP:", otp);

    // Save OTP and expiry
    const user = await User.findOneAndUpdate(
      { mobile },
      {
        $set: {
          mobile,
          otp,
          otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
        },
      },
      { upsert: true, new: true }
    );

    // Send OTP via SMS
    await sendSMS(fullMobile, `Your OTP is: ${otp}`);

    res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Error sending OTP",
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile });
    console.log("user", user);

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Mobile number not found",
      });
    }

    if (!user.otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        status: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    // ✅ OTP is valid — clear it
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // ✅ Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      data: {
        token,
        user: {
          _id: user._id,
          mobile: user.mobile,
          name: user.name || "",
          email: user.email || "",
          isProfileComplete: Boolean(
            user.name &&
              user.email &&
              user.age &&
              user.i_am &&
              user.interested_in
          ),
        },
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Error verifying OTP",
    });
  }
};
