const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));


mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://root:root@cluster0.trfqu29.mongodb.net/foodorder')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'] },
  deliveryAddress: { type: String, required: true },
  phone: { type: String, required: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};


// Helper function to get base URL
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

const foodItemsData = [
  { id: 1, name: 'Biriyani', price: 250, image: 'biriyani.jpeg', category: 'rice' },
  { id: 2, name: 'Chicken Fried Rice', price: 180, image: 'chicken fried rice.jpeg', category: 'rice' },
  { id: 3, name: 'Egg Rice', price: 120, image: 'egg rice.jpeg', category: 'rice' },
  { id: 4, name: 'Dosa', price: 80, image: 'dosa.jpeg', category: 'south indian' },
  { id: 5, name: 'Idly', price: 60, image: 'idly.jpeg', category: 'south indian' },
  { id: 6, name: 'Chapati', price: 40, image: 'chappati.jpeg', category: 'bread' },
  { id: 7, name: 'Parota', price: 50, image: 'parota.jpeg', category: 'bread' },
  { id: 8, name: 'Beef Curry', price: 200, image: 'beef curry.jpeg', category: 'curry' },
  { id: 9, name: 'Mutton Curry', price: 280, image: 'mutton curry.jpeg', category: 'curry' },
  { id: 10, name: 'Leg Piece', price: 150, image: 'leg piece.jpeg', category: 'chicken' }
];


app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

   
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    });

    await user.save();

   
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

   
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/foods', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const foodItemsWithUrls = foodItemsData.map(item => ({
    ...item,
    image: `${baseUrl}/images/${item.image}`
  }));
  res.json(foodItemsWithUrls);
});


app.get('/api/foods/:id', (req, res) => {
  const food = foodItems.find(item => item.id === parseInt(req.params.id));
  if (!food) {
    return res.status(404).json({ message: 'Food item not found' });
  }
  res.json(food);
});


app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, phone } = req.body;

    const order = new Order({
      userId: req.user.userId,
      items,
      totalAmount,
      deliveryAddress,
      phone
    });

    await order.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order
app.put('/api/orders/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find the order and verify it belongs to the user
    const order = await Order.findOne({ _id: orderId, userId: req.user.userId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order can be cancelled (only pending and confirmed orders can be cancelled)
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered orders' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }
    
    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();
    
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});