const express = require('express');
const router = express.Router();

const {
  getAllDoctors,
  getDoctorById,
  getDoctorAvailability,
  addDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');

const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  addDoctor
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin', 'doctor'),
  updateDoctor
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  deleteDoctor
);

module.exports = router;