const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://backend-8j7e.onrender.com',
    /\.vercel\.app$/   // allows any vercel.app subdomain
  ],
  credentials: true
}));
app.use(express.json());
app.use('/images', express.static('public/images'));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/images';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// FoodItem model for admin-uploaded foods
const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true }
}, { timestamps: true });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);


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
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Contact Info model — stored in DB so admin can edit from UI
const contactInfoSchema = new mongoose.Schema({
  email: { type: String, default: 'info@foodorder.com' },
  phone: { type: String, default: '+91 98765 43210' },
  address: { type: String, default: '123 Food Street, Chennai, Tamil Nadu' }
});
const ContactInfo = mongoose.model('ContactInfo', contactInfoSchema);

// GET contact info (public)
app.get('/api/contact-info', async (req, res) => {
  try {
    let info = await ContactInfo.findOne();
    if (!info) {
      info = await ContactInfo.create({});
    }
    res.json(info);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT contact info — admin only
app.put('/api/contact-info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, phone, address } = req.body;
    let info = await ContactInfo.findOne();
    if (!info) info = new ContactInfo({});
    if (email) info.email = email;
    if (phone) info.phone = phone;
    if (address) info.address = address;
    await info.save();
    res.json({ message: 'Contact info updated', info });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST contact form — simple (no email sending, just success response)
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // You can add email sending here later if needed
  res.json({ message: 'Message received! We will get back to you soon.' });
});


// Helper function to get base URL
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};




app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, address, role: role || 'user' });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/foods', async (req, res) => {
  const baseUrl = getBaseUrl(req);
  try {
    const dbFoods = await FoodItem.find();
    const dbFoodsFormatted = dbFoods.map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: `${baseUrl}/images/${item.image}`
    }));
    res.json(dbFoodsFormatted);
  } catch {
    res.json([]);
  }
});

// Admin: Add food item with image upload
app.post('/api/admin/foods', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    const food = new FoodItem({ name, price: Number(price), category, image: req.file.filename });
    await food.save();
    const baseUrl = getBaseUrl(req);
    res.status(201).json({ ...food.toObject(), image: `${baseUrl}/images/${food.image}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete food item
app.delete('/api/admin/foods/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const food = await FoodItem.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    const filePath = `public/images/${food.image}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete a user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user address
app.put('/api/profile/address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || address.trim().length < 10) {
      return res.status(400).json({ message: 'Please enter a valid address (min 10 chars)' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { address },
      { new: true }
    ).select('-password');
    res.json({ message: 'Address updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile (name, email, phone)
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    // Check email not taken by another user
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
    }
    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { ...(name && { name }), ...(email && { email }), ...(phone && { phone }), ...(address && { address }) },
      { new: true }
    ).select('-password');
    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
