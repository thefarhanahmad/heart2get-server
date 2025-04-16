import Interest from '../models/interestModel.js';

export const getAllInterests = async (req, res) => {
  try {
    const interests = await Interest.find({ status: 'active' })
      .select('_id name')
      .lean();

    const formattedInterests = interests.map(interest => ({
      id: interest._id,
      name: interest.name
    }));

    res.status(200).json({
      status: true,
      interests: formattedInterests
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};