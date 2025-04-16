import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const createAdminSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/),
  role: Joi.string().valid('admin', 'moderator', 'supervisor').default('admin')
});

export const updateAdminSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  mobile: Joi.string().pattern(/^[0-9]{10}$/),
  role: Joi.string().valid('admin', 'moderator', 'supervisor')
}).min(1);

export const updateAdminStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either active or inactive'
    })
});

export const assignRoleSchema = Joi.object({
  role: Joi.string()
    .valid('admin', 'moderator', 'supervisor')
    .required()
    .messages({
      'any.required': 'Role is required',
      'any.only': 'Invalid role specified'
    })
});

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  location: Joi.string().required(),
  age: Joi.number().min(18).max(120).required(),
  subscription: Joi.string().valid('free', 'premium').default('free'),
  about_us: Joi.string().allow(''),
  interest: Joi.array().items(Joi.string()),
  profile_image: Joi.string().allow('')
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  mobile: Joi.string(),
  gender: Joi.string().valid('Male', 'Female', 'Other'),
  location: Joi.string(),
  age: Joi.number().min(18).max(120),
  subscription: Joi.string().valid('free', 'premium'),
  about_us: Joi.string().allow(''),
  interest: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'inactive', 'banned'),
  profile_image: Joi.string().allow('')
}).min(1);

export const updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive', 'banned')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either active, inactive, or banned'
    })
});