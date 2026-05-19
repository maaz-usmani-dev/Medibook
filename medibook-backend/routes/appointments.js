// ============================================================
//  routes/appointments.js
// ============================================================
const express     = require('express');
const { body }    = require('express-validator');
const router      = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateStatus,
  rescheduleAppointment,
} = require('../controllers/appointmentController');

const bookRules = [
  body('doctor_id').isInt().withMessage('doctor_id must be an integer.'),
  body('appointment_date').isDate().withMessage('Valid appointment_date (YYYY-MM-DD) is required.'),
  body('time_slot').notEmpty().withMessage('time_slot is required.'),
  body('type').optional().isIn(['In-person', 'Video']),
];

// Patient books
router.post('/',              verifyToken, requireRole('patient'), bookRules, bookAppointment);
// Patient or doctor views their own
router.get('/my',             verifyToken, requireRole('patient', 'doctor'), getMyAppointments);
// Specific appointment details
router.get('/:id',             verifyToken, requireRole('patient', 'doctor', 'admin'), getAppointmentById);
// Doctor or admin updates status
router.put('/:id/status',     verifyToken, requireRole('doctor', 'admin'),   updateStatus);
// Patient reschedules
router.put('/:id/reschedule', verifyToken, requireRole('patient'),           rescheduleAppointment);

module.exports = router;
