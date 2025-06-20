// utils/emailTemplates.js

export const generateOrderConfirmationEmail = (orderData, customerDetails) => {
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
                text-align: right;
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
            .next-steps {
                background-color: #e8f5e8;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #28a745;
                margin-bottom: 20px;
            }
            .next-steps h3 {
                color: #28a745;
                margin-bottom: 10px;
            }
            .next-steps p {
                margin-bottom: 10px;
                color: #333;
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
            .social-links {
                margin-top: 15px;
            }
            .social-links a {
                color: #667eea;
                text-decoration: none;
                margin: 0 10px;
                font-size: 14px;
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
                .info-row {
                    flex-direction: column;
                    gap: 5px;
                }
                .info-value {
                    text-align: left;
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
                    <div class="info-row">
                        <span class="info-label">Payment Method:</span>
                        <span class="info-value">${paymentDetails?.payment_method || 'N/A'}</span>
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
                                    <strong>From:</strong> ${new Date(item.startDate).toLocaleDateString('en-IN', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}<br>
                                    <strong>To:</strong> ${new Date(item.endDate).toLocaleDateString('en-IN', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
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

                <div class="next-steps">
                    <h3>✅ What's Next?</h3>
                    <p>• You will receive a confirmation call within 24 hours</p>
                    <p>• Items will be prepared and quality checked before delivery</p>
                    <p>• Our team will deliver the items at your specified location</p>
                    <p>• Keep this email for your records and future reference</p>
                    <p>• Contact us if you have any questions or need to make changes</p>
                </div>

                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <h3 style="color: #856404; margin-bottom: 10px;">📞 Important Reminders</h3>
                    <p style="color: #856404; margin-bottom: 5px;">• Please ensure someone is available at the delivery location</p>
                    <p style="color: #856404; margin-bottom: 5px;">• Keep a valid ID proof ready for verification</p>
                    <p style="color: #856404;">• Items should be returned in the same condition as delivered</p>
                </div>
            </div>

            <div class="footer">
                <h3>Thank You for Choosing Us! 🙏</h3>
                <p>We appreciate your business and look forward to serving you again.</p>
                <p>Your satisfaction is our priority, and we're here to help every step of the way.</p>
                
                <div class="contact-info">
                    <p><strong>Need Help? Contact Us:</strong></p>
                    <p>📧 Email: ${process.env.COMPANY_EMAIL || 'support@yourcompany.com'}</p>
                    <p>📞 Phone: ${process.env.COMPANY_PHONE || '+91-XXXXXXXXXX'}</p>
                    <p>🌐 Website: ${process.env.COMPANY_WEBSITE || 'www.yourcompany.com'}</p>
                    <p>⏰ Customer Support: 9:00 AM - 8:00 PM (Mon-Sun)</p>
                </div>

                <div class="social-links">
                    <p style="margin-bottom: 10px;">Follow us on:</p>
                    <a href="#">Facebook</a> |
                    <a href="#">Instagram</a> |
                    <a href="#">Twitter</a> |
                    <a href="#">WhatsApp</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Alternative simpler email template for basic notifications
export const generateSimpleOrderEmail = (orderData, customerDetails) => {
  const { items, total, orderId } = orderData;
  const orderDate = new Date().toLocaleDateString('en-IN');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .order-box { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            .items-list { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>✅ Order Confirmation</h2>
            </div>
            <div class="content">
                <p>Dear ${customerDetails?.name || 'Customer'},</p>
                
                <p>Thank you for your order! We have received your payment and your order is being processed.</p>
                
                <div class="order-box">
                    <h3>Order #${orderId}</h3>
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Total Amount:</strong> ₹${total}</p>
                    <p><strong>Email:</strong> ${orderData.email}</p>
                </div>
                
                <div class="items-list">
                    <h3>Items Ordered:</h3>
                    <ul>
                        ${items.map(item => `
                            <li>
                                <strong>${item.name}</strong><br>
                                Quantity: ${item.qty} | Price: ₹${item.price} | Subtotal: ₹${(item.price * item.qty).toFixed(2)}
                                ${item.startDate && item.endDate ? `<br><em>Rental: ${new Date(item.startDate).toLocaleDateString('en-IN')} to ${new Date(item.endDate).toLocaleDateString('en-IN')}</em>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <p><strong>What's Next:</strong></p>
                <ul>
                    <li>We will contact you within 24 hours to confirm delivery details</li>
                    <li>Items will be delivered as per the scheduled dates</li>
                    <li>Please keep this email for your records</li>
                </ul>
                
                <p>If you have any questions, please contact us at ${process.env.COMPANY_EMAIL || 'support@yourcompany.com'} or ${process.env.COMPANY_PHONE || '+91-XXXXXXXXXX'}.</p>
                
                <p>Thank you for choosing us!</p>
                <p><strong>${process.env.COMPANY_NAME || 'Your Company'} Team</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Email template for order status updates
export const generateOrderStatusEmail = (orderData, status, customerDetails, additionalMessage = '') => {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being processed.',
    preparing: 'Your order is being prepared and will be ready for delivery soon.',
    shipped: 'Great news! Your order has been shipped and is on its way to you.',
    out_for_delivery: 'Your order is out for delivery and will reach you today.',
    delivered: 'Your order has been delivered successfully. We hope you enjoy your rental!',
    completed: 'Your rental period has completed. Thank you for choosing us!',
    cancelled: 'Your order has been cancelled as requested. Refund will be processed if applicable.',
    returned: 'Items have been returned successfully. Thank you for taking good care of them!'
  };

  const statusColors = {
    confirmed: '#2196F3',
    preparing: '#FF9800',
    shipped: '#9C27B0',
    out_for_delivery: '#FF5722',
    delivered: '#4CAF50',
    completed: '#607D8B',
    cancelled: '#F44336',
    returned: '#4CAF50'
  };

  const statusIcons = {
    confirmed: '✅',
    preparing: '🔧',
    shipped: '🚚',
    out_for_delivery: '🚛',
    delivered: '📦',
    completed: '🎉',
    cancelled: '❌',
    returned: '↩️'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: ${statusColors[status]}; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .status-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[status]}; }
            .order-details { background-color: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${statusIcons[status]} Order Status Update</h1>
                <p>Order #${orderData.orderId || 'N/A'}</p>
            </div>
            
            <div class="content">
                <p>Dear ${customerDetails?.name || 'Customer'},</p>
                
                <div class="status-box">
                    <h2 style="color: ${statusColors[status]}; margin-bottom: 10px;">
                        ${status.replace('_', ' ').toUpperCase()}
                    </h2>
                    <p style="font-size: 16px; margin-bottom: 10px;">${statusMessages[status]}</p>
                    ${additionalMessage ? `<p style="font-style: italic; color: #666;">${additionalMessage}</p>` : ''}
                </div>
                
                <div class="order-details">
                    <h3>Order Details:</h3>
                    <p><strong>Order ID:</strong> #${orderData.orderId || 'N/A'}</p>
                    <p><strong>Total Amount:</strong> ₹${orderData.total || 'N/A'}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                </div>
                
                ${status === 'delivered' ? `
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #28a745;">📋 Important Reminders:</h3>
                        <ul style="margin: 10px 0;">
                            <li>Please check all items immediately upon delivery</li>
                            <li>Report any issues within 2 hours of delivery</li>
                            <li>Take good care of the rented items</li>
                            <li>Return items on time and in good condition</li>
                        </ul>
                    </div>
                ` : ''}
                
                ${status === 'completed' || status === 'returned' ? `
                    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3 style="color: #1976d2;">🌟 We'd Love Your Feedback!</h3>
                        <p>Your experience matters to us. Please share your feedback and help us improve our services.</p>
                        <p>Rate us on Google, Facebook, or send us a message!</p>
                    </div>
                ` : ''}
                
                <p>If you have any questions or concerns, please don't hesitate to contact us:</p>
                <ul>
                    <li>📧 Email: ${process.env.COMPANY_EMAIL || 'support@yourcompany.com'}</li>
                    <li>📞 Phone: ${process.env.COMPANY_PHONE || '+91-XXXXXXXXXX'}</li>
                </ul>
                
                <p>Thank you for choosing us!</p>
                <p><strong>${process.env.COMPANY_NAME || 'Your Company'} Team</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Email template for payment reminders or issues
export const generatePaymentEmail = (orderData, type, customerDetails, dueDate = null) => {
  const emailTypes = {
    reminder: {
      subject: 'Payment Reminder',
      title: '💳 Payment Reminder',
      message: 'This is a friendly reminder about your pending payment.',
      color: '#FF9800'
    },
    overdue: {
      subject: 'Payment Overdue',
      title: '⚠️ Payment Overdue',
      message: 'Your payment is overdue. Please make the payment at your earliest convenience.',
      color: '#F44336'
    },
    failed: {
      subject: 'Payment Failed',
      title: '❌ Payment Failed',
      message: 'Your recent payment attempt was unsuccessful. Please try again or contact us for assistance.',
      color: '#F44336'
    },
    refund: {
      subject: 'Refund Processed',
      title: '💰 Refund Processed',
      message: 'Good news! Your refund has been processed successfully.',
      color: '#4CAF50'
    }
  };

  const emailConfig = emailTypes[type];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailConfig.subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: ${emailConfig.color}; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .alert-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${emailConfig.color}; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${emailConfig.title}</h1>
                <p>Order #${orderData.orderId || 'N/A'}</p>
            </div>
            
            <div class="content">
                <p>Dear ${customerDetails?.name || 'Customer'},</p>
                
                <div class="alert-box">
                    <p style="font-size: 16px; margin-bottom: 15px;">${emailConfig.message}</p>
                    <p><strong>Amount:</strong> ₹${orderData.total || 'N/A'}</p>
                    ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN')}</p>` : ''}
                </div>
                
                ${type === 'reminder' || type === 'overdue' ? `
                    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3>💡 How to Pay:</h3>
                        <ul>
                            <li>Visit our website and use the payment link</li>
                            <li>Use UPI: Pay to ${process.env.UPI_ID || 'your-upi@paytm'}</li>
                            <li>Bank Transfer: Contact us for account details</li>
                            <li>Visit our store for cash payment</li>
                        </ul>
                    </div>
                ` : ''}
                
                ${type === 'refund' ? `
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3>📝 Refund Details:</h3>
                        <p>The refund amount will be credited to your original payment method within 5-7 business days.</p>
                        <p>If you don't see the refund after 7 days, please contact us immediately.</p>
                    </div>
                ` : ''}
                
                <p>For any assistance, please contact us:</p>
                <ul>
                    <li>📧 Email: ${process.env.COMPANY_EMAIL || 'support@yourcompany.com'}</li>
                    <li>📞 Phone: ${process.env.COMPANY_PHONE || '+91-XXXXXXXXXX'}</li>
                </ul>
                
                <p>Thank you for your understanding.</p>
                <p><strong>${process.env.COMPANY_NAME || 'Your Company'} Team</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;
};