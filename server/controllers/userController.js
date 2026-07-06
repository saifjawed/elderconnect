import User from '../models/User.js';
import CaretakerProfile from '../models/CaretakerProfile.js';
import Elder from '../models/Elder.js';
import cloudinary, { AVATAR_FOLDER, isCloudinaryConfigured } from '../config/cloudinary.js';

// Upload a buffer to Cloudinary via the SDK's stream API, wrapped in a Promise.
const uploadBufferToCloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: AVATAR_FOLDER,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        // Square, face-focused thumbnail keeps stored images small and consistent.
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// GET /api/users/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/me
export const updateMe = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // password changes separate
    delete updates.role; // role changes only by admin

    const user = await User.findByIdAndUpdate(req.user.id, updates, { returnDocument: 'after' }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, city } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['address.city'] = city;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id (admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id (admin only) — deletes the user and their caretaker profile
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      CaretakerProfile.deleteOne({ user: req.params.id }),
    ]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/me/elders
export const getMyElders = async (req, res) => {
  try {
    const elders = await Elder.find({ parentCustomer: req.user.id });
    res.json(elders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/me/elders
export const addElder = async (req, res) => {
  try {
    const { firstName, lastName, relation, address, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    const elder = await Elder.create({
      firstName,
      lastName,
      parentCustomer: req.user.id,
      relation: relation || '',
      phone: phone || '',
      address: address || { street: '', city: '', state: '', zipCode: '' }
    });
    res.status(201).json(elder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/me/elders/:elderId
export const updateElder = async (req, res) => {
  try {
    const { firstName, lastName, relation, address, phone } = req.body;
    const elder = await Elder.findOne({ _id: req.params.elderId, parentCustomer: req.user.id });
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    if (firstName) elder.firstName = firstName;
    if (lastName) elder.lastName = lastName;
    if (relation !== undefined) elder.relation = relation;
    if (phone !== undefined) elder.phone = phone;
    if (address) {
      elder.address = {
        ...elder.address.toObject(),
        ...address
      };
    }
    await elder.save();
    res.json(elder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/me/elders/:elderId
export const deleteElder = async (req, res) => {
  try {
    const elder = await Elder.findOneAndDelete({ _id: req.params.elderId, parentCustomer: req.user.id });
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    res.json({ message: 'Elder removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/me/avatar  (multipart/form-data, field name: "avatar")
export const uploadUserAvatar = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        message: 'Image uploads are not configured. Set CLOUDINARY_* environment variables on the server.',
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    // Deterministic public_id per user so re-uploads overwrite the previous image.
    const publicId = `user_${req.user.id}`;
    const result = await uploadBufferToCloudinary(req.file.buffer, publicId);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url, avatarPublicId: result.public_id },
      { returnDocument: 'after' }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Avatar upload failed:', error);
    res.status(500).json({ message: 'Failed to upload avatar. Please try again.' });
  }
};

// DELETE /api/users/me/avatar
export const deleteUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarPublicId && isCloudinaryConfigured) {
      // Best-effort removal from Cloudinary; don't block clearing the profile on it.
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.error('Cloudinary destroy failed:', err.message);
      }
    }

    user.avatar = '';
    user.avatarPublicId = '';
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/me/elders/:elderId/avatar
export const uploadElderAvatar = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        message: 'Image uploads are not configured. Set CLOUDINARY_* environment variables on the server.',
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const elder = await Elder.findOne({ _id: req.params.elderId, parentCustomer: req.user.id });
    if (!elder) return res.status(404).json({ message: 'Elder not found' });

    const publicId = `elder_${elder._id}`;
    const result = await uploadBufferToCloudinary(req.file.buffer, publicId);

    elder.avatar = result.secure_url;
    elder.avatarPublicId = result.public_id;
    await elder.save();

    res.json(elder);
  } catch (error) {
    console.error('Elder avatar upload failed:', error);
    res.status(500).json({ message: 'Failed to upload elder avatar. Please try again.' });
  }
};

// DELETE /api/users/me/elders/:elderId/avatar
export const deleteElderAvatar = async (req, res) => {
  try {
    const elder = await Elder.findOne({ _id: req.params.elderId, parentCustomer: req.user.id });
    if (!elder) return res.status(404).json({ message: 'Elder not found' });

    if (elder.avatarPublicId && isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(elder.avatarPublicId);
      } catch (err) {
        console.error('Cloudinary destroy failed:', err.message);
      }
    }

    elder.avatar = '';
    elder.avatarPublicId = '';
    await elder.save();

    res.json(elder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

