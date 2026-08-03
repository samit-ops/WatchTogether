const nodemailer = require('nodemailer');
const dns = require('dns');
const logger = require('../config/logger');

// Force IPv4 resolution for cloud environments
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

// Helper to get Brevo API Key from any environment variable name
const getBrevoApiKey = () => {
  const candidates = [
    process.env.BREVO_API_KEY,
    process.env.SENDINBLUE_API_KEY,
    process.env.BREVO_KEY,
    process.env.SMTP_PASS,
    process.env.EMAIL_PASS
  ];
  for (const key of candidates) {
    if (key && (key.startsWith('xkeysib-') || key.startsWith('xsmtpsib-') || key.length > 20)) {
      return key.trim();
    }
  }
  return process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || null;
};

// Brevo HTTPS REST API Dispatcher (Primary Email Delivery Engine)
const sendViaBrevoApi = async ({ toEmail, toName, subject, htmlContent, attachments = [] }) => {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    console.warn('⚠️ [BREVO REST API] No Brevo API Key found in environment variables.');
    return false;
  }

  // Determine sender email. Brevo requires a verified sender email in your Brevo account.
  const senderCandidates = [
    process.env.BREVO_SENDER_EMAIL,
    process.env.SMTP_USER,
    process.env.EMAIL_USER,
    'chamkilichaddi96@gmail.com'
  ].filter(Boolean);

  console.log('\n================ [BREVO REST API DISPATCH] ================');
  console.log('Target Recipient Email:', toEmail);
  console.log('Brevo API Key detected:', `YES (${apiKey.substring(0, 10)}...)`);

  for (const senderEmail of senderCandidates) {
    try {
      console.log(`[Brevo API] Attempting to send from sender: ${senderEmail}...`);

      const payload = {
        sender: { name: process.env.BREVO_SENDER_NAME || 'Watch Together Security', email: senderEmail },
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
        console.log(`✅ [BREVO REST API SUCCESS] OTP Email delivered to ${toEmail}! MessageId: ${resData.messageId}`);
        return true;
      } else {
        console.warn(`⚠️ [BREVO API REJECTED with sender ${senderEmail}]:`, resData.message || resData);
      }
    } catch (err) {
      console.error(`❌ [BREVO API ERROR with sender ${senderEmail}]:`, err.message);
    }
  }

  return false;
};

// Brevo SMTP Transporter (Fallback via smtp-relay.brevo.com:587)
const createBrevoSmtpTransporter = async () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.BREVO_SENDER_EMAIL;
  const pass = getBrevoApiKey() || process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;

  if (user && pass) {
    const cleanPass = pass.replace(/\s+/g, '');
    console.log(`[Brevo SMTP Transporter] Initializing ${host}:${port} for ${user}...`);

    return nodemailer.createTransport({
      host,
      port,
      secure: false, // Port 587 uses STARTTLS
      requireTLS: true,
      auth: { user, pass: cleanPass },
      family: 4,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      socketTimeout: 10000
    });
  }

  return null;
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

    // Try Brevo REST API first
    const apiSuccess = await sendViaBrevoApi({
      toEmail: user.email,
      toName: user.name,
      subject: `🎉 Congratulations! You are now a ${plan} Member - Watch Together Invoice`,
      htmlContent,
      attachments
    });
    if (apiSuccess) return true;

    // Fallback to Brevo SMTP Transporter
    const transporter = await createBrevoSmtpTransporter();
    if (transporter) {
      const fromUser = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER || 'chamkilichaddi96@gmail.com';
      await transporter.sendMail({
        from: `"Watch Together" <${fromUser}>`,
        to: user.email,
        subject: `🎉 Congratulations! You are now a ${plan} Member - Watch Together Invoice`,
        html: htmlContent,
        attachments: attachments.map(a => ({ filename: a.filename, content: a.content, contentType: 'application/pdf' }))
      });
      logger.info(`[Email] Subscription invoice sent to ${user.email}`);
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

    // 1. Try Brevo HTTPS REST API (Primary Engine)
    const apiSuccess = await sendViaBrevoApi({
      toEmail: user.email,
      toName: user.name,
      subject,
      htmlContent
    });
    if (apiSuccess) return true;

    // 2. Try Fallback Brevo SMTP Transporter
    const transporter = await createBrevoSmtpTransporter();
    if (transporter) {
      const fromUser = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER || 'chamkilichaddi96@gmail.com';
      await transporter.sendMail({
        from: `"Watch Together Security" <${fromUser}>`,
        to: user.email,
        subject,
        html: htmlContent
      });
      console.log(`✅ [BREVO SMTP SUCCESS] OTP email dispatched to ${user.email}!`);
      return true;
    }

    console.warn(`⚠️ [BREVO UNCONFIGURED] Active OTP for ${user.email} is: ${otpCode}`);
    return true;
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
