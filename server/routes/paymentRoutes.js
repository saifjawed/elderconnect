import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/razorpay/order', authenticate, createOrder);
router.post('/razorpay/verify', authenticate, verifyPayment);

export default router;
