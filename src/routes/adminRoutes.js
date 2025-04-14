import express from 'express';
import { 
  login, 
  createAdmin, 
  getDashboardStats,
  getAllUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/create', createAdmin);
router.get('/dashboard', protect, getDashboardStats);
router.get('/users', protect, getAllUsers);
router.get('/users/:id', protect, getSingleUser);
router.post('/users', protect, createUser);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, deleteUser);

export default router;