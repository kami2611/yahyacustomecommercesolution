const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productController');
const { upload } = require('../../config/cloudinary');

// Product management routes
router.get('/', productController.index);
router.get('/create', productController.create);
router.post('/', upload.array('images', 5), productController.store);
router.get('/:id/edit', productController.edit);
router.put('/:id', upload.array('images', 5), productController.update);
router.delete('/:id', productController.destroy);

// Image management routes
router.post('/:id/upload-images', upload.array('images', 5), productController.uploadImages);
router.delete('/:id/images/:imageIndex', productController.deleteImage);

module.exports = router;
