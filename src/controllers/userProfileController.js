import User from "../models/userModel.js";

export const setupProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = {
      name: req.body.name,
      email: req.body.email,
      country_code: req.body.country_code,
      i_am: req.body.i_am,
      interested_in: req.body.interested_in,
      age: req.body.age,
      about: req.body.about,
      likes: req.body.likes,
      interests: req.body.interests,
      hobbies: req.body.hobbies,
      skin_color: req.body.skin_color,
      height: req.body.height,
      weight: req.body.weight,
      address: req.body.address,
      category: req.body.category,
      marital_status: req.body.marital_status,
      profession: req.body.profession,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, profileData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      profile: {
        i_am: updatedUser.i_am,
        interested_in: updatedUser.interested_in,
        name: updatedUser.name,
        country_code: updatedUser.country_code,
        profession: updatedUser.profession,
        marital_status: updatedUser.marital_status,
        age: updatedUser.age,
        about: updatedUser.about,
        likes: updatedUser.likes,
        interests: updatedUser.interests,
        hobbies: updatedUser.hobbies,
        skin_color: updatedUser.skin_color,
        height: updatedUser.height,
        weight: updatedUser.weight,
        category: updatedUser.category,
        email: updatedUser.email,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

export const getMatches = async (req, res) => {
  try {
    const { category, age_min, age_max, city } = req.query; // <-- city liya hai
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const query = {
      _id: { $ne: req.user.id }, // apne aap ko exclude
      status: "active",
      i_am:
        user.interested_in === "Both"
          ? { $in: ["Male", "Female", "Other"] }
          : user.interested_in,
      interested_in: { $in: [user.i_am, "Both"] },
    };

    if (category) {
      query.category = category;
    }

    if (age_min && age_max) {
      query.age = { $gte: parseInt(age_min), $lte: parseInt(age_max) };
    }

    if (city) {
      query["address.city"] = new RegExp(city, "i"); // <-- case insensitive city search
    }

    const matches = await User.find(query)
      .select("name age address profile_image about category")
      .limit(20)
      .lean();

    const formattedMatches = matches.map((match) => ({
      id: match._id,
      name: match.name,
      age: match.age,
      country: match.address?.country || "",
      city: match.address?.city || "",
      profile_image: match.profile_image,
      about: match.about,
      category: match.category,
    }));

    res.status(200).json({
      status: true,
      matches: formattedMatches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {};

    // Fields that should be parsed from the request body directly
    const jsonFields = ["likes", "interests", "hobbies", "address"];

    jsonFields.forEach((key) => {
      if (req.body[key]) {
        updateData[key] = req.body[key]; // No need for JSON.parse
      }
    });

    // Handle all other plain fields
    const fields = [
      "name",
      "email",
      "mobile",
      "i_am",
      "country_code",
      "interested_in",
      "age",
      "about",
      "skin_color",
      "height",
      "weight",
      "profession",
      "marital_status",
      "category",
      "subscription",
      "status",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    console.log("req files to update profile image : ", req.files);

    // Handle file uploads if any
    if (req.files?.profile_image?.[0]) {
      const filename = req.files.profile_image[0].filename;
      updateData.profile_image = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${filename}`;
    }

    if (req.files?.banner_image?.[0]) {
      const filename = req.files.banner_image[0].filename;
      updateData.cover_image = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

// Get User Details by ID
export const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id; // Get user ID from the URL params

    // Fetch the user from the database by ID
    const user = await User.findById(userId).lean().populate("interests");

    // If user not found, return a 404 response
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Return the user data as response
    res.status(200).json({
      status: true,
      message: "User details fetched successfully",
      user: {
        id: user._id,
        i_am: user.i_am,
        name: user.name,
        email: user.email,
        age: user.age,
        about: user.about,
        interests: user.interests,
        hobbies: user.hobbies,
        profile_image: user.profile_image,
        category: user.category,
        address: user.address,
        likes: user.likes,
        skin_color: user.skin_color,
        height: user.height,
        weight: user.weight,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
