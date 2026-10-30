const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/uploads (admin) - accepts up to 6 images in the "images" field
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'Please select at least one image to upload');

  const images = req.files.map((file) => `/uploads/products/${file.filename}`);
  res.status(201).json({ success: true, message: 'Images uploaded', images });
});

module.exports = { uploadImages };
