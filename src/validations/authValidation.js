import Joi from "joi";

export const sendOtpSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{8,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile number must be 15 digits",
      "any.required": "Mobile number is required",
    }),
});

export const verifyOtpSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{8,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile number must be 15 digits",
      "any.required": "Mobile number is required",
    }),
  otp: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP must be 6 digits",
      "any.required": "OTP is required",
    }),
});
