import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  elder: { type: mongoose.Schema.Types.ObjectId, ref: 'Elder' },
  caretaker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  scheduledDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  notes: { type: String, default: '' },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  stripePaymentIntentId: { type: String, default: '' },
  isUrgent: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  otp: { type: String, default: '' },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
