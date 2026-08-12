import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Elder from '../models/Elder.js';
import CaretakerProfile from '../models/CaretakerProfile.js';
import { emitNewBooking, emitBookingUpdate } from '../socket/notifications.js';

// Allowed status transitions for booking lifecycle
const statusTransitions = {
  'Pending': ['Accepted', 'Declined', 'Cancelled'],
  'Accepted': ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  'Declined': [],
  'Completed': [],
  'Cancelled': []
};

// Parse "HH:mm" into minutes since midnight. Returns null on invalid input.
const parseTimeToMinutes = (timeStr) => {
  if (typeof timeStr !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

// Compute duration in hours between two "HH:mm" strings.
export const calculateTotal = (hourlyRate, startTime, endTime) => {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === null || endMin === null) return 0;
  // Treat end <= start as invalid for billing purposes
  if (endMin <= startMin) return 0;
  const durationHours = (endMin - startMin) / 60;
  const rate = Number(hourlyRate) || 0;
  return Math.round(rate * durationHours * 100) / 100;
};

// Map JS getDay() (0=Sunday..6=Saturday) to availability key.
const dayKeyFromDate = (date) => {
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return keys[date.getDay()];
};

// POST /api/bookings — Customer (or Admin) creates a booking
export const createBooking = async (req, res) => {
  try {
    const {
      elder,
      caretaker,
      serviceType,
      scheduledDate,
      startTime,
      endTime,
      address,
      notes,
      isUrgent
    } = req.body;

    if (!caretaker || !serviceType || !scheduledDate || !startTime || !endTime || !address) {
      return res.status(400).json({
        message: 'caretaker, serviceType, scheduledDate, startTime, endTime and address are required'
      });
    }

    if (!address.street || !address.city) {
      return res.status(400).json({ message: 'address.street and address.city are required' });
    }

    if (parseTimeToMinutes(startTime) === null || parseTimeToMinutes(endTime) === null) {
      return res.status(400).json({ message: 'startTime and endTime must be in HH:mm format' });
    }

    if (!mongoose.Types.ObjectId.isValid(caretaker)) {
      return res.status(400).json({ message: 'Invalid caretaker id' });
    }

    // Verify caretaker exists and has the Caretaker role
    const caretakerUser = await User.findById(caretaker);
    if (!caretakerUser || caretakerUser.role !== 'Caretaker') {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    // Verify caretaker has a profile to know the hourly rate
    const profile = await CaretakerProfile.findOne({ user: caretaker });
    if (!profile) {
      return res.status(400).json({ message: 'Caretaker does not have a profile yet' });
    }

    // Optional: validate elder reference
    let validatedElder = undefined;
    if (elder && mongoose.Types.ObjectId.isValid(elder)) {
      const elderProfile = await Elder.findById(elder);
      if (elderProfile) {
        validatedElder = elder;
      }
    }

    const newStartMin = parseTimeToMinutes(startTime);
    const newEndMin = parseTimeToMinutes(endTime);

    const requestedDateStr = new Date(scheduledDate).toISOString().split('T')[0];
    const existingBookings = await Booking.find({
      caretaker,
      status: { $in: ['Pending', 'Accepted', 'In Progress'] }
    });

    const hasOverlap = existingBookings.some((booking) => {
      const existingDateStr = new Date(booking.scheduledDate).toISOString().split('T')[0];
      if (existingDateStr !== requestedDateStr) return false;

      const existingStartMin = parseTimeToMinutes(booking.startTime);
      const existingEndMin = parseTimeToMinutes(booking.endTime);

      if (existingStartMin === null || existingEndMin === null) return false;

      return newStartMin < existingEndMin && newEndMin > existingStartMin;
    });

    if (hasOverlap) {
      return res.status(400).json({ message: 'The caretaker is already booked for the selected time slot.' });
    }

    const totalAmount = calculateTotal(profile.hourlyRate, startTime, endTime);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const booking = await Booking.create({
      customer: req.user.id,
      elder: validatedElder,
      caretaker,
      serviceType,
      status: 'Pending',
      scheduledDate: new Date(scheduledDate),
      startTime,
      otp,
      endTime,
      address,
      notes: notes || '',
      totalAmount,
      isUrgent: Boolean(isUrgent),
    });

    const populated = await Booking.findById(booking._id)
      .populate('customer', 'firstName lastName avatar email phone')
      .populate('caretaker', 'firstName lastName avatar email phone')
      .populate('elder', 'firstName lastName avatar');

    res.status(201).json(populated);
    emitNewBooking(caretaker, populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/my-bookings — role-aware listing
export const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (req.user.role === 'Customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'Caretaker') {
      query.caretaker = req.user.id;
    } else if (req.user.role === 'Admin') {
      // admin sees everything
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'firstName lastName avatar email phone')
      .populate('caretaker', 'firstName lastName avatar email phone')
      .populate('elder', 'firstName lastName avatar phone')
      .sort({ scheduledDate: -1, createdAt: -1 });

    // Attach caretaker profile (hourlyRate, services, rating) for each booking
    const caretakerIds = [...new Set(bookings.map((b) => b.caretaker && b.caretaker._id).filter(Boolean))];
    const profiles = caretakerIds.length
      ? await CaretakerProfile.find({ user: { $in: caretakerIds } }, 'user hourlyRate services rating isVerified')
      : [];
    const profileByUser = new Map(profiles.map((p) => [p.user.toString(), p]));

    const enriched = bookings.map((b) => {
      const obj = b.toObject();
      if (req.user.role === 'Caretaker') {
        delete obj.otp;
      }
      if (obj.caretaker && obj.caretaker._id) {
        obj.caretakerProfile = profileByUser.get(obj.caretaker._id.toString()) || null;
      }
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/:id — single booking visible to participants
export const getBookingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'firstName lastName avatar email phone')
      .populate('caretaker', 'firstName lastName avatar email phone')
      .populate('elder', 'firstName lastName avatar');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isCustomer = booking.customer && booking.customer._id.toString() === req.user.id.toString();
    const isCaretaker = booking.caretaker && booking.caretaker._id.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCustomer && !isCaretaker && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    const obj = booking.toObject();
    if (req.user.role === 'Caretaker') {
      delete obj.otp;
    }
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/bookings/:id/status — status transitions
export const updateBookingStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const { status: newStatus } = req.body;
    if (!newStatus) {
      return res.status(400).json({ message: 'status is required' });
    }

    const allowedStatuses = Object.keys(statusTransitions);
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isCustomer = booking.customer.toString() === req.user.id.toString();
    const isCaretaker = booking.caretaker.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'Admin';

    // Authorization by target status
    const caretakerOnlyStatuses = ['Accepted', 'Declined', 'In Progress', 'Completed'];
    const customerOrAdminStatuses = ['Cancelled'];

    if (caretakerOnlyStatuses.includes(newStatus)) {
      if (!isCaretaker && !isAdmin) {
        return res.status(403).json({ message: 'Only the caretaker or an admin can perform this action' });
      }
    }

    if (customerOrAdminStatuses.includes(newStatus)) {
      if (!isCustomer && !isAdmin) {
        return res.status(403).json({ message: 'Only the customer or an admin can cancel a booking' });
      }
    }

    const allowedNext = statusTransitions[booking.status] || [];
    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({
        message: `Cannot transition from "${booking.status}" to "${newStatus}"`
      });
    }

    if (newStatus === 'In Progress') {
      if (booking.paymentStatus !== 'Paid') {
        return res.status(400).json({ message: 'Customer must complete payment before the service can start.' });
      }

      const { providedOtp } = req.body;
      if (!providedOtp || providedOtp !== booking.otp) {
        return res.status(400).json({ message: 'Invalid OTP provided for starting the service.' });
      }
    }

    booking.status = newStatus;
    if (newStatus === 'Completed') {
      booking.completedAt = new Date();
    }
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('customer', 'firstName lastName avatar email phone')
      .populate('caretaker', 'firstName lastName avatar email phone')
      .populate('elder', 'firstName lastName avatar');

    res.json(updated);
    emitBookingUpdate(booking.customer.toString(), updated);
    emitBookingUpdate(booking.caretaker.toString(), updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/bookings/:id — cancel a Pending or Accepted booking
export const cancelBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isCustomer = booking.customer.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({ message: 'Only the customer or an admin can cancel a booking' });
    }

    if (!['Pending', 'Accepted'].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking can only be cancelled while Pending or Accepted (current: ${booking.status})`
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('customer', 'firstName lastName avatar email phone')
      .populate('caretaker', 'firstName lastName avatar email phone')
      .populate('elder', 'firstName lastName avatar');

    res.json(updated);
    emitBookingUpdate(booking.customer.toString(), updated);
    emitBookingUpdate(booking.caretaker.toString(), updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/availability/:caretakerId?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
export const getCaretakerAvailability = async (req, res) => {
  try {
    const { caretakerId } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!mongoose.Types.ObjectId.isValid(caretakerId)) {
      return res.status(400).json({ message: 'Invalid caretaker id' });
    }

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'date, startTime and endTime query params are required' });
    }

    const caretakerUser = await User.findById(caretakerId);
    if (!caretakerUser || caretakerUser.role !== 'Caretaker') {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    const profile = await CaretakerProfile.findOne({ user: caretakerId });
    if (!profile) {
      return res.status(404).json({ message: 'Caretaker profile not found' });
    }

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (startMin === null || endMin === null) {
      return res.status(400).json({ message: 'startTime and endTime must be HH:mm' });
    }
    if (endMin <= startMin) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    const requestedDate = new Date(date);
    if (Number.isNaN(requestedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const dayKey = dayKeyFromDate(requestedDate);
    const dayAvailability = profile.availability && profile.availability[dayKey];

    let withinWorkingHours = false;
    if (dayAvailability && dayAvailability.available) {
      const workStart = parseTimeToMinutes(dayAvailability.start);
      const workEnd = parseTimeToMinutes(dayAvailability.end);
      if (workStart !== null && workEnd !== null) {
        withinWorkingHours = startMin >= workStart && endMin <= workEnd;
      }
    }

    // Check for overlapping bookings on the same date that aren't cancelled/declined
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const sameDayBookings = await Booking.find({
      caretaker: caretakerId,
      scheduledDate: { $gte: dayStart, $lt: dayEnd },
      status: { $in: ['Pending', 'Accepted', 'In Progress'] }
    });

    const overlapping = sameDayBookings.some((b) => {
      const bStart = parseTimeToMinutes(b.startTime);
      const bEnd = parseTimeToMinutes(b.endTime);
      if (bStart === null || bEnd === null) return false;
      return startMin < bEnd && endMin > bStart;
    });

    res.json({
      available: withinWorkingHours && !overlapping,
      withinWorkingHours,
      hasOverlappingBooking: overlapping,
      conflictingBookings: overlapping ? sameDayBookings.length : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/caretaker/:caretakerId/booked-slots
export const getBookedSlots = async (req, res) => {
  try {
    const { caretakerId } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(caretakerId)) {
      return res.status(400).json({ message: 'Invalid caretaker id' });
    }

    const requestedDate = new Date(date);
    if (Number.isNaN(requestedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const sameDayBookings = await Booking.find({
      caretaker: caretakerId,
      scheduledDate: { $gte: dayStart, $lt: dayEnd },
      status: { $in: ['Pending', 'Accepted', 'In Progress'] }
    });

    const slots = sameDayBookings.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime
    }));

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
