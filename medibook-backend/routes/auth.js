// ============================================================
//  routes/auth.js
// ============================================================
const express    = require('express');
const { body }   = require('express-validator');
const multer     = require('multer');
const router      = express.Router();
const verifyToken  = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateMe,
  updateAvatar,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
  completeGoogleProfile,
} = require('../controllers/authController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  },
});

// Validation rules
const registerRules = [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').optional().isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor.'),
  body('specialty').if(body('role').equals('doctor')).trim().notEmpty().withMessage('Specialty is required for doctors.'),
  body('hospital').if(body('role').equals('doctor')).trim().notEmpty().withMessage('Hospital or clinic is required for doctors.'),
  body('experience_years').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Experience years must be a positive number.'),
  body('fee').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Fee must be a positive number.'),
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
  body('specialty').optional({ checkFalsy: true }).trim(),
  body('hospital').optional({ checkFalsy: true }).trim(),
  body('experience_years').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Experience years must be a positive number.'),
  body('fee').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Fee must be a positive number.'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/logout',   logout);
router.post('/forgot-password', forgotPasswordRules, forgotPassword);
router.post('/reset-password', resetPasswordRules, resetPassword);
router.post('/google-login', googleLoginRules, googleLogin);
router.put('/google-complete-profile', verifyToken, googleProfileRules, completeGoogleProfile);
router.get('/me',        verifyToken,   getMe);
router.put('/me',        verifyToken,   updateMe);
router.put('/me/avatar', verifyToken, upload.single('avatar'), updateAvatar);

module.exports = router;
