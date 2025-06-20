import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createOrder } from "../controllers/orderController.js";

dotenv.config();

const router = express.Router();

// Debug: Check if environment variables are loaded
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Loaded' : 'Missing');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Loaded' : 'Missing');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Loaded' : 'Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Loaded' : 'Missing');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('Missing Razorpay credentials in environment variables');
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Missing email credentials in environment variables');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use app password for Gmail
  },
});

// Function to generate beautiful order confirmation email HTML
const generateOrderConfirmationEmail = (orderData, customerDetails) => {
  const { items, total, paymentDetails, discount, orderId } = orderData;
  const orderDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
            }
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .order-info {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #667eea;
            }
            .order-info h2 {
                color: #667eea;
                margin-bottom: 15px;
                font-size: 20px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
                border-bottom: 1px dotted #ddd;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .info-label {
                font-weight: 600;
                color: #555;
            }
            .info-value {
                color: #333;
            }
            .items-section {
                margin-bottom: 30px;
            }
            .items-section h2 {
                color: #333;
                margin-bottom: 20px;
                font-size: 22px;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
            }
            .item {
                background-color: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .item-name {
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            .item-price {
                font-size: 18px;
                font-weight: 700;
                color: #667eea;
            }
            .item-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                font-size: 14px;
                color: #666;
            }
            .rental-period {
                background-color: #e8f2ff;
                padding: 10px;
                border-radius: 6px;
                margin-top: 10px;
                border-left: 3px solid #667eea;
            }
            .total-section {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .total-final {
                border-top: 2px solid rgba(255,255,255,0.3);
                padding-top: 15px;
                margin-top: 15px;
                font-size: 24px;
                font-weight: 700;
            }
            .footer {
                background-color: #333;
                color: white;
                padding: 30px;
                text-align: center;
            }
            .footer h3 {
                margin-bottom: 15px;
                color: #667eea;
            }
            .footer p {
                margin-bottom: 10px;
                opacity: 0.8;
            }
            .contact-info {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #555;
            }
            @media (max-width: 600px) {
                .item-details {
                    grid-template-columns: 1fr;
                }
                .total-row {
                    font-size: 14px;
                }
                .total-final {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Order Confirmed!</h1>
                <p>Thank you for your purchase. Your order has been successfully placed.</p>
            </div>
            
            <div class="content">
                <div class="order-info">
                    <h2>📋 Order Details</h2>
                    <div class="info-row">
                        <span class="info-label">Order ID:</span>
                        <span class="info-value">#${orderId || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Order Date:</span>
                        <span class="info-value">${orderDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Customer Name:</span>
                        <span class="info-value">${customerDetails?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${orderData.email || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${customerDetails?.phone || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment ID:</span>
                        <span class="info-value">${paymentDetails?.razorpay_payment_id || 'N/A'}</span>
                    </div>
                </div>

                <div class="items-section">
                    <h2>🛍️ Order Items</h2>
                    ${items.map(item => `
                        <div class="item">
                            <div class="item-header">
                                <span class="item-name">${item.name}</span>
                                <span class="item-price">₹${item.price}</span>
                            </div>
                            <div class="item-details">
                                <div><strong>Quantity:</strong> ${item.qty}</div>
                                <div><strong>Subtotal:</strong> ₹${(item.price * item.qty).toFixed(2)}</div>
                            </div>
                            ${item.startDate && item.endDate ? `
                                <div class="rental-period">
                                    <strong>📅 Rental Period:</strong><br>
                                    From: ${new Date(item.startDate).toLocaleDateString('en-IN')}<br>
                                    To: ${new Date(item.endDate).toLocaleDateString('en-IN')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="total-section">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>₹${(total + (discount || 0)).toFixed(2)}</span>
                    </div>
                    ${discount ? `
                        <div class="total-row">
                            <span>Discount:</span>
                            <span>-₹${discount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row total-final">
                        <span>Total Paid:</span>
                        <span>₹${total.toFixed(2)}</span>
                    </div>
                </div>

                <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h3 style="color: #28a745; margin-bottom: 10px;">✅ What's Next?</h3>
                    <p style="margin-bottom: 10px;">• You will receive a confirmation call within 24 hours</p>
                    <p style="margin-bottom: 10px;">• Items will be delivered as per the rental dates</p>
                    <p style="margin-bottom: 10px;">• Keep this email for your records</p>
                    <p>• Contact us if you have any questions</p>
                </div>
            </div>

            <div class="footer">
                <h3>Thank You for Choosing Us! 🙏</h3>
                <p>We appreciate your business and look forward to serving you.</p>
                
                <div class="contact-info">
                    <p><strong>Need Help?</strong></p>
                    <p>📧 Email: support@yourcompany.com</p>
                    <p>📞 Phone: +91-XXXXXXXXXX</p>
                    <p>🌐 Website: www.yourcompany.com</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Function to send order confirmation email
const sendOrderConfirmationEmail = async (orderData, customerEmail, customerDetails) => {
  try {
    const htmlContent = generateOrderConfirmationEmail(orderData, customerDetails);
    
    const mailOptions = {
      from: {
        name: 'Your Company Name',
        address: process.env.EMAIL_USER
      },
      to: customerEmail,
      subject: `🎉 Order Confirmation - Order #${orderData.orderId || 'N/A'}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Create Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, items, customerDetails, email, discount } = req.body;

    // Validate required fields
    if (!amount) {
      return res.status(400).json({ 
        error: "Amount is required" 
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise and ensure integer
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        email: email || '',
        customerName: customerDetails?.name || '',
        phone: customerDetails?.phone || '',
        discount: discount || 0,
      },
    };

    const order = await razorpay.orders.create(options);
    
    res.json({ 
      order,
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Verify payment and create order
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      total,
      customerDetails,
      email,
      discount
    } = req.body;

    console.log('=== PAYMENT VERIFICATION DEBUG ===');
    console.log('Items received for verification:', JSON.stringify(items, null, 2));

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature"
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        error: "Payment not captured"
      });
    }

    // Validate items and rental dates before creating order
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No items provided"
      });
    }

    // Check that all items have rental dates
    const itemsWithoutDates = items.filter(item => !item.startDate || !item.endDate);
    if (itemsWithoutDates.length > 0) {
      console.error('Items missing rental dates:', itemsWithoutDates);
      return res.status(400).json({
        success: false,
        error: "All items must have rental dates (startDate and endDate)"
      });
    }

    // Create order data with proper structure
    const orderData = {
      items: items.map(item => ({
        ProductId: item.ProductId || item._id || item.id,
        name: item.name,
        price: item.price,
        qty: item.qty || item.quantity || 1,
        startDate: item.startDate,
        endDate: item.endDate
      })),
      total,
      userId: userId,
      email,
      customerDetails,
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_method: payment.method,
        payment_status: payment.status,
        amount_paid: payment.amount / 100, // Convert back to rupees
      },
      discount: discount || 0
    };

    console.log('Order data being sent to createOrder:', JSON.stringify(orderData, null, 2));

    // Create a mock request and response to pass to createOrder
    let emailOrderData = null;
    const mockReq = { body: orderData };
    let emailResult = null;
    const mockRes = {
      status: (code) => ({
        json: async (data) => {
          if (code === 201 && data.success) {
            // Success case - send email after order creation
            console.log('Order created successfully, sending confirmation email...');
            
            // Prepare order data for email
            emailOrderData = {
              ...orderData,
              orderId: data.order._id
            };

            // Send order confirmation email
            if (email) {
              const emailResult = await sendOrderConfirmationEmail(
                emailOrderData, 
                email, 
                customerDetails
              );
              
              if (emailResult.success) {
                console.log('Order confirmation email sent successfully');
              } else {
                console.error('Failed to send order confirmation email:', emailResult.error);
              }
            }

            // Send response
            res.json({
              success: true,
              message: "Payment verified and order created successfully",
              orderId: data.order._id,
              order: data.order,
              productUpdateResults: data.productUpdateResults,
              emailSent: email ? emailResult?.success || false : false
            });
          } else {
            // Error case
            res.status(code).json(data);
          }
        }
      }),
      json: async (data) => {
        // Handle direct json calls
        res.json(data);
      }
    };

    // Call the createOrder function with mock req/res
    await createOrder(mockReq, mockRes);

  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
      details: error.message
    });
  }
});

// Get payment status
router.get("/payment-status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount / 100,
        method: payment.method,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment status"
    });
  }
});

export default router;