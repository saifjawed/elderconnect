import mongoose from 'mongoose';
import CaretakerProfile from '../models/CaretakerProfile.js';
import Review from '../models/Review.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const KYC_FOLDER = 'elderconnect/kyc';

const uploadBufferToCloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: KYC_FOLDER,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

// GET /api/caretakers — list all with filters
export const getCaretakers = async (req, res) => {
  try {
    const { city, service, minRate, maxRate, minRating, language, isVerified } = req.query;

    let query = {};

    if (city) {
      query.cities = { $in: [new RegExp(city, 'i')] };
    }
    if (service) {
      query.services = { $in: [new RegExp(service, 'i')] };
    }
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    if (language) {
      query.languages = { $in: [new RegExp(language, 'i')] };
    }
    if (isVerified !== undefined) {
      query.verificationStatus = isVerified === 'true' ? 'Verified' : { $ne: 'Verified' };
    } else {
      query.verificationStatus = 'Verified';
    }

    const profiles = await CaretakerProfile.find(query)
      .populate('user', 'firstName lastName email phone avatar address isActive')
      .sort({ rating: -1, createdAt: -1 });

    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/caretakers/:id — single caretaker with full details
export const getCaretakerById = async (req, res) => {
  try {
    const profile = await CaretakerProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email phone avatar address isActive');
    if (!profile) return res.status(404).json({ message: 'Caretaker not found' });

    // Get reviews for this caretaker
    const reviews = await Review.find({ caretaker: profile.user._id })
      .populate('customer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ profile, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/caretakers/profile — create or update own profile (caretaker only)
export const createOrUpdateProfile = async (req, res) => {
  try {
    const updateData = req.body;
    updateData.user = req.user.id;

    const profile = await CaretakerProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/caretakers/:userId/profile — get by user ID
export const getProfileByUserId = async (req, res) => {
  try {
    const profile = await CaretakerProfile.findOne({ user: req.params.userId })
      .populate('user', 'firstName lastName email phone avatar address isActive');
    if (!profile) return res.status(404).json({ message: 'Caretaker profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/caretakers/me/kyc
export const uploadKycDocument = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ message: 'Image uploads are not configured.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }
    const { docType } = req.body;
    if (!['Aadhar', 'PAN', 'Other'].includes(docType)) {
      return res.status(400).json({ message: 'Invalid docType.' });
    }

    const profile = await CaretakerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const publicId = `kyc_${req.user.id}_${Date.now()}`;
    const result = await uploadBufferToCloudinary(req.file.buffer, publicId);

    profile.kycDocuments.push({
      docType,
      url: result.secure_url,
      publicId: result.public_id
    });
    profile.verificationStatus = 'Submitted';
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error('KYC upload failed:', error);
    res.status(500).json({ message: 'Failed to upload KYC document.' });
  }
};

// DELETE /api/caretakers/me/kyc/:docId
export const deleteKycDocument = async (req, res) => {
  try {
    const profile = await CaretakerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const docIndex = profile.kycDocuments.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ message: 'Document not found' });

    const doc = profile.kycDocuments[docIndex];
    
    if (doc.publicId && isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(doc.publicId);
      } catch (err) {
        console.error('Cloudinary destroy failed:', err.message);
      }
    }

    profile.kycDocuments.splice(docIndex, 1);
    
    if (profile.kycDocuments.length === 0 && profile.verificationStatus === 'Submitted') {
      profile.verificationStatus = 'Pending';
    }

    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/caretakers/:id/verify (Admin only)
export const verifyCaretaker = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const profile = await CaretakerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.verificationStatus = status;
    await profile.save();

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
