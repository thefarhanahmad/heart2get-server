import User from '../models/userModel.js';

export const setupProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = {
      name: req.body.fullname,
      email: req.body.email,
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
      category: req.body.category
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      profileData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Profile updated successfully',
      profile: {
        i_am: updatedUser.i_am,
        interested_in: updatedUser.interested_in,
        fullname: updatedUser.name,
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
        address: updatedUser.address
      }
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message
    });
  }
};

export const getMatches = async (req, res) => {
  try {
    const { category, age_min, age_max, city } = req.query;
    const user = await User.findById(req.user.id);

    const query = {
      _id: { $ne: req.user.id },
      status: 'active',
      i_am: user.interested_in,
      interested_in: user.i_am
    };

    if (category) {
      query.category = category;
    }

    if (age_min && age_max) {
      query.age = { $gte: parseInt(age_min), $lte: parseInt(age_max) };
    }

    if (city) {
      query.address = new RegExp(city, 'i');
    }

    const matches = await User.find(query)
      .select('name age address profile_image about category')
      .limit(20)
      .lean();

    const formattedMatches = matches.map(match => ({
      id: match._id,
      name: match.name,
      age: match.age,
      city: match.address,
      profile_image: match.profile_image,
      about: match.about,
      category: match.category
    }));

    res.status(200).json({
      status: true,
      matches: formattedMatches
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};