const express = require('express');
const router = express.Router();
const canteenController = require('../controllers/canteencontroller');
const { authenticate } = require('../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage }); // Configure as needed
// Canteen owner routes
router.post('/menu', authenticate, canteenController.createUpdateMenu);
router.get('/getmenu', authenticate, canteenController.getMenu);
router.get('/getallmenu', authenticate, canteenController.getAllMenus);
router.put('/menu/:itemId', authenticate, canteenController.updateMenuItem);
router.delete('/menu', authenticate, canteenController.deleteMenu);
router.delete('/menu/:itemId', authenticate, canteenController.deleteMenuItem)
router.post('/bill', authenticate, upload.single('bill'), canteenController.uploadBill);
router.delete('/bill', authenticate, canteenController.deleteBill);
// Add this route after the other routes
router.get('/bills', authenticate, canteenController.getBills);
// Admin routes
router.get('/all', authenticate, canteenController.getAllCanteenData);

module.exports = router;