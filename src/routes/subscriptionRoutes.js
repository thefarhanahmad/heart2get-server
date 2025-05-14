import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getSubscriptionPlans,
  purchaseSubscription,
  getMySubscription,
  getSubscriptionHistory,
  capturePaypalPayment,
  successPayment,
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.get("/plans", getSubscriptionPlans);
router.get("/paypal-success", successPayment);

router.use(protect);

// Subscription routes
router.post("/purchase", purchaseSubscription);
router.post("/capture", capturePaypalPayment);
router.get("/my-subscription", getMySubscription);
router.get("/history", getSubscriptionHistory);

export default router;
