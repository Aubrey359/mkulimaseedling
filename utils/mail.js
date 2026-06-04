const nodemailer = require('nodemailer');

// 1. Create the transporter using your .env settings
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,      // mail.privateemail.com
    port: parseInt(process.env.EMAIL_PORT) || 465, // 465
    secure: process.env.EMAIL_SECURE === 'true',  // true
    auth: {
        user: process.env.EMAIL_USER,  // info@mkulimaseedlings.com
        pass: process.env.EMAIL_PASS   // Your email password
    }
});

// 2. Function to trigger an email (e.g., when an order or inquiry comes in)
const sendNotificationEmail = async (subject, textContent, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Mkulima Seedlings" <${process.env.EMAIL_USER}>`, 
            to: process.env.EMAIL_TO, // Where you want to receive alerts
            subject: subject,
            text: textContent,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully! Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email via Private Email:', error);
        return false;
    }
};

// 3. Send contact form notification
const sendContactEmail = async (contactData) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email not configured — skipping contact notification');
        return;
    }

    const { name, phone, interest, message } = contactData;
    
    const textContent = `
New contact inquiry received!

Name: ${name}
Phone: ${phone || 'Not provided'}
Interest: ${interest || 'Not specified'}

Message:
${message}

— MKULIMA Seedlings Contact System
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: #2d6a2d; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📧 New Contact Inquiry</h1>
        </div>
        <div style="background: #f9fdf9; padding: 24px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Interest:</strong> ${interest || 'Not specified'}</p>
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 16px 0;">
          <h3 style="color: #2d6a2d;">Message:</h3>
          <p style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${message.replace(/\n/g, '<br>')}</p>
          <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin-top: 16px; text-align: center; font-size: 14px; color: #1a4a1a;">
            — MKULIMA Seedlings Contact System
          </div>
        </div>
      </div>
    `;

    return await sendNotificationEmail(
        `📧 New Contact Inquiry from ${name} — MKULIMA Seedlings`,
        textContent,
        htmlContent
    );
};

// 4. Send order notification (reusable)
const sendOrderEmail = async (orderData) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email not configured — skipping order notification');
        return;
    }

    const itemsList = orderData.items
        .map(item => `• ${item.productName} x${item.quantity} = KES ${(item.price * item.quantity).toLocaleString()}`)
        .join('\n');

    const textContent = `
New order received!

Customer: ${orderData.farmer_name}
Date: ${new Date(orderData.date).toLocaleString()}

Items:
${itemsList}

Total: KES ${orderData.total.toLocaleString()}

Please confirm availability and arrange delivery.

— MKULIMA Seedlings Order System
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: #2d6a2d; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🌱 New Order Received!</h1>
        </div>
        <div style="background: #f9fdf9; padding: 24px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>Customer:</strong> ${orderData.farmer_name}</p>
          <p><strong>Date:</strong> ${new Date(orderData.date).toLocaleString()}</p>
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 16px 0;">
          <h3 style="color: #2d6a2d;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background: #e8f5e9;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map(item => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">KES ${item.price.toLocaleString()}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">KES ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="text-align: right; font-size: 18px; font-weight: bold; color: #2d6a2d; padding: 10px 0;">
            Total: KES ${orderData.total.toLocaleString()}
          </div>
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 16px 0;">
          <p style="color: #666; font-size: 14px;">Please confirm availability and arrange delivery.</p>
          <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin-top: 16px; text-align: center; font-size: 14px; color: #1a4a1a;">
            — MKULIMA Seedlings Order System
          </div>
        </div>
      </div>
    `;

    return await sendNotificationEmail(
        `🌱 New Order from ${orderData.farmer_name} — MKULIMA Seedlings`,
        textContent,
        htmlContent
    );
};

module.exports = { sendNotificationEmail, sendContactEmail, sendOrderEmail };