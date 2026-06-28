const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { placeOrder, getMyOrders, cancelOrder, deleteOrder } = require('../controllers/orderController');

router.post('/',                    authenticateToken, placeOrder);
router.get('/',                     authenticateToken, getMyOrders);
router.put('/:orderId/cancel',      authenticateToken, cancelOrder);
router.delete('/:orderId',          authenticateToken, deleteOrder);

module.exports = router;
