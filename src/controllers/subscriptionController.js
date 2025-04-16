import SubscriptionPlan from '../models/subscriptionPlanModel.js';
import UserSubscription from '../models/userSubscriptionModel.js';

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: 'active' })
      .select('-__v -status')
      .lean();

    res.status(200).json({
      status: true,
      plans
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const purchaseSubscription = async (req, res) => {
  try {
    const { plan_id, payment_method, transaction_id, amount } = req.body;
    const userId = req.user._id;

    // Find the plan
    const plan = await SubscriptionPlan.findOne({ plan_id, status: 'active' });
    if (!plan) {
      return res.status(404).json({
        status: false,
        message: 'Subscription plan not found'
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create subscription
    const subscription = await UserSubscription.create({
      user_id: userId,
      plan_id,
      start_date: startDate,
      end_date: endDate,
      payment_method,
      transaction_id,
      amount,
      status: 'active'
    });

    // Update user's subscription status
    await req.user.updateOne({ subscription: 'premium' });

    res.status(200).json({
      status: true,
      message: 'Subscription purchased successfully',
      subscription: {
        user_id: subscription.user_id,
        plan_id: subscription.plan_id,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await UserSubscription.findOne({
      user_id: userId,
      status: 'active'
    }).lean();

    if (!subscription) {
      return res.status(200).json({
        status: true,
        subscription: null
      });
    }

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      status: true,
      subscription: {
        plan_id: subscription.plan_id,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status,
        days_remaining: Math.max(0, daysRemaining)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscriptions = await UserSubscription.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    const history = await Promise.all(subscriptions.map(async (sub) => {
      const plan = await SubscriptionPlan.findOne({ plan_id: sub.plan_id });
      return {
        plan_name: plan?.name || 'Unknown Plan',
        price: sub.amount,
        purchased_on: sub.start_date,
        expires_on: sub.end_date,
        payment_method: sub.payment_method,
        transaction_id: sub.transaction_id
      };
    }));

    res.status(200).json({
      status: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};