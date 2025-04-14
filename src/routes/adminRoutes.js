import express from 'express';
import { 
  login, 
  createAdmin, 
  getDashboardStats,
  getAllUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import {
  loginSchema,
  createAdminSchema,
  createUserSchema,
  updateUserSchema
} from '../validations/adminValidation.js';

const router = express.Router();

// Auth routes
router.post('/login', validateRequest(loginSchema), login);
router.post('/create', validateRequest(createAdminSchema), createAdmin);

// Protected routes
router.get('/dashboard', protect, getDashboardStats);
router.get('/users', protect, getAllUsers);
router.get('/users/:id', protect, getSingleUser);
router.post('/users', protect, validateRequest(createUserSchema), createUser);
router.put('/users/:id', protect, validateRequest(updateUserSchema), updateUser);
router.delete('/users/:id', protect, deleteUser);

export default router;