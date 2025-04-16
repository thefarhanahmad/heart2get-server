import Joi from 'joi';

export const createSubscriptionPlanSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().min(0).required(),
  duration_days: Joi.number().min(1).required(),
  features: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'inactive').default('active'),
  isPopular: Joi.boolean().default(false),
  description: Joi.string()
});

export const updateSubscriptionPlanSchema = Joi.object({
  name: Joi.string(),
  price: Joi.number().min(0),
  duration_days: Joi.number().min(1),
  features: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'inactive'),
  isPopular: Joi.boolean(),
  description: Joi.string()
}).min(1);

export const updatePlanStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either active or inactive'
    })
});

export const purchaseSubscriptionSchema = Joi.object({
  plan_id: Joi.string().required(),
  payment_method: Joi.string().required(),
  transaction_id: Joi.string().required(),
  amount: Joi.number().min(0).required()
});