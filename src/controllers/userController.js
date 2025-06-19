import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import genrateRtcToken from "../utils/agoraTokenGenerator.js";
import SubscriptionPlan from "../models/subscriptionPlanModel.js";

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
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
        message: "User not found",
      });
    }
    res.status(200).json({
      status: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
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
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      status: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message,
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
        message: "User not found",
      });
    }
    res.status(200).json({
      status: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//videocall route
export const videoCall = async (req, res) => {
  try {
    const callerId = req.user._id;
    const { receiverId } = req.body;

    const userPlan = await SubscriptionPlan.findOne({ user: callerId });
    console.log("user plan : ", userPlane);

    if (!userPlan) {
      return res.status(400).json({ message: "You have no active plans" });
    }

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    const channelName = `call_${callerId}_${receiverId}`;
    const callerUid = Date.now() % (2 ** 31 - 1);
    const receiverUid = callerUid + 1;

    const callerToken = genrateRtcToken(callerUid, channelName);
    const receiverToken = genrateRtcToken(receiverUid, channelName);
    return res.status(200).json({
      message: "Call tokens generated successfully",
      data: {
        caller: {
          channeltoken: callerToken,
          channelName: channelName,
          uniqueId: callerUid,
          agoraKey: process.env.AGORA_APPID,
          id: callerId,
          name: req.user.name,
        },
        receiver: {
          channeltoken: receiverToken,
          channelName: channelName,
          uniqueId: receiverUid,
          agoraKey: process.env.AGORA_APPID,
          id: receiverId,
          name: req.user.name,
          profile: req.user.profile_image,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error generating call tokens", error: error.message });
  }
};
