// routes/contact.route.js
import express from "express";
import {
  createContactMessage,
  createGuestContactMessage,
  getUserContactMessages,
  getAllContactMessages,
  getContactMessage,
  addResponseToMessage,
  updateContactMessage,
  deleteContactMessage,
} from "../controllers/contactController.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Guest route (no authentication required)
router.post("/guest", createGuestContactMessage);

// User routes (authentication required)
router.post("/", authenticate, createContactMessage);
router.get("/my-messages", authenticate, getUserContactMessages);
router.get("/:id", authenticate, getContactMessage);
router.post("/:id/response", authenticate, addResponseToMessage);

// Admin routes (authentication + admin privileges required)
router.get("/", authenticate, adminOnly, getAllContactMessages);
router.put("/:id", authenticate, adminOnly, updateContactMessage);
router.delete("/:id", authenticate, adminOnly, deleteContactMessage);

export default router;