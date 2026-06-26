const fs = require('fs');
const FoodItem = require('../models/FoodItem');
const FoodCategory = require('../models/FoodCategory');
const FoodRating = require('../models/FoodRating');

const getBaseUrl = () =>
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;


const getAllFoods = async (req, res) => {
  const baseUrl = getBaseUrl();
  try {
    const dbFoods = await FoodItem.find().populate(
      'shopId',
      'name shopName city pincode phone address'
    );

    const allRatings = await FoodRating.find();

    
    const ratingMap = {};
    allRatings.forEach((r) => {
      const key = r.foodId.toString();
      if (!ratingMap[key]) ratingMap[key] = [];
      ratingMap[key].push(r.rating);
    });

    const formatted = dbFoods.map((item) => {
      const shop = item.shopId || {
        name: 'Admin',
        shopName: 'Tomato Kitchen',
        city: 'Chennai',
        pincode: '600001',
        phone: '+91 98765 43210',
        address: '123 Food Street, Chennai',
      };
      const ratings = ratingMap[item._id.toString()] || [];
      const avg = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        id:          item._id,
        name:        item.name,
        price:       item.price,
        category:    item.category,
        image:       `${baseUrl}/images/${item.image}`,
        shopName:    shop.shopName || shop.name || 'Tomato Kitchen',
        city:        shop.city    || 'Chennai',
        pincode:     shop.pincode || '600001',
        shopPhone:   shop.phone   || '+91 98765 43210',
        shopAddress: shop.address || '123 Food Street, Chennai',
        shopId:      shop._id     || null,
        avgRating:   Math.round(avg * 10) / 10,
        ratingCount: ratings.length,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.json([]);
  }
};


const rateFood = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1-5' });
    }

    await FoodRating.findOneAndUpdate(
      { foodId: req.params.id, userId: req.user.userId },
      { rating: Number(rating) },
      { upsert: true, new: true }
    );

    const all = await FoodRating.find({ foodId: req.params.id });
    const avg = all.reduce((a, r) => a + r.rating, 0) / all.length;

    res.json({
      avgRating:   Math.round(avg * 10) / 10,
      ratingCount: all.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


const getCategories = async (req, res) => {
  try {
    const cats = await FoodCategory.find().sort({ name: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name required' });
    }
    const trimmed = name.trim();
    const existing = await FoodCategory.findOne({
      name: new RegExp('^' + trimmed + '$', 'i'),
    });
    if (existing) return res.status(400).json({ message: 'Command already exists' });

    const cat = new FoodCategory({ name: trimmed });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const cat = await FoodCategory.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllFoods, rateFood, getCategories, addCategory, deleteCategory };
