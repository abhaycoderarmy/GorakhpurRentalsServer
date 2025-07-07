// controllers/contactController.js
import ContactMessage from "../models/contactMessage.model.js";
import User from "../models/user.model.js";
import { sendContactNotification } from "../config/nodemailer.js";

// Create a new contact message for guests (no authentication required)
export const createGuestContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    // Create new contact message without userId (for guests)
    const contactMessage = new ContactMessage({
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      isGuest: true, // Add this flag to identify guest messages
    });

    await contactMessage.save();

    // Send notification to admin (optional)
    try {
      await sendContactNotification(contactMessage);
    } catch (emailError) {
      console.log("Email notification failed:", emailError);
    }

    res.status(201).json({
      message: "Message sent successfully! We'll get back to you soon.",
      contactMessage: {
        id: contactMessage._id,
        firstName: contactMessage.firstName,
        lastName: contactMessage.lastName,
        email: contactMessage.email,
        subject: contactMessage.subject,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Guest contact message creation error:", error);
    res.status(500).json({
      message: "Failed to send message. Please try again.",
    });
  }
};

// Create a new contact message for authenticated users
export const createContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    // Create new contact message
    const contactMessage = new ContactMessage({
      userId,
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
    });

    await contactMessage.save();

    // Populate user details
    await contactMessage.populate("userId", "name email");

    // Send notification to admin (optional)
    try {
      await sendContactNotification(contactMessage);
    } catch (emailError) {
      console.log("Email notification failed:", emailError);
    }

    res.status(201).json({
      message: "Message sent successfully! We'll get back to you soon.",
      contactMessage,
    });
  } catch (error) {
    console.error("Contact message creation error:", error);
    res.status(500).json({
      message: "Failed to send message. Please try again.",
    });
  }
};

// Get all contact messages for a user
export const getUserContactMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const messages = await ContactMessage.find({ userId })
      .populate("userId", "name email")
      .populate("responses.sentBy", "name email isAdmin")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContactMessage.countDocuments({ userId });

    res.status(200).json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get user messages error:", error);
    res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
};

// Get all contact messages for admin
export const getAllContactMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const priority = req.query.priority;
    const search = req.query.search;

    let query = {};

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const messages = await ContactMessage.find(query)
      .populate("userId", "name email profilePhoto")
      .populate("assignedTo", "name email")
      .populate("responses.sentBy", "name email isAdmin")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContactMessage.countDocuments(query);

    // Get status counts for dashboard
    const statusCounts = await ContactMessage.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      statusCounts,
    });
  } catch (error) {
    console.error("Get all messages error:", error);
    res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
};

// Get single contact message
export const getContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    let query = { _id: id };
    
    // If not admin, only show user's own messages
    if (!isAdmin) {
      query.userId = userId;
    }

    const message = await ContactMessage.findOne(query)
      .populate("userId", "name email profilePhoto")
      .populate("assignedTo", "name email")
      .populate("responses.sentBy", "name email isAdmin");

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({
      message: "Failed to fetch message",
    });
  }
};

// Add response to contact message
export const addResponseToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!message) {
      return res.status(400).json({
        message: "Response message is required",
      });
    }

    let query = { _id: id };
    
    // If not admin, only allow responses to user's own messages
    if (!isAdmin) {
      query.userId = userId;
    }

    const contactMessage = await ContactMessage.findOne(query);

    if (!contactMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Add response
    contactMessage.responses.push({
      message,
      sentBy: userId,
      isAdmin,
    });

    // Update status if admin responds
    if (isAdmin && contactMessage.status === "pending") {
      contactMessage.status = "in-progress";
    }

    await contactMessage.save();

    // Populate the new response
    await contactMessage.populate("responses.sentBy", "name email isAdmin");

    res.status(200).json({
      message: "Response added successfully",
      contactMessage,
    });
  } catch (error) {
    console.error("Add response error:", error);
    res.status(500).json({
      message: "Failed to add response",
    });
  }
};

// Update contact message (admin only)
export const updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes, assignedTo } = req.body;

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(adminNotes && { adminNotes }),
        ...(assignedTo && { assignedTo }),
      },
      { new: true }
    ).populate("userId", "name email profilePhoto")
     .populate("assignedTo", "name email")
     .populate("responses.sentBy", "name email isAdmin");

    if (!contactMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    res.status(200).json({
      message: "Message updated successfully",
      contactMessage,
    });
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({
      message: "Failed to update message",
    });
  }
};

// Delete contact message (admin only)
export const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const contactMessage = await ContactMessage.findByIdAndDelete(id);

    if (!contactMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      message: "Failed to delete message",
    });
  }
};