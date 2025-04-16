import Joi from 'joi';

export const createInterestSchema = Joi.object({
    name: Joi.string()
        .required()
        .messages({
            'any.required': 'Interest name is required'
        })
});

export const updateInterestSchema = Joi.object({
    name: Joi.string()
        .required()
        .messages({
            'any.required': 'Interest name is required'
        })
});