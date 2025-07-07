import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { sendOTP , sendOTP2} from "../config/nodemailer.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const sendOtpToEmail = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { otp },
      { upsert: true, new: true }
    );
    await sendOTP(email, otp);
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtpAndRegister = async (req, res) => {
  const { email, name, otp, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.name = name;
    user.password = await bcrypt.hash(password, 10);
    user.otp = null;
    await user.save();

    res.status(200).json({ message: "Account verified & registered" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: "User not verified" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
    res.status(200).json({ token, user });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
};

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        isVerified: true,
        profilePhoto: picture,
        password: "google-auth", // optional placeholder
        isGoogleUser: true,
      });
    }

    const jwtToken = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error("Google login failed:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};
// Fix getUserProfile to always return JSON
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user); // Consistent JSON response
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// Fix updateUserProfile for better error handling
import cloudinary from "../config/cloudinary.js";

export const updateUserProfile = async (req, res) => {
  try {
    const { name, address, contactNumber, pincode } = req.body;
    let profilePhotoUrl;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "gorakhpur_rentals/profiles",
      });
      profilePhotoUrl = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        address,
        contactNumber,
        pincode,
        ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl }),
      },
      { new: true, runValidators: true }
    ).select("-password -otp");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Fix resetPassword with better validation
export const resetPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// Function to send OTP for password reset
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in user document with expiration (15 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send OTP via email
    await sendOTP2(email, otp);

    res.status(200).json({ 
      message: "OTP sent successfully to your email",
      email: email
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    
    // Check if it's an email sending error
    if (error.message.includes('Email sending failed')) {
      return res.status(500).json({ 
        message: "Failed to send email. Please check your email configuration." 
      });
    }
    
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// Function to verify OTP for password reset
export const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and hasn't expired
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    res.status(200).json({ 
      message: "OTP verified successfully",
      email: email
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Failed to verify OTP. Please try again." });
  }
};

// Function to reset password after OTP verification
export const resetPasswordConfirm = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP one more time
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.status(200).json({ 
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
};