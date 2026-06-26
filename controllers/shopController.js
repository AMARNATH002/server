const fs = require('fs');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const getBaseUrl = () =>
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

const getShopProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      shopName: user.shopName || `${user.name}'s Shop`,
      city:     user.city    || 'Chennai',
      pincode:  user.pincode || '600001',
      address:  user.address,
      phone:    user.phone,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const updateShopProfile = async (req, res) => {
  try {
    const { shopName, city, pincode, address, phone } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (shopName) user.shopName = shopName;
    if (city)     user.city     = city;
    if (pincode)  user.pincode  = pincode;
    if (address)  user.address  = address;
    if (phone)    user.phone    = phone;

    await user.save();
    res.json({
      message: 'Shop profile updated',
      shop: {
        shopName: user.shopName,
        city:     user.city,
        pincode:  user.pincode,
        address:  user.address,
        phone:    user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getShopFoods = async (req, res) => {
  const baseUrl = getBaseUrl();
  try {
    const foods = await FoodItem.find({ shopId: req.user.userId });
    const formatted = foods.map((item) => ({
      id:       item._id,
      name:     item.name,
      price:    item.price,
      category: item.category,
      image:    `${baseUrl}/images/${item.image}`,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const addShopFood = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const food = new FoodItem({
      name,
      price: Number(price),
      category,
      image:  req.file.filename,
      shopId: req.user.userId,
    });

    await food.save();
    const baseUrl = getBaseUrl();
    res.status(201).json({ ...food.toObject(), id: food._id, image: `${baseUrl}/images/${food.image}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateShopFood = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const food = await FoodItem.findOne({ _id: req.params.id, shopId: req.user.userId });
    if (!food) return res.status(404).json({ message: 'Food item not found or unauthorized' });

    if (name)     food.name     = name;
    if (price)    food.price    = Number(price);
    if (category) food.category = category;

    if (req.file) {
      const oldPath = `public/images/${food.image}`;
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
      }
      food.image = req.file.filename;
    }

    await food.save();
    const baseUrl = getBaseUrl();
    res.json({ ...food.toObject(), id: food._id, image: `${baseUrl}/images/${food.image}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteShopFood = async (req, res) => {
  try {
    const food = await FoodItem.findOneAndDelete({ _id: req.params.id, shopId: req.user.userId });
    if (!food) return res.status(404).json({ message: 'Food item not found or unauthorized' });

    const filePath = `public/images/${food.image}`;
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getShopOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'items.shopId': req.user.userId })
      .populate('userId', 'name email phone address')
      .sort({ createdAt: -1 });

    const filtered = orders.map((order) => {
      const obj = order.toObject();
      obj.items = obj.items.filter(
        (item) => item.shopId && item.shopId.toString() === req.user.userId.toString()
      );
      return obj;
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const hasItem = order.items.some(
      (item) => item.shopId && item.shopId.toString() === req.user.userId.toString()
    );
    if (!hasItem) return res.status(403).json({ message: 'Unauthorized' });

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getShopSales = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { 'items.shopId': req.user.userId, status: 'delivered' };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from + 'T00:00:00.000Z');
      if (to)   query.createdAt.$lte = new Date(to   + 'T23:59:59.999Z');
    }

    const orders = await Order.find(query)
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    const filteredOrders = orders.map((order) => {
      const obj = order.toObject();
      obj.items = obj.items.filter(
        (item) => item.shopId && item.shopId.toString() === req.user.userId.toString()
      );
      const ownerTotal = obj.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      obj.totalAmount = ownerTotal;
      totalRevenue += ownerTotal;
      return obj;
    });

    res.json({ orders: filteredOrders, totalRevenue, count: filteredOrders.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getShopFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ shopId: req.user.userId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const submitFeedback = async (req, res) => {
  try {
    const { shopId, rating, comment } = req.body;
    if (!shopId || !rating) {
      return res.status(400).json({ message: 'Shop ID and rating are required' });
    }

    const feedback = new Feedback({
      userId:  req.user.userId,
      shopId,
      rating:  Number(rating),
      comment,
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
