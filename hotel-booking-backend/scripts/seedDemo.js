require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Room = require('../models/Room');

const demoRooms = [
  { roomNumber: '101', type: 'single', pricePerNight: 1200, status: 'available' },
  { roomNumber: '102', type: 'single', pricePerNight: 1200, status: 'available' },
  { roomNumber: '201', type: 'double', pricePerNight: 2200, status: 'available' },
  { roomNumber: '202', type: 'double', pricePerNight: 2200, status: 'maintenance' },
  { roomNumber: '301', type: 'suite', pricePerNight: 4500, status: 'available' },
];

const seedDemo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = [
      {
        name: 'Admin Owner',
        email: 'admin@hotel.com',
        phone: '+251900000000',
        password: 'Xk9$mTv2!qLpR7nZ',
        role: 'owner',
      },
      {
        name: 'Front Desk',
        email: 'staff@hotel.com',
        phone: '+251911111111',
        password: 'Jw4#bNc8@dYsF3hQ',
        role: 'staff',
      },
    ];

    for (const entry of users) {
      const existing = await User.findOne({ email: entry.email });
      if (existing) {
        console.log(`User already exists: ${entry.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(entry.password, 10);
      await User.create({
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        passwordHash,
        role: entry.role,
      });
      console.log(`Created user: ${entry.email} / ${entry.password}`);
    }

    for (const room of demoRooms) {
      const existing = await Room.findOne({ roomNumber: room.roomNumber });
      if (existing) {
        console.log(`Room already exists: ${room.roomNumber}`);
        continue;
      }

      await Room.create(room);
      console.log(`Created room: ${room.roomNumber}`);
    }

    console.log('Demo seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedDemo();
