import User from '../../models/userModel.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find()
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      location: user.location,
      age: user.age,
      subscription: user.subscription,
      about_us: user.about_us,
      interest: user.interest,
      status: user.status,
      profile_image: user.profile_image,
      created_at: user.createdAt,
      match_list: {
        matched_count: user.match_list?.matched_count || 0,
        matched_users: user.match_list?.matched_users || []
      },
      report: {
        reported_count: user.report?.reported_count || 0,
        reports: user.report?.reports || []
      }
    }));

    res.status(200).json({
      status: true,
      message: "User list fetched successfully",
      data: {
        current_page: page,
        total_pages: totalPages,
        total_users: totalUsers,
        users: formattedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      location: user.location,
      age: user.age,
      subscription: user.subscription,
      about_us: user.about_us,
      interest: user.interest,
      status: user.status,
      profile_image: user.profile_image,
      created_at: user.createdAt,
      match_list: {
        matched_count: user.match_list?.matched_count || 0,
        matched_users: user.match_list?.matched_users || []
      },
      report: {
        reported_count: user.report?.reported_count || 0,
        reports: user.report?.reports || []
      }
    };

    res.status(200).json({
      status: true,
      message: "User fetched successfully",
      data: formattedUser
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      status: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile_image: user.profile_image,
        status: user.status,
        created_at: user.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      location: user.location,
      age: user.age,
      subscription: user.subscription,
      about_us: user.about_us,
      interest: user.interest,
      status: user.status,
      profile_image: user.profile_image,
      created_at: user.createdAt,
      match_list: {
        matched_count: user.match_list?.matched_count || 0,
        matched_users: user.match_list?.matched_users || []
      },
      report: {
        reported_count: user.report?.reported_count || 0,
        reports: user.report?.reports || []
      }
    };

    res.status(200).json({
      status: true,
      message: "User updated successfully",
      data: formattedUser
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid status value"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "User status updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const getPremiumUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPremiumUsers = await User.countDocuments({ subscription: 'premium' });
    const totalPages = Math.ceil(totalPremiumUsers / limit);

    const premiumUsers = await User.find({ subscription: 'premium' })
      .select('name mobile category subscription status createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedUsers = premiumUsers.map(user => ({
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      category: user.category,
      isPremium: true,
      status: user.status,
      joined_at: user.createdAt
    }));

    res.status(200).json({
      status: true,
      message: "Premium users fetched successfully",
      data: {
        current_page: page,
        total_pages: totalPages,
        total_users: totalPremiumUsers,
        users: formattedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};