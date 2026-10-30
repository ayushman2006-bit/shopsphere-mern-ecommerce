const express = require('express');
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const { uploadImages } = require('../controllers/upload.controller');

const router = express.Router();

router.post('/', protect, admin, upload.array('images', 6), uploadImages);

module.exports = router;
