// ============================================================
//  routes/auth.js
// ============================================================
const express    = require('express');
const { body }   = require('express-validator');
const router      = express.Router();
const verifyToken  = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
  completeGoogleProfile,
} = require('../controllers/authController');

// Validation rules
const registerRules = [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').optional().isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const forgotPasswordRules = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

const googleLoginRules = [
  body('idToken').notEmpty().withMessage('Google ID token is required.'),
];

const googleProfileRules = [
  body('date_of_birth').notEmpty().withMessage('Date of birth is required.'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender is required.'),
  body('role').isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/logout',   logout);
router.post('/forgot-password', forgotPasswordRules, forgotPassword);
router.post('/reset-password', resetPasswordRules, resetPassword);
router.post('/google-login', googleLoginRules, googleLogin);
router.put('/google-complete-profile', verifyToken, googleProfileRules, completeGoogleProfile);
router.get('/me',        verifyToken,   getMe);

module.exports = router;
