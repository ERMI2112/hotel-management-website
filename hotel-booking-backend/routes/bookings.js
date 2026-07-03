const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBooking, validateBookingQuery } = require('../middleware/validate');
const { notifyNewBooking } = require('../services/telegram');
const { generateInvoice } = require('../services/invoice');

const router = express.Router();

// GET /api/bookings - List bookings with optional date filter (auth: owner/staff)
router.get('/', authenticate, authorize('owner', 'staff'), validateBookingQuery, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    let query = {};
    
    // Apply date filters if provided
    if (from || to) {
      query.checkIn = {};
      if (from) query.checkIn.$gte = new Date(from);
      if (to) query.checkIn.$lte = new Date(to);
    }

    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings - Create booking (public - triggers Telegram alert)
router.post('/', validateBooking, async (req, res) => {
  try {
    const { roomId, guestName, guestPhone, checkIn, checkOut } = req.body;

    // Find the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is available
    if (room.status !== 'available') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    // Parse dates - expecting ISO format YYYY-MM-DD or ISO 8601 string
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Validate dates were parsed correctly
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD format.' });
    }
    
    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      room: roomId,
      status: 'confirmed',
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ error: 'Room is already booked for these dates' });
    }

    // Calculate total price - use Math.round to avoid floating point issues
    // Normalize to UTC midnight to avoid timezone issues
    const checkInUTC = Date.UTC(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const checkOutUTC = Date.UTC(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    const nights = Math.round((checkOutUTC - checkInUTC) / (1000 * 60 * 60 * 24));
    
    // Validation: must be at least 1 night
    if (nights < 1) {
      return res.status(400).json({ error: 'Booking must be at least 1 night' });
    }
    
    const totalPrice = nights * room.pricePerNight;

    // Debug logging for price calculation
    console.log('=== BOOKING CALCULATION DEBUG ===');
    console.log('Input checkIn:', checkIn);
    console.log('Input checkOut:', checkOut);
    console.log('Parsed checkInDate:', checkInDate.toISOString());
    console.log('Parsed checkOutDate:', checkOutDate.toISOString());
    console.log('Nights calculated:', nights);
    console.log('Price per night:', room.pricePerNight);
    console.log('Total price:', totalPrice);
    console.log('Formula: ', `${nights} nights × ${room.pricePerNight} ETB = ${totalPrice} ETB`);
    console.log('================================');

    // Create booking
    const booking = new Booking({
      room: roomId,
      guestName,
      guestPhone,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice
    });

    await booking.save();

    // Populate room info for response
    await booking.populate('room', 'roomNumber type');

    // Send Telegram notification
    notifyNewBooking(booking, room);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PATCH /api/bookings/:id/cancel - Cancel booking (auth: owner/staff)
router.patch('/:id/cancel', authenticate, authorize('owner', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // If guest was checked in, release the room
    if (booking.status === 'checked_in') {
      await Room.findByIdAndUpdate(booking.room, { status: 'available' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// PATCH /api/bookings/:id/check-in - Check in guest (auth: owner/staff)
router.patch('/:id/check-in', authenticate, authorize('owner', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot check in from '${booking.status}' status` });
    }

    booking.status = 'checked_in';
    await booking.save();

    // Update room status to occupied
    await Room.findByIdAndUpdate(booking.room, { status: 'occupied' });

    res.json(booking);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
});

// PATCH /api/bookings/:id/check-out - Check out guest (auth: owner/staff)
router.patch('/:id/check-out', authenticate, authorize('owner', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'checked_in') {
      return res.status(400).json({ error: `Cannot check out from '${booking.status}' status` });
    }

    booking.status = 'checked_out';
    await booking.save();

    // Update room status back to available
    await Room.findByIdAndUpdate(booking.room, { status: 'available' });

    res.json(booking);
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Failed to process check-out' });
  }
});

// GET /api/bookings/:id/invoice - Get PDF invoice (auth: owner/staff)
router.get('/:id/invoice', authenticate, authorize('owner', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate('room');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const pdfBuffer = await generateInvoice(booking, booking.room);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// GET /api/bookings/public/:id - Get booking details (Public for guests)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('room', 'roomNumber type pricePerNight');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Fetch public booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// GET /api/bookings/public/room/:roomId/booked-dates - Get booked dates (Public for date blocking)
router.get('/public/room/:roomId/booked-dates', async (req, res) => {
  try {
    const { roomId } = req.params;
    const bookings = await Booking.find({
      room: roomId,
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' }
    }).select('checkIn checkOut');

    const dates = bookings.map(b => ({
      checkIn: b.checkIn,
      checkOut: b.checkOut
    }));

    res.json(dates);
  } catch (error) {
    console.error('Fetch room booked dates error:', error);
    res.status(500).json({ error: 'Failed to fetch booked dates' });
  }
});

module.exports = router;
