import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import CaretakerProfile from '../models/CaretakerProfile.js';
import { emitReviewNotification } from '../socket/notifications.js';

// POST /api/reviews — Customer (or Admin) creates a review for a completed booking
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }
    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: 'rating is required' });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'rating must be a number between 1 and 5' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the customer who owns the booking (or an Admin) can review
    const isOwner = booking.customer.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the customer who made the booking can review it' });
    }

    if (booking.status !== 'Completed') {
      return res.status(400).json({
        message: `Reviews can only be created for completed bookings (current status: ${booking.status})`
      });
    }

    const existing = await Review.findOne({ booking: booking._id });
    if (existing) {
      return res.status(400).json({ message: 'A review already exists for this booking' });
    }

    const review = await Review.create({
      booking: booking._id,
      customer: booking.customer,
      caretaker: booking.caretaker,
      rating: numericRating,
      comment: comment || '',
      isVisible: true,
    });

    // Recalculate caretaker's aggregate rating and totalReviews
    const stats = await Review.aggregate([
      { $match: { caretaker: booking.caretaker } },
      { $group: { _id: '$caretaker', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      const { averageRating, totalReviews } = stats[0];
      await CaretakerProfile.findOneAndUpdate(
        { user: booking.caretaker },
        {
          $set: {
            rating: Math.round(averageRating * 10) / 10,
            totalReviews,
          },
        },
        { returnDocument: 'after' }
      );
    } else {
      await CaretakerProfile.findOneAndUpdate(
        { user: booking.caretaker },
        { $set: { rating: 0, totalReviews: 0 } },
        { returnDocument: 'after' }
      );
    }

    const populated = await Review.findById(review._id)
      .populate('customer', 'firstName lastName avatar')
      .populate('caretaker', 'firstName lastName avatar')
      .populate('booking', 'serviceType scheduledDate status');

    // Real-time notification to the caretaker
    emitReviewNotification(booking.caretaker.toString(), populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/caretaker/:caretakerId — paginated, sorted newest, visible-only (unless admin)
export const getReviewsByCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(caretakerId)) {
      return res.status(400).json({ message: 'Invalid caretakerId' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const isAdmin = req.user && req.user.role === 'Admin';

    const filter = { caretaker: caretakerId };
    if (!isAdmin) {
      filter.isVisible = true;
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customer', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/booking/:bookingId — only visible to booking participants or admin
export const getReviewByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isCustomer = booking.customer.toString() === req.user.id.toString();
    const isCaretaker = booking.caretaker.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCustomer && !isCaretaker && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this review' });
    }

    const review = await Review.findOne({ booking: booking._id })
      .populate('customer', 'firstName lastName avatar')
      .populate('caretaker', 'firstName lastName avatar')
      .populate('booking', 'serviceType scheduledDate status');

    if (!review) {
      return res.status(404).json({ message: 'No review found for this booking' });
    }

    // Non-admins cannot see hidden reviews
    if (!review.isVisible && !isAdmin) {
      return res.status(404).json({ message: 'No review found for this booking' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
