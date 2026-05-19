// ============================================================
//  routes/availability.js
// ============================================================
const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { getSlots, addSlot, deleteSlot } = require('../controllers/availabilityController');

router.get('/:doctorId',  getSlots);
router.post('/',          verifyToken, requireRole('doctor'), addSlot);
router.delete('/:id',     verifyToken, requireRole('doctor'), deleteSlot);

module.exports = router;
