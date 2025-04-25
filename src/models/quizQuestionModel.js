import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    is_correct: {
        type: Boolean,
        default: false
    }
});

const quizQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['single', 'multiple'],
        required: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizCategory',
        required: true
    },
    points: {
        type: Number,
        required: true,
        min: 1
    },
    options: [optionSchema],
    required: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

export default QuizQuestion;