// ============================================================
//  controllers/authController.js
// ============================================================
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const db      = require('../config/db');
const {
  sendDoctorApplicationNotification,
  sendDoctorApprovalNotification,
  sendPasswordResetEmail,
} = require('../config/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper: generate JWT ──────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const sendAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const needsProfileCompletion = (user) => {
  return !user.date_of_birth || !user.gender || !user.role || !user.phone || (user.role === 'doctor' && !user.doctor_status);
};

const notifyDoctorApplication = async ({ adminEmail, doctorEmail, doctorName }) => {
  try {
    await sendDoctorApplicationNotification({ adminEmail, doctorEmail, doctorName });
  } catch (mailerError) {
    console.error('Doctor application notification failed:', mailerError.message);
  }
};

// ── POST /api/auth/register ───────────────────────────────────
const register = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { full_name, email, password, phone, date_of_birth, gender, role } = req.body;

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    // Prevent self-registration as admin
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin registration is not allowed.' });
    }

    // Only allow 'patient' or 'doctor' self-registration
    const safeRole = ['patient', 'doctor'].includes(role) ? role : 'patient';

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, date_of_birth, gender, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, phone || null, date_of_birth || null, gender || null, safeRole]
    );

    const userId = result.insertId;

    // If registering as doctor, create an empty doctor profile and keep status in review.
    if (safeRole === 'doctor') {
      await db.query('INSERT INTO doctors (user_id, status) VALUES (?, ?)', [userId, 'review']);

      await notifyDoctorApplication({
        adminEmail: process.env.ADMIN_EMAIL || 'admin@medibook.com',
        doctorEmail: email,
        doctorName: full_name,
      });

      return res.status(201).json({
        message: 'Doctor registration submitted successfully and is pending admin approval.',
        user: { id: userId, full_name, email, role: safeRole },
        status: 'review',
      });
    }

    const token = signToken({ id: userId, role: safeRole, email });
    sendAuthCookie(res, token);

    return res.status(201).json({
      message: 'Registration successful.',
      user: { id: userId, full_name, email, role: safeRole },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT u.*, d.status AS doctor_status FROM users u LEFT JOIN doctors d ON d.user_id = u.id WHERE u.email = ?',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Contact support.' });
    }

    if (user.role === 'doctor' && user.doctor_status !== 'active') {
      return res.status(403).json({
        error:
          user.doctor_status === 'review'
            ? 'Your doctor registration is pending admin approval.'
            : 'Your doctor account is not active. Contact support.',
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    sendAuthCookie(res, token);

    return res.json({
      message: 'Login successful.',
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, phone, date_of_birth, gender, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ message: 'Logged out successfully.' });
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const [rows] = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
    await db.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    let emailSent = true;
    try {
      await sendPasswordResetEmail({
        to: email,
        fullName: user.full_name,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`,
      });
    } catch (mailerError) {
      console.error('Password reset email failed:', mailerError.message);
      emailSent = false;
    }

    const response = {
      message: 'If that email exists, a reset link has been sent.',
    };

    if (!emailSent && process.env.NODE_ENV !== 'production') {
      response.resetToken = rawToken;
    }

    return res.json(response);
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ error: 'Unable to process password reset request.' });
  }
};

const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { token, newPassword } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const [rows] = await db.query(
      'SELECT pr.user_id FROM password_resets pr WHERE pr.token_hash = ? AND pr.expires_at > NOW()',
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired.' });
    }

    const userId = rows[0].user_id;
    const password_hash = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [userId]);

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Unable to reset password.' });
  }
};

const googleLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { idToken } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    const full_name = payload.name;
    const googleId = payload.sub;
    const email_verified = payload.email_verified;

    if (!email_verified) {
      return res.status(400).json({ error: 'Google account email must be verified.' });
    }

    const [rows] = await db.query(
      'SELECT u.*, d.status AS doctor_status FROM users u LEFT JOIN doctors d ON d.user_id = u.id WHERE u.google_id = ? OR u.email = ?',
      [googleId, email]
    );

    let user;
    if (rows.length > 0) {
      user = rows[0];
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
        user.google_id = googleId;
      }
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Your account has been blocked. Contact support.' });
      }
      if (user.role === 'doctor' && user.doctor_status !== 'active') {
        return res.status(403).json({
          error:
            user.doctor_status === 'review'
              ? 'Your doctor registration is pending admin approval.'
              : 'Your doctor account is not active. Contact support.',
        });
      }
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const password_hash = await bcrypt.hash(randomPassword, 10);
      const [result] = await db.query(
        'INSERT INTO users (full_name, email, google_id, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [full_name, email, googleId, password_hash, 'patient']
      );

      user = {
        id: result.insertId,
        full_name,
        email,
        role: 'patient',
        google_id: googleId,
        date_of_birth: null,
        gender: null,
        phone: null,
      };
    }

    const token = signToken(user);
    sendAuthCookie(res, token);

    const profileNeedsCompletion = needsProfileCompletion(user);

    return res.json({
      message: 'Google sign in successful.',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        phone: user.phone,
      },
      needsProfileCompletion: profileNeedsCompletion,
    });
  } catch (err) {
    console.error('googleLogin error:', err);
    return res.status(500).json({ error: 'Unable to sign in with Google.' });
  }
};

const completeGoogleProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { date_of_birth, gender, role, phone } = req.body;
  const userId = req.user.id;
  const safeRole = ['patient', 'doctor'].includes(role) ? role : 'patient';

  try {
    await db.query(
      'UPDATE users SET date_of_birth = ?, gender = ?, role = ?, phone = ? WHERE id = ?',
      [date_of_birth || null, gender || null, safeRole, phone || null, userId]
    );

    if (safeRole === 'doctor') {
      const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
      if (doctorRows.length === 0) {
        await db.query('INSERT INTO doctors (user_id, status) VALUES (?, ?)', [userId, 'review']);
        await notifyDoctorApplication({
          adminEmail: process.env.ADMIN_EMAIL || 'admin@medibook.com',
          doctorEmail: req.user.email,
          doctorName: req.user.full_name,
        });
      }
    }

    const [updatedRows] = await db.query(
      'SELECT u.id, u.full_name, u.email, u.phone, u.date_of_birth, u.gender, u.role, d.status AS doctor_status FROM users u LEFT JOIN doctors d ON d.user_id = u.id WHERE u.id = ?',
      [userId]
    );

    const updatedUser = updatedRows[0];
    const profileNeedsCompletion = needsProfileCompletion(updatedUser);

    return res.json({
      message: 'Profile completed successfully.',
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        date_of_birth: updatedUser.date_of_birth,
        gender: updatedUser.gender,
        phone: updatedUser.phone,
      },
      needsProfileCompletion: profileNeedsCompletion,
      doctor_status: updatedUser.doctor_status,
    });
  } catch (err) {
    console.error('completeGoogleProfile error:', err);
    return res.status(500).json({ error: 'Unable to complete profile.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
  completeGoogleProfile,
};
