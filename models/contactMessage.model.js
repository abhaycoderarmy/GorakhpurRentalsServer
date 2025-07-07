// models/contactMessage.model.js
import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make optional for guest messages
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    subject: {
      type: String,
      required: true,
      enum: ["general", "product", "order", "return", "partnership", "other"],
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved", "closed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    adminNotes: {
      type: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isGuest: {
      type: Boolean,
      default: false, // Add flag to identify guest messages
    },
    responses: [
      {
        message: String,
        sentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", contactMessageSchema);