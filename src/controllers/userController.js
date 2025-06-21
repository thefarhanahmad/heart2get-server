import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import genrateRtcToken from "../utils/agoraTokenGenerator.js";
import UserSubscription from "../models/userSubscriptionModel.js";
import CallLog from "../models/callLog.js";

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

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    // Check subscription plans for both users
    const callerPlan = await UserSubscription.findOne({
      user_id: callerId,
      status: "active",
    });
    const receiverPlan = await UserSubscription.findOne({
      user_id: receiverId,
      status: "active",
    });

    const callerHasPlan = !!callerPlan;
    const receiverHasPlan = !!receiverPlan;

    // Set call duration
    let callDuration;

    // Check if they have previously used the free call
    const previousFreeCall = await CallLog.findOne({
      $or: [
        { caller: callerId, receiver: receiverId },
        { caller: receiverId, receiver: callerId },
      ],
      wasFreeCall: true,
    });

    if (callerHasPlan && receiverHasPlan) {
      callDuration = -1;
    } else if (!callerHasPlan && !receiverHasPlan) {
      if (previousFreeCall) {
        return res.status(403).json({
          message:
            "You’ve already used your free video call. Please purchase a plan to continue.",
        });
      }
      callDuration = 2 * 60;
    } else {
      callDuration = -1;
    }

    const channelName = `call_${callerId}_${receiverId}`;
    const callerUid = Date.now() % (2 ** 31 - 1);
    const receiverUid = callerUid + 1;

    const callerToken = genrateRtcToken(callerUid, channelName);
    const receiverToken = genrateRtcToken(receiverUid, channelName);

    return res.status(200).json({
      message: "Call tokens generated successfully",
      data: {
        callDuration,
        bothHavePlan: callerHasPlan && receiverHasPlan,
        callerHasPlan,
        receiverHasPlan,
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
