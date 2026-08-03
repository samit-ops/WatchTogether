const logger = require('../config/logger');

/**
 * Single Email Transport: Brevo HTTPS REST API
 * --------------------------------------------
 * Uses POST https://api.brevo.com/v3/smtp/email on Port 443.
 * Requires environment variables in Render:
 * - BREVO_API_KEY (e.g. xkeysib-...)
 * - BREVO_SENDER_EMAIL (your verified sender email address in Brevo Dashboard)
 */
const sendViaBrevoApi = async ({ toEmail, toName, subject, htmlContent, attachments = [] }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('❌ [BREVO REST API ERROR] BREVO_API_KEY is missing in Render environment variables!');
    return false;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    console.error('❌ [BREVO REST API ERROR] BREVO_SENDER_EMAIL is missing in Render environment variables!');
    return false;
  }

  const senderName = process.env.BREVO_SENDER_NAME || 'Watch Together Security';

  console.log('\n================ [BREVO REST API DISPATCH] ================');
  console.log('Target Recipient Email:', toEmail);
  console.log('Sender Email (Verified):', senderEmail);
  console.log('Brevo API Key status:', `PRESENT (${apiKey.substring(0, 8)}...)`);

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName || toEmail.split('@')[0] }],
      subject: subject,
      htmlContent: htmlContent
    };

    if (attachments && attachments.length > 0) {
      payload.attachment = attachments.map(att => ({
        name: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64')
      }));
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json();

    if (response.ok) {
      console.log(`✅ [BREVO REST API SUCCESS] Email delivered to ${toEmail}! MessageId: ${resData.messageId}`);
      return true;
    } else {
      console.error(`❌ [BREVO API REJECTED] Code: ${response.status}`, resData);
      logger.error(`[Brevo API Error] Rejected: ${JSON.stringify(resData)}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ [BREVO API NETWORK ERROR]:`, err.message);
    logger.error(`[Brevo API Error] Network failure: ${err.message}`);
    return false;
  }
};

const sendSubscriptionConfirmation = async ({ user, plan, amount, razorpayPaymentId, razorpayOrderId, transactionDate, features = [] }) => {
  try {
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

        doc.fillColor('#3B82F6').fontSize(24).text('Watch Together', { align: 'center' });
        doc.fillColor('#64748B').fontSize(12).text('OFFICIAL INVOICE & RECEIPT', { align: 'center' });
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CBD5E1').stroke();
        doc.moveDown(1);

        doc.fillColor('#1E293B').fontSize(14).text(`Customer Name: ${user.name}`);
        doc.fillColor('#475569').fontSize(11).text(`Email Address: ${user.email}`);
        doc.text(`Transaction Date: ${formattedDate}`);
        doc.moveDown(1);

        doc.fillColor('#3B82F6').fontSize(16).text(`Subscription Plan: ${plan} Plan`);
        doc.fillColor('#10B981').fontSize(14).text(`Amount Paid: INR ${amount}`);
        doc.fillColor('#475569').fontSize(11).text(`Payment ID: ${razorpayPaymentId || 'N/A'}`);
        doc.text(`Order ID: ${razorpayOrderId || 'N/A'}`);
        doc.moveDown(1);

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

    const attachments = [];
    if (pdfAttachment) {
      const sanitizedName = (user.name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
      attachments.push({
        filename: `Invoice_${plan}_${sanitizedName}.pdf`,
        content: pdfAttachment
      });
    }

    return await sendViaBrevoApi({
      toEmail: user.email,
      toName: user.name,
      subject: `🎉 Congratulations! You are now a ${plan} Member - Watch Together Invoice`,
      htmlContent,
      attachments
    });
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

    const subject = `🔐 [Watch Together] ${otpCode} is your ${isReset ? 'Password Reset' : 'Security'} Code`;

    return await sendViaBrevoApi({
      toEmail: user.email,
      toName: user.name,
      subject,
      htmlContent
    });
  } catch (error) {
    console.error(`❌ [EMAIL DISPATCH ERROR] Failed to send OTP email:`, error);
    logger.error(`[Email Error] Failed to send OTP email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendSubscriptionConfirmation,
  sendInvoiceEmail,
  sendOtpEmail
};
