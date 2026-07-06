import mongoose from 'mongoose';

const elderSchema = new mongoose.Schema({
  parentCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  relation: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Elder = mongoose.model('Elder', elderSchema);
export default Elder;
