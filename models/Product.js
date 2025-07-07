import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  images: [String], 
  color: String,
  availability: {
    type: Boolean,
    default: true,
  },
  rentDuration: {
    type: [String],
  },
  category: {
    type: String,
    default: "Lehenga",
  },
  availableDates: [{
    type: Date
  }],
  // Store booked date ranges
  bookedDates: [
    {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }
    }
  ],
 ratings: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  }
}, { timestamps: true });
// Update product ratings when reviews change
productSchema.methods.updateRatings = async function() {
  const Review = mongoose.model('Review');
  
  const ratingStats = await Review.getProductRating(this._id);
  
  this.ratings = {
    average: ratingStats.averageRating,
    totalReviews: ratingStats.totalReviews,
    distribution: ratingStats.ratingDistribution
  };
  
  await this.save();
  return this.ratings;
};

// Method to check if product is available for given date range
productSchema.methods.isAvailableForDates = function(startDate, endDate) {
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);
  
  // First check if the product is generally available
  if (!this.availability) {
    return false;
  }
  
  // Check if any booked dates overlap with requested dates
  for (let booking of this.bookedDates) {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    // Check for date overlap
    if (requestStart <= bookingEnd && requestEnd >= bookingStart) {
      return false; // Dates overlap, not available
    }
  }
  
  if (this.availableDates && this.availableDates.length > 0) {
    const requestDates = [];
    const currentDate = new Date(requestStart);
    
    // Generate all dates in the requested range
    while (currentDate <= requestEnd) {
      requestDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Check if all requested dates are in the available dates
    for (let reqDate of requestDates) {
      const isDateAvailable = this.availableDates.some(availableDate => {
        const available = new Date(availableDate);
        return available.toDateString() === reqDate.toDateString();
      });
      
      if (!isDateAvailable) {
        return false; // At least one requested date is not available
      }
    }
  }
  
  return true; // No overlap found and all dates are available
};

// Method to get available dates that are not booked
productSchema.methods.getActualAvailableDates = function() {
  if (!this.availableDates || this.availableDates.length === 0) {
    return [];
  }
  
  return this.availableDates.filter(availableDate => {
    const checkDate = new Date(availableDate);
    
    // Check if this date is not in any booked range
    for (let booking of this.bookedDates) {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      if (checkDate >= bookingStart && checkDate <= bookingEnd) {
        return false; // This date is booked
      }
    }
    
    return true; // This date is available
  });
};
// Virtual to get recent reviews
productSchema.virtual('recentReviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId',
  options: { 
    sort: { createdAt: -1 }, 
    limit: 3,
    match: { isApproved: true }
  }
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });


export default mongoose.model('Product', productSchema);