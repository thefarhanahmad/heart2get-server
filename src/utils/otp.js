import twilio from "twilio";

// Twilio config from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// ✅ 1. Real 4-digit OTP Generator
export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates 1000-9999
};

// ✅ 2. Real SMS Sender using Twilio
export const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: to,
    });
    console.log(`✅ SMS sent to ${to}. SID: ${result.sid}`);
  } catch (error) {
    console.error("❌ Failed to send SMS via Twilio:", error.message);
    throw new Error("Failed to send SMS. Please try again.");
  }
};
