import Joi from 'joi';

export const createQuestionSchema = Joi.object({
    question: Joi.string().required(),
    type: Joi.string().valid('single', 'multiple').required(),
    category_id: Joi.string().required(),
    points: Joi.number().min(1).required(),
    options: Joi.array().items(
        Joi.object({
            text: Joi.string().required(),
            is_correct: Joi.boolean().required()
        })
    ).min(2).required()
});

export const updateQuestionSchema = Joi.object({
    question: Joi.string(),
    type: Joi.string().valid('single', 'multiple'),
    category_id: Joi.string(),
    points: Joi.number().min(1),
    options: Joi.array().items(
        Joi.object({
            text: Joi.string().required(),
            is_correct: Joi.boolean().required()
        })
    ).min(2)
}).min(1);

export const createCategorySchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string()
});

export const updateCategorySchema = Joi.object({
    name: Joi.string(),
    description: Joi.string()
}).min(1);