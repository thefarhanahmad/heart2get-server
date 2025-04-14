// Simple OTP generator and dummy sender
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async (to, message) => {
  // Log the OTP for development purposes
  console.log('==================================');
  console.log('DUMMY SMS SERVICE');
  console.log(`Sending SMS to: ${to}`);
  console.log(`Message: ${message}`);
  console.log('==================================');
  
  // Simulate async behavior
  return new Promise(resolve => setTimeout(resolve, 1000));
};