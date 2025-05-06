import Joi from 'joi';

export const sendOtpSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be 10 digits',
      'any.required': 'Mobile number is required'
    })
});

export const verifyOtpSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be 10 digits',
      'any.required': 'Mobile number is required'
    }),
  otp: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be 6 digits',
      'any.required': 'OTP is required'
    })
});