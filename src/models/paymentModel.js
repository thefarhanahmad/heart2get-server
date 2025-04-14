import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;