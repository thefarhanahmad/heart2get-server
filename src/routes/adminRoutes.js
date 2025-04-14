import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
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

// Auth routes - /api/admin/auth/*
const authRouter = express.Router();
authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/create', validateRequest(createAdminSchema), authController.createAdmin);

// Dashboard routes - /api/admin/dashboard/*
const dashboardRouter = express.Router();
dashboardRouter.get('/stats', protect, dashboardController.getDashboardStats);

// User management routes - /api/admin/users/*
const userRouter = express.Router();
userRouter.get('/', protect, userController.getAllUsers);
userRouter.get('/:id', protect, userController.getSingleUser);
userRouter.post('/', protect, validateRequest(createUserSchema), userController.createUser);
userRouter.put('/:id', protect, validateRequest(updateUserSchema), userController.updateUser);
userRouter.delete('/:id', protect, userController.deleteUser);

// Register sub-routers
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', userRouter);

export default router;