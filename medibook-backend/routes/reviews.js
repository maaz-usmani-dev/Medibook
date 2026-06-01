const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getReviews, createReview } = require('../controllers/reviewController');

router.get('/', getReviews);
router.post('/', verifyToken, createReview);

module.exports = router;
