const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
  
  const User = require('../models/User');

  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName     = process.env.ADMIN_NAME || 'Admin';
  const adminPhone    = process.env.ADMIN_PHONE || '0000000000';
  const adminAddress  = process.env.ADMIN_ADDRESS || 'Admin HQ';

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed');
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name:     adminName,
        email:    adminEmail,
        password: hashedPassword,
        phone:    adminPhone,
        address:  adminAddress,
        role:     'admin',
      });
      await admin.save();
      console.log('Admin user seeded successfully');
    } else {
     
      admin.role     = 'admin';
      admin.password = hashedPassword;
      await admin.save();
      console.log('Admin user verified/updated');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    await seedAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
