import mongoose from 'mongoose';

const interestCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    color: {
        type: String,
        default: '#000000',
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

const InterestCategory = mongoose.model('InterestCategory', interestCategorySchema);

export default InterestCategory;