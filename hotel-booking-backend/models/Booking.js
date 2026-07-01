const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  guestName: {
    type: String,
    required: true,
    trim: true
  },
  guestPhone: {
    type: String,
    required: true,
    trim: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'checked_out'],
    default: 'confirmed'
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookingSchema.methods.toJSON = function() {
  const booking = this.toObject();
  delete booking.__v;
  return booking;
};

module.exports = mongoose.model('Booking', bookingSchema);
