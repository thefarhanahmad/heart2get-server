import Joi from 'joi';

export const purchaseSubscriptionSchema = Joi.object({
  plan_id: Joi.string().required(),
  payment_method: Joi.string().required(),
  transaction_id: Joi.string().required(),
  amount: Joi.number().positive().required()
});