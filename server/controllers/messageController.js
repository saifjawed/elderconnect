import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { getIO } from '../socket/socket.js';

const MESSAGE_FOLDER = 'nestlife/messages';

const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: MESSAGE_FOLDER,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// GET /api/messages/conversations
// Returns a list of users the current user has chatted with
export const getConversationsList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Aggregate to find unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          $expr: { $ne: ['$sender', '$receiver'] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          latestMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      {
        $unwind: '$partner'
      },
      {
        $project: {
          _id: 1,
          partner: {
            _id: '$partner._id',
            firstName: '$partner.firstName',
            lastName: '$partner.lastName',
            avatar: '$partner.avatar',
            role: '$partner.role',
          },
          latestMessage: 1,
          unreadCount: {
            $cond: [
              { $and: [
                { $eq: ['$latestMessage.receiver', userId] },
                { $eq: ['$latestMessage.isRead', false] }
              ]},
              1, 0
            ]
          }
        }
      },
      {
        $sort: { 'latestMessage.createdAt': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/:userId
// Returns messages between current user and the specified user
export const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName avatar role')
    .populate('receiver', 'firstName lastName avatar role');

    // Mark messages sent by the partner to me as read
    await Message.updateMany(
      { sender: partnerId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages/:userId
// Send a message to a user (with optional image)
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.userId;
    const { content } = req.body;

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message content or image is required' });
    }

    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      if (!isCloudinaryConfigured) {
        return res.status(503).json({
          message: 'Image uploads are not configured. Set CLOUDINARY_* environment variables.',
        });
      }
      const result = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content || '',
      imageUrl,
      imagePublicId,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'firstName lastName avatar role')
      .populate('receiver', 'firstName lastName avatar role');

    try {
      const io = getIO();
      // Emit to receiver's room
      io.to(String(receiverId)).emit('newMessage', populatedMessage);
      // Emit to sender's room so multiple devices can sync
      io.to(String(senderId)).emit('newMessage', populatedMessage);
    } catch (e) {
      console.error('Socket.io error emitting message:', e.message);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
