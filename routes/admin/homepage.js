const express = require('express');
const router = express.Router();
const homepageController = require('../../controllers/homepageController');
const { upload } = require('../../config/cloudinary');

// Homepage sections management
router.get('/', homepageController.homepage);
router.post('/carousel/add', upload.single('carouselImage'), homepageController.addToCarousel);
router.post('/carousel/:id/remove', homepageController.removeFromCarousel);
router.post('/section/toggle', homepageController.toggleSection);
router.post('/section/:id/remove', homepageController.removeFromSection);

module.exports = router;
