import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // use App Password if 2FA enabled
  },
});

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Gorakhpur Rentals" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP for Gorakhpur Rentals Account Verification',
    html: `<h2>Your OTP is: <strong>${otp}</strong></h2>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
  }
};
export const sendOTP2 = async (email, otp) => {

    const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // use App Password if 2FA enabled
  },
});
  // Validate environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }

  const mailOptions = {
    from: `"Gorakhpur Rentals" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP for Gorakhpur Rentals Account Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Verification</h2>
        <p>Your OTP for Gorakhpur Rentals account verification is:</p>
        <h1 style="background: #f0f0f0; padding: 20px; text-align: center; color: #007bff; border-radius: 5px;">
          ${otp}
        </h1>
        <p style="color: #666;">This OTP will expire in 15 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};
// Add this function to your existing nodemailer.js file

export const sendContactNotification = async (contactMessage) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL, // Add this to your .env file
    subject: `New Contact Message - ${contactMessage.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ec4899;">New Contact Message Received</h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Message Details</h3>
          <p><strong>Name:</strong> ${contactMessage.firstName} ${contactMessage.lastName}</p>
          <p><strong>Email:</strong> ${contactMessage.email}</p>
          <p><strong>Phone:</strong> ${contactMessage.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${contactMessage.subject}</p>
          <p><strong>Priority:</strong> ${contactMessage.priority}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            ${contactMessage.message}
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px;">
            Please log in to your admin dashboard to respond to this message.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};