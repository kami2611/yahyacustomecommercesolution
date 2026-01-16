const express = require('express');
const router = express.Router();
const brandController = require('../../controllers/brandController');
const { upload } = require('../../config/cloudinary');

// Brand management routes
router.get('/', brandController.index);
router.get('/create', brandController.create);
router.post('/', upload.single('backgroundImage'), brandController.store);
router.get('/:id/edit', brandController.edit);
router.put('/:id', upload.single('backgroundImage'), brandController.update);
router.delete('/:id', brandController.destroy);

module.exports = router;
