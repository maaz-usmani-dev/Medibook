const nodemailer = require('nodemailer');

const hasOAuthConfig = () =>
  process.env.MAIL_CLIENT_ID &&
  process.env.MAIL_CLIENT_SECRET &&
  process.env.MAIL_REFRESH_TOKEN;

const hasPasswordConfig = () => process.env.MAIL_PASS;

const isMailEnabled = () => {
  if (process.env.MAIL_ENABLED === 'false') return false;
  if (process.env.MAIL_ENABLED === 'true') return true;
  return Boolean(process.env.MAIL_USER && (hasPasswordConfig() || hasOAuthConfig()));
};

let transporter;

const getTransporter = () => {
  if (!isMailEnabled()) return null;

  if (!process.env.MAIL_USER) {
    throw new Error('MAIL_USER is required when MAIL_ENABLED=true.');
  }

  if (!hasPasswordConfig() && !hasOAuthConfig()) {
    throw new Error('Set MAIL_PASS or Gmail OAuth env vars when MAIL_ENABLED=true.');
  }

  if (!transporter) {
    const auth = hasOAuthConfig()
      ? {
          type: 'OAuth2',
          user: process.env.MAIL_USER,
          clientId: process.env.MAIL_CLIENT_ID,
          clientSecret: process.env.MAIL_CLIENT_SECRET,
          refreshToken: process.env.MAIL_REFRESH_TOKEN,
        }
      : {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        };

    transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || 'gmail',
      auth,
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.warn(`Email skipped because mail is not configured: ${subject} -> ${to}`);
    return false;
  }

  await activeTransporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    html,
  });

  return true;
};

const sendBookingConfirmation = async (emailOrDetails, maybeDetails) => {
  const details = maybeDetails || emailOrDetails;
  const email = typeof emailOrDetails === 'string' ? emailOrDetails : details.patientEmail;

  await sendEmail({
    to: email,
    subject: 'Appointment Booked',
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Doctor: ${details.doctor || details.doctorName}</p>
      <p>Date: ${details.date}</p>
      <p>Time: ${details.time || details.timeSlot}</p>
      ${details.type ? `<p>Type: ${details.type}</p>` : ''}
      ${details.fee ? `<p>Fee: ${details.fee}</p>` : ''}
    `,
  });
};

const sendDoctorApplicationNotification = async ({ adminEmail, doctorEmail, doctorName }) => {
  await sendEmail({
    to: adminEmail,
    subject: 'New Doctor Registration Pending Approval',
    html: `
      <h2>Doctor Application Received</h2>
      <p>${doctorName} (${doctorEmail}) has submitted a doctor registration request.</p>
      <p>Please review and approve or reject the request from the admin dashboard.</p>
    `,
  });
};

const sendDoctorApprovalNotification = async ({ doctorEmail, doctorName, status }) => {
  await sendEmail({
    to: doctorEmail,
    subject: status === 'approved' ? 'Doctor Registration Approved' : 'Doctor Registration Rejected',
    html: `
      <h2>Doctor Registration ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
      <p>Hi ${doctorName},</p>
      <p>Your doctor registration has been ${status === 'approved' ? 'approved' : 'rejected'} by the admin.</p>
      ${status === 'approved' ? '<p>You can now sign in and complete your profile.</p>' : '<p>Please contact support for next steps.</p>'}
    `,
  });
};

const sendDoctorAccountCreatedEmail = async ({ doctorEmail, doctorName, password, loginUrl }) => {
  await sendEmail({
    to: doctorEmail,
    subject: 'Your MediBook Doctor Account',
    html: `
      <h2>Your Doctor Account Is Ready</h2>
      <p>Hi ${doctorName},</p>
      <p>An admin created your MediBook doctor account.</p>
      <p><strong>Email:</strong> ${doctorEmail}</p>
      <p><strong>Temporary password:</strong> ${password}</p>
      <p><a href="${loginUrl}" target="_blank">Sign in to MediBook</a></p>
      <p>Please sign in and update your password as soon as possible.</p>
    `,
  });
};

const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
  await sendEmail({
    to,
    subject: 'Reset Your MediBook Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${fullName},</p>
      <p>We received a request to reset your password. Click the link below to choose a new password:</p>
      <p><a href="${resetUrl}" target="_blank">Reset your password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

module.exports = {
  sendBookingConfirmation,
  sendDoctorApplicationNotification,
  sendDoctorApprovalNotification,
  sendDoctorAccountCreatedEmail,
  sendPasswordResetEmail,
};
