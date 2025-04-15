import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minLength: [2, 'Name must be at least 2 characters'],
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    unique: true
  },
  i_am: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  interested_in: {
    type: String,
    enum: ['Male', 'Female', 'Both']
  },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18'],
    max: [120, 'Age cannot exceed 120']
  },
  about: {
    type: String,
    trim: true,
    maxLength: [500, 'About section cannot exceed 500 characters']
  },
  likes: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  hobbies: [{
    type: String,
    trim: true
  }],
  skin_color: {
    type: String,
    trim: true
  },
  height: {
    type: Number,
    min: [100, 'Height must be at least 100 cm'],
    max: [250, 'Height cannot exceed 250 cm']
  },
  weight: {
    type: Number,
    min: [30, 'Weight must be at least 30 kg'],
    max: [200, 'Weight cannot exceed 200 kg']
  },
  address: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Casual Dating', 'Serious Relationship', 'Friendship'],
    default: 'Casual Dating'
  },
  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  profile_image: {
    type: String,
    trim: true
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
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