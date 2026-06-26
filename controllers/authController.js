const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let finalRole = role || 'user';
    if (email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()) {
      finalRole = 'admin';
    } else if (finalRole === 'admin') {
      finalRole = 'user';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: finalRole,
      shopName: finalRole === 'shopowner' ? `${name}'s Shop` : '',
      city:     finalRole === 'shopowner' ? 'Chennai'  : '',
      pincode:  finalRole === 'shopowner' ? '600001'   : '',
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        phone:    user.phone,
        address:  user.address,
        role:     user.role,
        shopName: user.shopName,
        city:     user.city,
        pincode:  user.pincode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
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
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        phone:    user.phone,
        address:  user.address,
        role:     user.role,
        shopName: user.shopName || '',
        city:     user.city     || '',
        pincode:  user.pincode  || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };
