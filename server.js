// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import connectDB from './config/db.js';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { handleUploadError } from './middleware/upload.js';

// import userRoutes from './routes/userRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from "./routes/order.route.js";
// import wishlistRoutes from "./routes/wishlist.route.js";
// import adminRoutes from './routes/admin.route.js';
// import giftCardRoutes from "./routes/giftcard.route.js";
// import razorpayRoutes from "./routes/razorpay.route.js";
// import authRoutes from './routes/authRoutes.js';
// import newsletterRoutes from './routes/newsletter.route.js';
// import cartRoutes from './routes/cart.route.js';
// import paymentRouter from './routes/payment.js';
// import reviewRoutes from './routes/review.route.js'
// import contactRoutes from './routes/contact.route.js';


// // ES modules __dirname equivalent
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// // Serve static files (uploaded images)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/api/newsletter', newsletterRoutes);
// app.use('/api/v1/reviews', reviewRoutes);

// // Handle multer upload errors
// app.use(handleUploadError);

// // Error handling middleware
// app.use((error, req, res, next) => {
//   console.error('Unhandled error:', error);
//   res.status(500).json({ 
//     error: 'Internal server error',
//     message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
//   });
// });

// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/admin', adminRoutes);
// app.use("/api/v1/products", productRoutes);
// app.use("/api/v1/orders", orderRoutes);
// app.use("/api/v1/wishlist", wishlistRoutes);
// app.use("/api/v1/giftcards", giftCardRoutes);
// app.use("/api/v1/razorpay", razorpayRoutes);
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/newsletter", newsletterRoutes);
// app.use('/api/v1/payment', paymentRouter);
// app.use("/api/v1/cart", cartRoutes); 
// app.use('/api/v1/contact', contactRoutes);
// app.get('/', (req, res) => {
//   res.send('API Running...');
// });

// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleUploadError } from './middleware/upload.js';
import { authenticateSocket } from './middleware/socketAuth.middleware.js';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from "./routes/order.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import adminRoutes from './routes/admin.route.js';
import giftCardRoutes from "./routes/giftcard.route.js";
import razorpayRoutes from "./routes/razorpay.route.js";
import authRoutes from './routes/authRoutes.js';
import newsletterRoutes from './routes/newsletter.route.js';
import cartRoutes from './routes/cart.route.js';
import paymentRouter from './routes/payment.js';
import reviewRoutes from './routes/review.route.js'
import contactRoutes from './routes/contact.route.js';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection handling
io.use(authenticateSocket);

// Store connected users and admins
const connectedUsers = new Map();
const connectedAdmins = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Store user connection
  if (socket.isAdmin) {
    connectedAdmins.set(socket.userId, socket.id);
  } else {
    connectedUsers.set(socket.userId, socket.id);
  }

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Join admins to admin room
  if (socket.isAdmin) {
    socket.join('admin_room');
  }

  // Handle joining specific contact message room
  socket.on('join_contact_room', (data) => {
    const contactId = data?.contactId || data;
    if (contactId) {
      socket.join(`contact_${contactId}`);
      console.log(`User ${socket.userId} joined contact room: ${contactId}`);
      
      // Emit confirmation back to client
      socket.emit('contact_room_joined', { contactId });
    } else {
      console.error('Invalid contactId for join_contact_room');
      socket.emit('error', { message: 'Invalid contact ID' });
    }
  });

  // Handle leaving contact message room
  socket.on('leave_contact_room', (data) => {
    const contactId = data?.contactId || data;
    if (contactId) {
      socket.leave(`contact_${contactId}`);
      console.log(`User ${socket.userId} left contact room: ${contactId}`);
      
      // Emit confirmation back to client
      socket.emit('contact_room_left', { contactId });
    } else {
      console.error('Invalid contactId for leave_contact_room');
    }
  });

  // Handle joining admin room
  socket.on('join_admin_room', () => {
    if (socket.isAdmin) {
      socket.join('admin_room');
      console.log(`Admin ${socket.userId} joined admin room`);
      socket.emit('admin_room_joined');
    } else {
      socket.emit('error', { message: 'Unauthorized: Admin access required' });
    }
  });

  // Handle leaving admin room
  socket.on('leave_admin_room', () => {
    if (socket.isAdmin) {
      socket.leave('admin_room');
      console.log(`Admin ${socket.userId} left admin room`);
      socket.emit('admin_room_left');
    }
  });

  // Handle typing indicators - updated event names to match client
  socket.on('user_typing', (data) => {
    const contactId = data?.contactId;
    if (contactId) {
      socket.to(`contact_${contactId}`).emit('user_typing', {
        userId: socket.userId,
        contactId: contactId,
        isAdmin: socket.isAdmin,
        userName: socket.userName
      });
    }
  });

  socket.on('user_stopped_typing', (data) => {
    const contactId = data?.contactId;
    if (contactId) {
      socket.to(`contact_${contactId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        contactId: contactId,
        isAdmin: socket.isAdmin
      });
    }
  });

  // Handle admin typing
  socket.on('admin_typing', (data) => {
    const contactId = data?.contactId;
    if (contactId && socket.isAdmin) {
      socket.to(`contact_${contactId}`).emit('admin_typing', {
        adminId: socket.userId,
        contactId: contactId,
        adminName: socket.userName
      });
    }
  });

  socket.on('admin_stopped_typing', (data) => {
    const contactId = data?.contactId;
    if (contactId && socket.isAdmin) {
      socket.to(`contact_${contactId}`).emit('admin_stopped_typing', {
        adminId: socket.userId,
        contactId: contactId
      });
    }
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    const { contactId, message, timestamp } = data;
    if (contactId && message) {
      const messageData = {
        contactId,
        message,
        timestamp: timestamp || new Date().toISOString(),
        senderId: socket.userId,
        senderName: socket.userName,
        isAdmin: socket.isAdmin
      };
      
      // Emit to all users in the contact room
      socket.to(`contact_${contactId}`).emit('new_response', {
        contactId,
        response: messageData
      });
      
      // Also emit to admin room if sender is not admin
      if (!socket.isAdmin) {
        socket.to('admin_room').emit('new_contact_message', messageData);
      }
    }
  });

  // Handle real-time message status updates
  socket.on('mark_message_read', (data) => {
    const { contactId, messageId } = data;
    if (contactId && messageId) {
      socket.to(`contact_${contactId}`).emit('message_read_update', {
        messageId,
        contactId,
        readBy: socket.userId,
        readAt: new Date()
      });
    }
  });

  // Handle status updates
  socket.on('update_contact_status', (data) => {
    const { contactId, status } = data;
    if (contactId && status && socket.isAdmin) {
      socket.to(`contact_${contactId}`).emit('status_update', {
        contactId,
        status,
        updatedBy: socket.userId,
        updatedAt: new Date()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.userId}, reason: ${reason}`);
    
    if (socket.isAdmin) {
      connectedAdmins.delete(socket.userId);
    } else {
      connectedUsers.delete(socket.userId);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });
});

// Routes
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Handle multer upload errors
app.use(handleUploadError);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/giftcards", giftCardRoutes);
app.use("/api/v1/razorpay", razorpayRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
app.use('/api/v1/payment', paymentRouter);
app.use("/api/v1/cart", cartRoutes); 
app.use('/api/v1/contact', contactRoutes);

app.get('/', (req, res) => {
  res.send('API Running...');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export for use in other files
export { io, connectedUsers, connectedAdmins };