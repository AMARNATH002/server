const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const upload = require('../utils/upload');
const {
  getShopProfile,
  updateShopProfile,
  getShopFoods,
  addShopFood,
  updateShopFood,
  deleteShopFood,
  getShopOrders,
  updateOrderStatus,
  getShopSales,
  getShopFeedback,
  submitFeedback,
  deleteShopOrder,
} = require('../controllers/shopController');


router.get('/me',  authenticateToken, getShopProfile);
router.put('/me',  authenticateToken, updateShopProfile);

router.get('/foods',        authenticateToken, getShopFoods);
router.post('/foods',       authenticateToken, upload.single('image'), addShopFood);
router.put('/foods/:id',    authenticateToken, upload.single('image'), updateShopFood);
router.delete('/foods/:id', authenticateToken, deleteShopFood);


router.get('/orders',                      authenticateToken, getShopOrders);
router.put('/orders/:orderId/status',      authenticateToken, updateOrderStatus);
router.delete('/orders/:orderId',          authenticateToken, deleteShopOrder);


router.get('/sales', authenticateToken, getShopSales);


router.get('/feedback', authenticateToken, getShopFeedback);

module.exports = router;
