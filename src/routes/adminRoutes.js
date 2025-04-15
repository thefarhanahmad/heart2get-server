import express from 'express';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import {
  loginSchema,
  createAdminSchema,
  createUserSchema,
  updateUserSchema
} from '../validations/adminValidation.js';

// Import controllers
import * as authController from '../controllers/admin/authController.js';
import * as dashboardController from '../controllers/admin/dashboardController.js';
import * as userController from '../controllers/admin/userController.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/auth/login', validateRequest(loginSchema), authController.login);
router.post('/auth/create', validateRequest(createAdminSchema), authController.createAdmin);

// Protected routes (authentication required)
router.use(protectAdmin); // Apply admin authentication middleware to all routes below

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// User management routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getSingleUser);
router.post('/users', validateRequest(createUserSchema), userController.createUser);
router.put('/users/:id', validateRequest(updateUserSchema), userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

export default router;