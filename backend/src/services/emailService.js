const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create reusable transporter
const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback to Ethereal Test Account for instant email preview links
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    logger.error('Failed to create Ethereal test email account:', err);
    return null;
  }
};

const sendSubscriptionConfirmation = async ({ user, plan, amount, razorpayPaymentId, razorpayOrderId, transactionDate, features = [] }) => {
  try {
    const transporter = await createTransporter();
    const formattedDate = new Date(transactionDate || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const featuresListHtml = features && features.length > 0
      ? features.map(f => `<li style="margin-bottom: 6px; color: #10B981;">✓ ${f}</li>`).join('')
      : `<li style="margin-bottom: 6px; color: #10B981;">✓ Premium Feature Access</li>`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #F8FAFC; padding: 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #3B82F6; margin: 0;">Watch Together</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Subscription Payment Receipt</p>
        </div>

        <div style="background: #1E293B; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="color: #10B981; font-size: 22px; margin-top: 0;">🎉 Congratulations ${user.name}!</h2>
          <p style="color: #F8FAFC; font-size: 16px; line-height: 1.6; margin-bottom: 12px;">
            Hey <strong>${user.name}</strong>, congratulations! You are now officially a <strong>${plan} Member</strong> on <strong>Watch Together</strong>!
          </p>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5; margin: 0;">
            📎 Your official <strong>Watch Together PDF invoice receipt</strong> (<code>Invoice_${plan}_Receipt.pdf</code>) is attached to this email.
          </p>
        </div>

        <div style="background: #1E293B; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #3B82F6; font-size: 16px; margin-top: 0; border-b: 1px solid #334155; padding-bottom: 8px;">Transaction Details</h3>
          <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 14px; color: #CBD5E1;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Selected Plan:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #F8FAFC;">${plan} Plan</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Amount Paid:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #10B981;">₹${amount} INR</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Transaction ID:</td>
              <td style="padding: 6px 0; font-family: monospace; color: #F8FAFC;">${razorpayPaymentId || 'TEST_TXN_ID'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Order ID:</td>
              <td style="padding: 6px 0; font-family: monospace; color: #F8FAFC;">${razorpayOrderId || 'TEST_ORDER_ID'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Date:</td>
              <td style="padding: 6px 0; color: #F8FAFC;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <div style="background: #1E293B; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="color: #10B981; font-size: 16px; margin-top: 0; margin-bottom: 12px;">Unlocked Plan Features</h3>
          <ul style="list-style: none; padding-left: 0; margin: 0; font-size: 14px;">
            ${featuresListHtml}
          </ul>
        </div>

        <div style="text-align: center; color: #64748B; font-size: 12px; margin-top: 20px;">
          <p>Enjoy your premium benefits on Watch Together!</p>
          <p>© 2026 Watch Together. All rights reserved.</p>
        </div>
      </div>
    `;

    let pdfAttachment = null;
    try {
      const PDFDocument = require('pdfkit');
      pdfAttachment = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header / Branding
        doc.fillColor('#3B82F6').fontSize(24).text('Watch Together', { align: 'center' });
        doc.fillColor('#64748B').fontSize(12).text('OFFICIAL INVOICE & RECEIPT', { align: 'center' });
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CBD5E1').stroke();
        doc.moveDown(1);

        // Customer Info
        doc.fillColor('#1E293B').fontSize(14).text(`Customer Name: ${user.name}`);
        doc.fillColor('#475569').fontSize(11).text(`Email Address: ${user.email}`);
        doc.text(`Transaction Date: ${formattedDate}`);
        doc.moveDown(1);

        // Transaction Table / Summary Box
        doc.fillColor('#3B82F6').fontSize(16).text(`Subscription Plan: ${plan} Plan`);
        doc.fillColor('#10B981').fontSize(14).text(`Amount Paid: INR ${amount}`);
        doc.fillColor('#475569').fontSize(11).text(`Payment ID: ${razorpayPaymentId || 'N/A'}`);
        doc.text(`Order ID: ${razorpayOrderId || 'N/A'}`);
        doc.moveDown(1);

        // Benefits
        doc.fillColor('#1E293B').fontSize(12).text('Unlocked Features:');
        doc.moveDown(0.5);
        (features || []).forEach(f => {
          doc.fillColor('#10B981').fontSize(10).text(`  - ${f}`);
        });

        doc.moveDown(2);
        doc.fillColor('#94A3B8').fontSize(10).text('Thank you for subscribing to Watch Together!', { align: 'center' });
        doc.end();
      });
    } catch (pdfErr) {
      logger.error('PDF Generation error:', pdfErr);
    }

    if (transporter) {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Watch Together" <no-reply@watchtogether.com>',
        to: user.email,
        subject: `🎉 Congratulations! You are now a ${plan} Member - Watch Together Invoice`,
        html: htmlContent
      };

      if (pdfAttachment) {
        const sanitizedName = (user.name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
        mailOptions.attachments = [
          {
            filename: `Invoice_${plan}_${sanitizedName}.pdf`,
            content: pdfAttachment,
            contentType: 'application/pdf'
          }
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      logger.info(`[Email] Subscription invoice sent to ${user.email} with PDF attachment`);

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`[Email Preview URL] View rendered invoice email online: ${previewUrl}`);
      }
    } else {
      logger.info(`[Email Dispatch Simulation] Invoice sent to ${user.email} for ${plan} plan (₹${amount})`);
    }

    return true;
  } catch (error) {
    logger.error(`[Email Error] Failed to send subscription confirmation: ${error.message}`);
    return false;
  }
};

const sendInvoiceEmail = async ({ user, paymentRecord }) => {
  if (!paymentRecord) return false;
  return sendSubscriptionConfirmation({
    user,
    plan: paymentRecord.plan,
    amount: paymentRecord.amount,
    razorpayPaymentId: paymentRecord.razorpayPaymentId,
    razorpayOrderId: paymentRecord.razorpayOrderId,
    transactionDate: paymentRecord.paidAt || paymentRecord.createdAt
  });
};

const sendOtpEmail = async ({ user, otpCode, purpose = 'LOGIN_NEW_DEVICE' }) => {
  try {
    const transporter = await createTransporter();
    if (!transporter) return false;

    const isReset = purpose === 'FORGOT_PASSWORD';
    const isSignup = purpose === 'SIGNUP_VERIFICATION';
    const title = isSignup ? '🎉 Welcome! Verify Your Account' : isReset ? 'Password Reset Verification Code' : 'New Device Security Verification';
    const description = isSignup
      ? 'Thank you for registering on Watch Together! Please enter the 6-digit verification OTP code below to activate your account.'
      : isReset
      ? 'You requested to reset your Watch Together password. Use the verification OTP code below to proceed.'
      : 'We noticed a login attempt to your Watch Together account from a new location or device. Please verify your identity using the OTP code below.';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #0F172A; color: #F8FAFC; padding: 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #3B82F6; margin: 0;">Watch Together</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Security Verification System</p>
        </div>

        <div style="background: #1E293B; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h2 style="color: #F8FAFC; font-size: 20px; margin-top: 0;">${title}</h2>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            ${description}
          </p>

          <div style="background: #0F172A; border: 2px dashed #3B82F6; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 16px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10B981;">${otpCode}</span>
          </div>

          <p style="color: #94A3B8; font-size: 13px; margin: 0;">
            ⏳ This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>

        <div style="text-align: center; color: #64748B; font-size: 12px;">
          <p>If you did not initiate this request, please change your password immediately.</p>
          <p>© 2026 Watch Together. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Watch Together Security" <no-reply@watchtogether.com>',
      to: user.email,
      subject: `🔐 [Watch Together] ${otpCode} is your ${isReset ? 'Password Reset' : 'Security'} Code`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[OTP Email Dispatched] ID: ${info.messageId} to ${user.email} (OTP: ${otpCode})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('\n======================================================');
      console.log(`✉️ [EMAIL PREVIEW URL (OTP)]: ${previewUrl}`);
      console.log(`🔐 OTP Code: ${otpCode}`);
      console.log('======================================================\n');
    }

    return true;
  } catch (error) {
    logger.error(`[Email Error] Failed to send OTP email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendSubscriptionConfirmation,
  sendInvoiceEmail,
  sendOtpEmail
};
