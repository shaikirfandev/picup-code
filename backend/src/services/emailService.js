const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"mepiks" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const html = `
    <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333;">
      <h2 style="color: #e11d48; margin-bottom: 16px;">Reset Your Password</h2>
      <p>You requested a password reset for your mepiks account.</p>
      <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #e11d48; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
        Reset Password
      </a>
      <p style="font-size: 13px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #aaa;">mepiks &mdash; Your creative community</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset your mepiks password',
    html,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail };
