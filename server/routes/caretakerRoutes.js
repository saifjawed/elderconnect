import express from 'express';
import { getCaretakers, getCaretakerById, createOrUpdateProfile, getProfileByUserId, uploadKycDocument, deleteKycDocument, verifyCaretaker } from '../controllers/caretakerController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadAvatar, MAX_AVATAR_BYTES } from '../middleware/upload.js';
import multer from 'multer';

const router = express.Router();

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

router.get('/', getCaretakers);
router.post('/profile', authenticate, authorize('Caretaker'), createOrUpdateProfile);
router.put('/profile', authenticate, authorize('Caretaker'), createOrUpdateProfile);
router.get('/:userId/profile', getProfileByUserId);
router.post('/me/kyc', authenticate, authorize('Caretaker'), handleAvatarUpload, uploadKycDocument);
router.delete('/me/kyc/:docId', authenticate, authorize('Caretaker'), deleteKycDocument);
router.get('/:id', getCaretakerById);
router.put('/:id/verify', authenticate, authorize('Admin'), verifyCaretaker);

export default router;
