import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { getConversationsList, getConversation, sendMessage } from '../controllers/messageController.js';

const storage = multer.memoryStorage();
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES },
});

const router = express.Router();

const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `Image is too large. Maximum size is 5MB.`
          : err.message;
      return res.status(400).json({ message });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get('/conversations', authenticate, getConversationsList);
router.get('/:userId', authenticate, getConversation);
router.post('/:userId', authenticate, handleImageUpload, sendMessage);

export default router;
