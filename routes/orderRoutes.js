const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { placeOrder, getMyOrders, cancelOrder } = require('../controllers/orderController');

router.post('/',                    authenticateToken, placeOrder);
router.get('/',                     authenticateToken, getMyOrders);
router.put('/:orderId/cancel',      authenticateToken, cancelOrder);

module.exports = router;
