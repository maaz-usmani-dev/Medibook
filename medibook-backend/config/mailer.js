const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER || 'YOUR_EMAIL@gmail.com',
    pass: process.env.MAIL_PASS || 'YOUR_APP_PASSWORD',
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'MediBook <no-reply@medibook.com>',
    to,
    subject,
    html,
  });
};

const sendBookingConfirmation = async (email, details) => {
  await sendEmail({
    to: email,
    subject: 'Appointment Booked',
    html: `
      <h2>Appointment Confirmed</h2>
      <p>Doctor: ${details.doctor}</p>
      <p>Date: ${details.date}</p>
      <p>Time: ${details.time}</p>
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
  sendPasswordResetEmail,
};