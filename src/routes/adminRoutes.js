import express from 'express';
import multer from 'multer';
import path from 'path';

import { protectAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import * as adminController from '../controllers/admin/adminController.js';
import * as authController from '../controllers/admin/authController.js';
import * as userController from '../controllers/admin/userController.js';
import * as quizController from '../controllers/admin/quizController.js';
import * as notificationController from '../controllers/admin/notificationController.js';
import * as paymentController from '../controllers/admin/paymentController.js';
import * as reportController from '../controllers/admin/reportController.js';
import * as interestController from '../controllers/admin/interestController.js';
import * as subscriptionController from '../controllers/admin/subscriptionController.js';
import * as dashboardController from '../controllers/admin/dashboardController.js';
import * as profileController from '../controllers/admin/profileController.js';
import * as activityLogController from '../controllers/admin/activityLogController.js';

import {
  createQuestionSchema,
  updateQuestionSchema,
  createCategorySchema,
  updateCategorySchema
} from '../validations/quizValidation.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});


const router = express.Router();

// Auth Routes
router.post('/auth/login', authController.login);

// Admin Management
router.post('/admins', protectAdmin, adminController.createAdmin);
router.get('/admins', protectAdmin, adminController.getAllAdmins);
router.get('/admins/:id', protectAdmin, adminController.getAdminById);
router.put('/admins/:id', protectAdmin, adminController.updateAdmin);
router.delete('/admins/:id', protectAdmin, adminController.deleteAdmin);
router.patch('/admins/:id/status', protectAdmin, adminController.updateAdminStatus);
router.post('/admins/:id/assign-role', protectAdmin, adminController.assignRole);

// User Management
router.get('/users', protectAdmin, userController.getAllUsers);
router.get('/users/:id', protectAdmin, userController.getSingleUser);
router.post('/users', protectAdmin, userController.createUser);
router.put('/users/:id', protectAdmin, userController.updateUser);
router.delete('/users/:id', protectAdmin, userController.deleteUser);
router.patch('/users/:id/status', protectAdmin, userController.updateUserStatus);
router.get('/users/premium', protectAdmin, userController.getPremiumUsers);

// Quiz Management
router.post('/quiz/questions', protectAdmin, validateRequest(createQuestionSchema), quizController.createQuestion);
router.get('/quiz/questions', protectAdmin, quizController.getAllQuestions);
router.get('/quiz/questions/:id', protectAdmin, quizController.getQuestionById);
router.put('/quiz/questions/:id', protectAdmin, validateRequest(updateQuestionSchema), quizController.updateQuestion);
router.delete('/quiz/questions/:id', protectAdmin, quizController.deleteQuestion);

router.post('/quiz/categories', protectAdmin, validateRequest(createCategorySchema), quizController.createCategory);
router.get('/quiz/categories', protectAdmin, quizController.getAllCategories);
router.put('/quiz/categories/:id', protectAdmin, validateRequest(updateCategorySchema), quizController.updateCategory);
router.delete('/quiz/categories/:id', protectAdmin, quizController.deleteCategory);

router.get('/quiz/dashboard', protectAdmin, quizController.getQuizDashboardStats);

// Notification Management
router.get('/notifications', protectAdmin, notificationController.getAllNotifications);
router.delete('/notifications/:id', protectAdmin, notificationController.deleteNotification);
router.put('/notifications/:id/read', protectAdmin, notificationController.markAsRead);
router.delete('/notifications/clear', protectAdmin, notificationController.clearAllNotifications);

// Payment Management
router.get('/payments', protectAdmin, paymentController.getAllPayments);
router.put('/payments/:payment_id', protectAdmin, paymentController.updatePayment);
router.delete('/payments/:payment_id', protectAdmin, paymentController.deletePayment);

// Report Management
router.get('/reports', protectAdmin, reportController.getAllReports);
router.put('/reports/:reportId', protectAdmin, reportController.updateReportStatus);
router.get('/users/banned', protectAdmin, reportController.getBannedUsers);
router.put('/users/:user_id/ban', protectAdmin, reportController.banUser);

// Interest Management
router.post('/interests', protectAdmin, interestController.createInterest);
router.get('/interests', protectAdmin, interestController.getAllInterests);
router.get('/interests/:id', protectAdmin, interestController.getInterestById);
router.put('/interests/:id', protectAdmin, interestController.updateInterest);
router.delete('/interests/:id', protectAdmin, interestController.deleteInterest);

// Subscription Management
router.post('/subscriptions', protectAdmin, subscriptionController.createSubscriptionPlan);
router.get('/subscriptions', protectAdmin, subscriptionController.getAllSubscriptionPlans);
router.get('/subscriptions/:id', protectAdmin, subscriptionController.getSubscriptionPlanById);
router.put('/subscriptions/:id', protectAdmin, subscriptionController.updateSubscriptionPlan);
router.patch('/subscriptions/:id/status', protectAdmin, subscriptionController.updatePlanStatus);
router.put('/subscriptions/:subscription_id/expire', protectAdmin, subscriptionController.expireUserSubscription);

// Dashboard
router.get('/dashboard', protectAdmin, dashboardController.getDashboardStats);

// Profile Routes
router.get('/profile', protectAdmin, profileController.getProfile);
router.put('/profile/update', protectAdmin, upload.single('profile_image'), profileController.updateProfile);
router.put('/profile/change-password', protectAdmin, profileController.changePassword);

// Activity Log Routes
// Activity Log Routes
router.get('/activity-logs', protectAdmin, activityLogController.getAllLogs);
router.post('/activity-logs', protectAdmin, activityLogController.createLog);
router.delete('/activity-logs/all', protectAdmin, activityLogController.clearAllLogs); // Changed from /clear to /all
router.delete('/activity-logs/:id', protectAdmin, activityLogController.deleteLog);


export default router;