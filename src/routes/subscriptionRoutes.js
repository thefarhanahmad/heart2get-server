import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { purchaseSubscriptionSchema } from '../validations/subscriptionValidation.js';
import {
  getSubscriptionPlans,
  purchaseSubscription,
  getMySubscription,
  getSubscriptionHistory
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Subscription routes
router.get('/plans', getSubscriptionPlans);
router.post('/purchase', validateRequest(purchaseSubscriptionSchema), purchaseSubscription);
router.get('/status', getMySubscription);
router.get('/history', getSubscriptionHistory);

export default router;