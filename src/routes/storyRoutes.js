import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createStorySchema } from '../validations/storyValidation.js';
import {
  createStory,
  getAllStories,
  deleteStory
} from '../controllers/storyController.js';

const router = express.Router();

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image': ['image/jpeg', 'image/png', 'image/gif'],
    'video': ['video/mp4', 'video/quicktime']
  };

  const mediaType = req.body.media_type;
  if (allowedTypes[mediaType] && allowedTypes[mediaType].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type for the specified media type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Apply authentication middleware
router.use(protect);

// Story routes
router.post('/create',
  upload.single('file'),
  validateRequest(createStorySchema),
  createStory
);
router.get('/list', getAllStories);
router.delete('/delete/:id', deleteStory);

export default router;