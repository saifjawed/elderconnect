import express from 'express';
import multer from 'multer';
import { getMe, updateMe, getAllUsers, getUserById, deleteUser, getMyElders, addElder, updateElder, deleteElder, uploadUserAvatar, deleteUserAvatar, uploadElderAvatar, deleteElderAvatar, getSupportAdmin } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadAvatar, MAX_AVATAR_BYTES } from '../middleware/upload.js';

const router = express.Router();

// Runs multer, translating its errors (size/type) into clean 400 JSON responses.
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `Image is too large. Maximum size is ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))}MB.`
          : err.message;
      return res.status(400).json({ message });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

// Avatar (profile picture) management
router.post('/me/avatar', authenticate, handleAvatarUpload, uploadUserAvatar);
router.delete('/me/avatar', authenticate, deleteUserAvatar);

// Elder management routes
router.get('/me/elders', authenticate, getMyElders);
router.post('/me/elders', authenticate, addElder);
router.put('/me/elders/:elderId', authenticate, updateElder);
router.delete('/me/elders/:elderId', authenticate, deleteElder);
router.post('/me/elders/:elderId/avatar', authenticate, handleAvatarUpload, uploadElderAvatar);
router.delete('/me/elders/:elderId/avatar', authenticate, deleteElderAvatar);

router.get('/support-admin', authenticate, getSupportAdmin);

router.get('/', authenticate, authorize('Admin'), getAllUsers);
router.get('/:id', authenticate, authorize('Admin'), getUserById);
router.delete('/:id', authenticate, authorize('Admin'), deleteUser);

export default router;

