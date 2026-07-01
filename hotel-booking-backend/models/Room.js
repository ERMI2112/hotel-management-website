const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['single', 'double', 'suite'],
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

roomSchema.methods.toJSON = function() {
  const room = this.toObject();
  delete room.__v;
  return room;
};

module.exports = mongoose.model('Room', roomSchema);
