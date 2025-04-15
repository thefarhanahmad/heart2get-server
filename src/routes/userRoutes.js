import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { profileSchema } from '../validations/userValidation.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import {
  setupProfile,
  getMatches
} from '../controllers/userProfileController.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Profile routes
router.post('/profile/setup', validateRequest(profileSchema), setupProfile);
router.get('/matches', getMatches);

// Basic user routes
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;