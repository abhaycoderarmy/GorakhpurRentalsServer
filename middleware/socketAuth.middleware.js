import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.isAdmin = user.isAdmin || false;
    socket.userName = user.name;
    
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};