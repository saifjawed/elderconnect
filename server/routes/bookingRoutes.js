import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getCaretakerAvailability,
  getBookedSlots,
} from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', authenticate, authorize('Customer', 'Admin'), createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/availability/:caretakerId', authenticate, getCaretakerAvailability);
router.get('/caretaker/:caretakerId/booked-slots', authenticate, getBookedSlots);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/status', authenticate, updateBookingStatus);
router.delete('/:id', authenticate, cancelBooking);

export default router;
