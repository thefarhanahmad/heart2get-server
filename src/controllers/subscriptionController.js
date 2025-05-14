import SubscriptionPlan from "../models/subscriptionPlanModel.js";
import UserSubscription from "../models/userSubscriptionModel.js";
import paypal from "@paypal/checkout-server-sdk";
import { client } from "../utils/paypal.js";

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: "active" })
      .select("-__v -status")
      .lean();

    res.status(200).json({
      status: true,
      plans,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const purchaseSubscription = async (req, res) => {
  try {
    const { plan_id, amount } = req.body;
    const userId = req.user._id;

    // Find the plan
    const plan = await SubscriptionPlan.findOne({
      _id: plan_id,
      status: "active",
    });
    if (!plan) {
      return res.status(404).json({
        status: false,
        message: "Subscription plan not found",
      });
    }

    // Create PayPal payment (order)
    const orderRequest = new paypal.orders.OrdersCreateRequest();
    orderRequest.prefer("return=representation");
    orderRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2), // Specify the subscription amount
          },
        },
      ],
      application_context: {
        brand_name: "Heart2Get",
        return_url: `https://heart2get-server.onrender.com/api/subscriptions/paypal-success?plan_id=${plan_id}&amount=${amount}`,
        cancel_url: `https://heart2get-server.onrender.com/api/subscriptions/paypal-cancel`,
        user_action: "PAY_NOW",
      },
    });

    const order = await client.execute(orderRequest);
    console.log("order is : ", order);

    // Redirect to PayPal for approval
    if (order.result.status === "CREATED") {
      const approvalUrl = order.result.links.find(
        (link) => link.rel === "approve"
      ).href;

      return res.status(200).json({
        status: true,
        message:
          "Payment created successfully. Please complete the payment via PayPal.",
        approvalUrl,
      });
    }

    res.status(500).json({
      status: false,
      message: "Unable to create PayPal payment order.",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const successPayment = async (req, res) => {
  const { token, plan_id, amount } = req.query;

  try {
    const captureRequest = new paypal.orders.OrdersCaptureRequest(token);
    captureRequest.requestBody({});
    const capture = await client.execute(captureRequest);

    if (capture.result.status === "COMPLETED") {
      // Optional: create subscription or update DB here

      // Redirect user to frontend success screen
      return res.redirect(`https://heart2get.com/payment-success`); // Or use deep link like myapp://success
    }

    return res.redirect(`https://heart2get.com/payment-failed`);
  } catch (error) {
    console.error("PayPal capture error:", error.message);
    return res.redirect(`https://heart2get.com/payment-failed`);
  }
};

export const capturePaypalPayment = async (req, res) => {
  try {
    const { token, plan_id, amount } = req.body;
    const userId = req.user._id;

    // Capture the payment
    const captureRequest = new paypal.orders.OrdersCaptureRequest(token);
    captureRequest.requestBody({});
    const captureResponse = await client.execute(captureRequest);

    if (captureResponse.status === "COMPLETED") {
      // Create the subscription
      const plan = await SubscriptionPlan.findOne({
        plan_id,
        status: "active",
      });
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      const subscription = await UserSubscription.create({
        user_id: userId,
        plan_id,
        start_date: startDate,
        end_date: endDate,
        payment_method: "paypal",
        transaction_id: captureResponse.id, // PayPal transaction ID
        amount,
        status: "active",
      });

      // Update user's subscription status
      await req.user.updateOne({ subscription: "premium" });

      res.status(200).json({
        status: true,
        message: "Subscription purchased successfully",
        subscription: {
          user_id: subscription.user_id,
          plan_id: subscription.plan_id,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          status: subscription.status,
        },
      });
    } else {
      res.status(500).json({
        status: false,
        message: "Payment capture failed",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await UserSubscription.findOne({
      user_id: userId,
      status: "active",
    }).lean();

    if (!subscription) {
      return res.status(200).json({
        status: true,
        subscription: null,
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
        days_remaining: Math.max(0, daysRemaining),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscriptions = await UserSubscription.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    const history = await Promise.all(
      subscriptions.map(async (sub) => {
        const plan = await SubscriptionPlan.findOne({ plan_id: sub.plan_id });
        return {
          plan_name: plan?.name || "Unknown Plan",
          price: sub.amount,
          purchased_on: sub.start_date,
          expires_on: sub.end_date,
          payment_method: sub.payment_method,
          transaction_id: sub.transaction_id,
        };
      })
    );

    res.status(200).json({
      status: true,
      history,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
