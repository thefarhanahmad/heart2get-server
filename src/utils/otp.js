// Simple OTP generator and dummy sender
export const generateOTP = () => {
  // For testing purposes, always generate '123456' as OTP
  return '123456';
};

export const sendSMS = async (to, message) => {
  // Log the OTP for development purposes
  console.log('==================================');
  console.log('DUMMY SMS SERVICE');
  console.log(`Sending SMS to: ${to}`);
  console.log(`Message: ${message}`);
  console.log('OTP for testing: 123456');
  console.log('==================================');
  
  // Simulate async behavior
  return new Promise(resolve => setTimeout(resolve, 1000));
};