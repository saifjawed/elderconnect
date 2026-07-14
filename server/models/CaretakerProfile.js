import mongoose from 'mongoose';

const caretakerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '' },
  services: [{ type: String }],
  hourlyRate: { type: Number, required: true, min: 0 },
  certifications: [{ type: String }],
  experience: { type: Number, default: 0, min: 0 },
  availability: {
    monday: { available: Boolean, start: String, end: String },
    tuesday: { available: Boolean, start: String, end: String },
    wednesday: { available: Boolean, start: String, end: String },
    thursday: { available: Boolean, start: String, end: String },
    friday: { available: Boolean, start: String, end: String },
    saturday: { available: Boolean, start: String, end: String },
    sunday: { available: Boolean, start: String, end: String },
  },
  cities: [{ type: String }],
  languages: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Submitted', 'Verified', 'Rejected'], 
    default: 'Pending' 
  },
  rejectionReason: { type: String, default: '' },
  kycDocuments: [{
    docType: { type: String, enum: ['Aadhar', 'PAN', 'Other'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }]
}, { timestamps: true });

const CaretakerProfile = mongoose.model('CaretakerProfile', caretakerProfileSchema);
export default CaretakerProfile;
