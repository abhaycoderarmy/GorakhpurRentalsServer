import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    otp: String,
    password: String,
    isGoogleUser: { type: Boolean, default: false },
    resetPasswordOTP: String,
    resetPasswordOTPExpires: Date,
    isAdmin: { type: Boolean, default: false },
    profilePhoto: String,
    contactNumber: String,
    address: String,
    pincode: String,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);
export default mongoose.model("User", userSchema);