import QuizQuestion from '../../models/quizQuestionModel.js';
import QuizCategory from '../../models/quizCategoryModel.js';
import User from '../../models/userModel.js';

// Question Management
export const createQuestion = async (req, res) => {
    try {
        const question = await QuizQuestion.create(req.body);

        res.status(201).json({
            status: true,
            message: "Question added successfully",
            question: {
                id: question._id,
                question: question.question,
                type: question.type,
                category_id: question.category_id,
                points: question.points,
                options: question.options,
                required: question.required,
            }
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

export const getAllQuestions = async (req, res) => {
    try {
        const questions = await QuizQuestion.find()
            .populate('category_id', 'name')
            .lean();

        console.log('question list', questions);
        const formattedQuestions = questions.map(q => ({
            id: q._id,
            question: q.question,
            type: q.type,
            category: {
                id: q.category_id._id,
                name: q.category_id.name
            },
            points: q.points,
            options: q.options,
            required: q.required,
        }));

        res.status(200).json({
            status: true,
            questions: formattedQuestions
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const question = await QuizQuestion.findById(req.params.id)
            .populate('category_id', 'name')
            .lean();

        if (!question) {
            return res.status(404).json({
                status: false,
                message: "Question not found"
            });
        }

        res.status(200).json({
            status: true,
            question: {
                id: question._id,
                question: question.question,
                type: question.type,
                category: {
                    id: question.category_id._id,
                    name: question.category_id.name
                },
                points: question.points,
                options: question.options,
                required: question.required,
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const question = await QuizQuestion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({
                status: false,
                message: "Question not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Question updated successfully"
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const question = await QuizQuestion.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({
                status: false,
                message: "Question not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Question deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// Category Management
export const createCategory = async (req, res) => {
    try {
        const category = await QuizCategory.create(req.body);

        res.status(201).json({
            status: true,
            message: "Category added successfully",
            category: {
                id: category._id,
                name: category.name,
                description: category.description
            }
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const categories = await QuizCategory.find().lean();

        res.status(200).json({
            status: true,
            categories: categories.map(cat => ({
                id: cat._id,
                name: cat.name,
                description: cat.description,
                status: cat.status
            }))
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const category = await QuizCategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                status: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Category updated successfully",
            data: {
                id: category._id,
                name: category.name,
                description: category.description
            }
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const category = await QuizCategory.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                status: false,
                message: "Category not found"
            });
        }

        // Delete all questions in this category
        await QuizQuestion.deleteMany({ category_id: req.params.id });

        res.status(200).json({
            status: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const getQuizDashboardStats = async (req, res) => {
    try {
        const totalQuizzes = await QuizQuestion.countDocuments();

        // Calculate average score (dummy data for now)
        const averageScore = 7.4;

        // Calculate completion rate (dummy data for now)
        const completionRate = "82%";

        // Calculate match rate (dummy data for now)
        const matchRate = "64%";

        res.status(200).json({
            status: true,
            data: {
                total_quizzes: totalQuizzes,
                average_score: averageScore,
                completion_rate: completionRate,
                match_rate: matchRate
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};