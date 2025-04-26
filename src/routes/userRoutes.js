import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createUserSchema, updateUserSchema } from '../validations/userValidation.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import {
  setupProfile,
  getMatches,
  updateProfile
} from '../controllers/userProfileController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Apply protect middleware to all routes
router.use(protect);

// Profile routes
router.post('/profile/setup', validateRequest(createUserSchema), setupProfile);
router.put('/profile/update',
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 }
  ]),
  validateRequest(updateUserSchema),
  updateProfile
);
router.get('/matches', getMatches);

// Basic user routes
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;