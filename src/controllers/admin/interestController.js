import Interest from '../../models/interestModel.js';

export const createInterest = async (req, res) => {
    try {
        const interest = await Interest.create(req.body);

        res.status(201).json({
            status: true,
            message: "Interest added successfully",
            interest: {
                id: interest._id,
                name: interest.name
            }
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

export const getAllInterests = async (req, res) => {
    try {
        const interests = await Interest.find().lean();

        res.status(200).json({
            status: true,
            interests: interests.map(interest => ({
                id: interest._id,
                name: interest.name,
                status: interest.status
            }))
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const getInterestById = async (req, res) => {
    try {
        const interest = await Interest.findById(req.params.id).lean();

        if (!interest) {
            return res.status(404).json({
                status: false,
                message: "Interest not found"
            });
        }

        res.status(200).json({
            status: true,
            interest: {
                id: interest._id,
                name: interest.name,
                status: interest.status
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const updateInterest = async (req, res) => {
    try {
        const interest = await Interest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!interest) {
            return res.status(404).json({
                status: false,
                message: "Interest not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Interest updated successfully",
            interest: {
                id: interest._id,
                name: interest.name
            }
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

export const deleteInterest = async (req, res) => {
    try {
        const interest = await Interest.findByIdAndDelete(req.params.id);

        if (!interest) {
            return res.status(404).json({
                status: false,
                message: "Interest not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Interest deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};