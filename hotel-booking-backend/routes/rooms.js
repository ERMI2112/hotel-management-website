const express = require('express');
const Room = require('../models/Room');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRoom, validateRoomUpdate } = require('../middleware/validate');

const router = express.Router();

// GET /api/rooms/public - Available rooms for guest booking (no auth)
router.get('/public', async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'available' }).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error('Fetch public rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /api/rooms - List all rooms (auth: owner/staff)
router.get('/', authenticate, authorize('owner', 'staff'), async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error('Fetch rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/rooms - Create room (auth: owner)
router.post('/', authenticate, authorize('owner'), validateRoom, async (req, res) => {
  try {
    const { roomNumber, type, pricePerNight } = req.body;

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room number already exists' });
    }

    const room = new Room({
      roomNumber,
      type,
      pricePerNight
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PATCH /api/rooms/:id - Update room (auth: owner)
router.patch('/:id', authenticate, authorize('owner'), validateRoomUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePerNight, status } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Update only provided fields
    if (pricePerNight !== undefined) {
      room.pricePerNight = pricePerNight;
    }
    if (status !== undefined) {
      room.status = status;
    }

    await room.save();
    res.json(room);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

module.exports = router;
