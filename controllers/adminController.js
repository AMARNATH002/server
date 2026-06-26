const fs = require('fs');
const User = require('../models/User');
const FoodItem = require('../models/FoodItem');

const getBaseUrl = () =>
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const addFood = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const food = new FoodItem({
      name,
      price:  Number(price),
      category,
      image:  req.file.filename,
      shopId: req.user.userId,
    });

    await food.save();
    const baseUrl = getBaseUrl();
    res.status(201).json({ ...food.toObject(), image: `${baseUrl}/images/${food.image}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const updateFood = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const food = await FoodItem.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    if (name)     food.name     = name;
    if (price)    food.price    = Number(price);
    if (category) food.category = category;

    if (req.file) {
      const oldPath = `public/images/${food.image}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      food.image = req.file.filename;
    }

    await food.save();
    const baseUrl = getBaseUrl();
    res.json({ ...food.toObject(), id: food._id, image: `${baseUrl}/images/${food.image}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteFood = async (req, res) => {
  try {
    const food = await FoodItem.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const filePath = `public/images/${food.image}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllUsers, deleteUser, addFood, updateFood, deleteFood };
