const express = require('express');
const protect = require('../middleware/auth');
const { updateReview, deleteReview } = require('../controllers/review.controller');

const router = express.Router();

router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
