import Review from "../models/review.model.js";
import Product from "../models/Product.js";
import User from "../models/user.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, reviewerName, reviewerEmail } = req.body;
    console.log(req.user);
    const userId = req.user?.id; // Optional for anonymous reviews

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product (prevent duplicate reviews)
    if (userId) {
      const existingReview = await Review.findOne({
        productId,
        userId,
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this product",
        });
      }
    }

    // Handle image uploads to Cloudinary
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // With CloudinaryStorage, the file is already uploaded to Cloudinary
          // file.path contains the Cloudinary URL
          // file.filename contains the public_id

          uploadedImages.push({
            url: file.path, // This is the Cloudinary URL
            publicId: file.filename, // This is the Cloudinary public_id
          });
        } catch (uploadError) {
          console.error("Image processing failed:", uploadError);
        }
      }
    }

    // Create review
    const review = new Review({
      productId,
      userId,
      reviewerName: userId ? req.user.name : reviewerName || "Anonymous",
      reviewerEmail: userId
        ? req.user.email
        : reviewerEmail || "anonymous@example.com",
      rating: parseInt(rating),
      comment,
      images: uploadedImages,
      isVerified: userId ? true : false, // Verified if user is logged in
    });

    const savedReview = await review.save();

    // Populate the review for response
    const populatedReview = await review.populate("userId", "name profilePhoto");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: populatedReview,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      rating,
    } = req.query;

    // Build filter
    const filter = {
      productId,
      isApproved: true,
    };

    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Get reviews with pagination
    const reviews = await Review.find(filter)
      .populate("userId", "name profilePhoto")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Review.countDocuments(filter);

    // Get product rating statistics
    const ratingStats = await Review.getProductRating(productId);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
        ratingStats,
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Get single review
export const getReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate("userId", "name profilePhoto")
      .populate("productId", "name images");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
};

// Update review (only by the review author)
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user owns this review
    if (review.userId?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      });
    }

    // Handle new image uploads
    let newImages = [...review.images];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // File is already uploaded to Cloudinary by multer
          newImages.push({
            url: file.path,
            publicId: file.filename,
          });
        } catch (uploadError) {
          console.error("Image processing failed:", uploadError);
        }
      }
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.images = newImages;

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check permissions (owner or admin)
    if (!isAdmin && review.userId?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      for (const image of review.images) {
        try {
          if (image.publicId) {
            await deleteFromCloudinary(image.publicId);
          }
        } catch (deleteError) {
          console.error("Failed to delete image:", deleteError);
        }
      }
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

// Mark review as helpful
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user already marked as helpful
    const alreadyMarked = review.helpfulBy.includes(userId);

    if (alreadyMarked) {
      // Remove helpful vote
      review.helpfulBy = review.helpfulBy.filter(
        (id) => id.toString() !== userId
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    } else {
      // Add helpful vote
      review.helpfulBy.push(userId);
      review.helpfulVotes += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: alreadyMarked ? "Helpful vote removed" : "Marked as helpful",
      data: {
        helpful: !alreadyMarked,
        helpfulVotes: review.helpfulVotes,
      },
    });
  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update helpful status",
      error: error.message,
    });
  }
};

// Admin: Approve/Disapprove review
export const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? "approved" : "disapproved"} successfully`,
      data: review,
    });
  } catch (error) {
    console.error("Moderate review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to moderate review",
      error: error.message,
    });
  }
};

// Remove image from review
export const removeReviewImage = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { imageIndex } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check ownership
    if (review.userId?.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this review",
      });
    }

    if (imageIndex >= 0 && imageIndex < review.images.length) {
      const imageToDelete = review.images[imageIndex];

      // Delete from Cloudinary
      if (imageToDelete.publicId) {
        try {
          await deleteFromCloudinary(imageToDelete.publicId);
        } catch (deleteError) {
          console.error("Failed to delete image from Cloudinary:", deleteError);
        }
      }

      // Remove from array
      review.images.splice(imageIndex, 1);
      await review.save();

      res.status(200).json({
        success: true,
        message: "Image removed successfully",
        data: review,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
    }
  } catch (error) {
    console.error("Remove image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove image",
      error: error.message,
    });
  }
};
// Admin: Get all reviews with filtering and pagination
export const getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      isApproved,
      rating,
      productId,
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    if (isApproved !== undefined) {
      filter.isApproved = isApproved === 'true';
    }
    
    if (rating) {
      filter.rating = parseInt(rating);
    }
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (search) {
      filter.$or = [
        { reviewerName: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    // Get reviews with pagination
    const reviews = await Review.find(filter)
      .populate("userId", "name profilePhoto email")
      .populate("productId", "name images price")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Review.countDocuments(filter);

    // Get statistics
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          approvedReviews: { $sum: { $cond: ["$isApproved", 1, 0] } },
          pendingReviews: { $sum: { $cond: ["$isApproved", 0, 1] } },
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
        stats: stats[0] || {
          totalReviews: 0,
          approvedReviews: 0,
          pendingReviews: 0,
          averageRating: 0
        }
      },
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Admin: Bulk delete reviews
export const bulkDeleteReviews = async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds)) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of review IDs",
      });
    }

    // Get reviews to delete images from Cloudinary
    const reviews = await Review.find({ _id: { $in: reviewIds } });

    // Delete images from Cloudinary
    for (const review of reviews) {
      if (review.images && review.images.length > 0) {
        for (const image of review.images) {
          try {
            if (image.publicId) {
              await deleteFromCloudinary(image.publicId);
            }
          } catch (deleteError) {
            console.error("Failed to delete image:", deleteError);
          }
        }
      }
    }

    // Delete reviews
    const result = await Review.deleteMany({ _id: { $in: reviewIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} reviews deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete reviews",
      error: error.message,
    });
  }
};

// Admin: Bulk approve/disapprove reviews
export const bulkModerateReviews = async (req, res) => {
  try {
    const { reviewIds, isApproved } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds)) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of review IDs",
      });
    }

    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { isApproved: isApproved }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} reviews ${isApproved ? 'approved' : 'disapproved'} successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk moderate reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to moderate reviews",
      error: error.message,
    });
  }
};