import express from 'express';
import {
  createReview,
  getProductReviews,
  getReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  moderateReview,
  removeReviewImage
} from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { authenticateV2 } from '../middleware/role.middleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews); // Get all reviews for a product
router.get('/:reviewId', getReview); // Get single review

// Protected routes (require authentication)
router.post('/product/:productId', upload.array('images', 5), authenticateV2 ,createReview); // Create review with images
router.put('/:reviewId', protect, upload.array('images', 5), updateReview); // Update review
router.delete('/:reviewId', protect, deleteReview); // Delete review
router.post('/:reviewId/helpful', protect, markReviewHelpful); // Mark review as helpful
router.put('/:reviewId/remove-image', protect, removeReviewImage); // Remove image from review

// Admin routes
router.put('/:reviewId/moderate', protect, adminOnly, moderateReview); // Approve/disapprove review

export default router;