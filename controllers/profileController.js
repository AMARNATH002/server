const User = require('../models/User');


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      {
        ...(name    && { name }),
        ...(email   && { email }),
        ...(phone   && { phone }),
        ...(address && { address }),
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const updateAddress = async (req, res) => {
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
};

module.exports = { getProfile, updateProfile, updateAddress };
