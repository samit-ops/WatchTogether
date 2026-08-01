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
          <h2 style="color: #F8FAFC; font-size: 20px; margin-top: 0;">Hello ${user.name},</h2>
          <p style="color: #CBD5E1; font-size: 15px; line-height: 1.5;">
            Thank you for upgrading your subscription! Your <strong>${plan} Plan</strong> is now active.
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

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Watch Together" <no-reply@watchtogether.com>',
        to: user.email,
        subject: `Payment Confirmed: Watch Together ${plan} Plan Invoice`,
        html: htmlContent
      });
      logger.info(`[Email] Subscription invoice sent to ${user.email}`);

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

module.exports = {
  sendSubscriptionConfirmation,
  sendInvoiceEmail
};
