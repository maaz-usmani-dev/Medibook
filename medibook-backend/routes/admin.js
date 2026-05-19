const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');

const {
  getStats,
  getAllUsers,
  toggleBlock,
  getPendingDoctors,
  updateDoctorStatus,
  getAllAppointments
} = require('../controllers/adminController');

router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/status', updateDoctorStatus);
router.put('/users/:id/block', toggleBlock);
router.get('/appointments', getAllAppointments);

module.exports = router;