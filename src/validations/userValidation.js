import Joi from 'joi';

export const profileSchema = Joi.object({
  fullname: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  i_am: Joi.string().valid('Male', 'Female', 'Other').required(),
  interested_in: Joi.string().valid('Male', 'Female', 'Both').required(),
  age: Joi.number().min(18).max(120).required(),
  about: Joi.string().max(500).allow(''),
  likes: Joi.array().items(Joi.string()),
  interests: Joi.array().items(Joi.string()),
  hobbies: Joi.array().items(Joi.string()),
  skin_color: Joi.string(),
  height: Joi.number().min(100).max(250),
  weight: Joi.number().min(30).max(200),
  address: Joi.string(),
  category: Joi.string().valid('Casual Dating', 'Serious Relationship', 'Friendship').default('Casual Dating')
});

export const updateProfileSchema = Joi.object({
  fullname: Joi.string().min(2).max(50),
  about: Joi.string().max(500).allow(''),
  email: Joi.string().email(),
  birthdate: Joi.date(),
  genderPreference: Joi.string().valid('Male', 'Female', 'Both'),
  height: Joi.number().min(100).max(250),
  weight: Joi.number().min(30).max(200),
  likes: Joi.array().items(Joi.string()),
  interests: Joi.array().items(Joi.string()),
  hobbies: Joi.array().items(Joi.string()),
  skin_color: Joi.string(),
  address: Joi.string(),
  category: Joi.string().valid('Casual Dating', 'Serious Relationship', 'Friendship')
}).min(1);