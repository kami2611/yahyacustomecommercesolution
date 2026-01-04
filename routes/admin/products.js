const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productController');
const { upload } = require('../../config/cloudinary');

// Configure multer to handle both product images and carousel image
const productUpload = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'carouselImage', maxCount: 1 }
]);

// Product management routes
router.get('/', productController.index);
router.get('/create', productController.create);
router.post('/', productUpload, productController.store);
router.get('/:id/edit', productController.edit);
router.put('/:id', productUpload, productController.update);
router.delete('/:id', productController.destroy);

// Image management routes
router.post('/:id/upload-images', upload.array('images', 5), productController.uploadImages);
router.delete('/:id/images/:imageIndex', productController.deleteImage);

module.exports = router;
