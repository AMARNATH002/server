const Order = require('../models/Order');

const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, phone } = req.body;

    const order = new Order({
      userId: req.user.userId,
      items,
      totalAmount,
      deliveryAddress,
      phone,
    });

    await order.save();
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.userId,
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered orders' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Customer deletes (removes) an order from their history — only cancelled orders allowed
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.userId,
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      return res.status(400).json({ message: 'You can only delete cancelled or delivered orders' });
    }

    await Order.deleteOne({ _id: order._id });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { placeOrder, getMyOrders, cancelOrder, deleteOrder };
