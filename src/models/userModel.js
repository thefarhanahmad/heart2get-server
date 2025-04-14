import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minLength: [2, 'Name must be at least 2 characters'],
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18'],
    max: [120, 'Age cannot exceed 120'],
    required: [true, 'Age is required']
  },
  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  about_us: {
    type: String,
    trim: true
  },
  interest: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  profile_image: {
    type: String,
    trim: true
  },
  match_list: {
    matched_count: {
      type: Number,
      default: 0
    },
    matched_users: [{
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    }]
  },
  report: {
    reported_count: {
      type: Number,
      default: 0
    },
    reports: [{
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        required: true
      },
      created_at: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

export default User;