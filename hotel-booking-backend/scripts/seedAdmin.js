require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@hotel.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@hotel.com',
      phone: '+251900000000',
      passwordHash,
      role: 'owner'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@hotel.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedAdmin();
