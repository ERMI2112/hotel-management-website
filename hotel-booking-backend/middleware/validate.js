const { body, query, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for login
const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Validation rules for creating a room
const validateRoom = [
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('type').isIn(['single', 'double', 'suite']).withMessage('Invalid room type'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Valid price is required'),
  handleValidationErrors
];

// Validation rules for updating a room
const validateRoomUpdate = [
  body('pricePerNight').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('status').optional().isIn(['available', 'occupied', 'maintenance']).withMessage('Invalid status'),
  handleValidationErrors
];

// Validation rules for creating a booking
const validateBooking = [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('guestName').notEmpty().withMessage('Guest name is required'),
  body('guestPhone').notEmpty().withMessage('Guest phone is required'),
  body('checkIn')
    .isISO8601()
    .withMessage('Check-in date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)')
    .custom((value) => {
      // Ensure date is valid
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid check-in date');
      }
      return true;
    }),
  body('checkOut')
    .isISO8601()
    .withMessage('Check-out date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)')
    .custom((value) => {
      // Ensure date is valid
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid check-out date');
      }
      return true;
    }),
  body('checkOut').custom((checkOut, { req }) => {
    if (new Date(checkOut) <= new Date(req.body.checkIn)) {
      throw new Error('Check-out date must be after check-in date');
    }
    return true;
  }),
  handleValidationErrors
];

// Validation rules for booking query
const validateBookingQuery = [
  query('from').optional().isISO8601().withMessage('Valid from date is required'),
  query('to').optional().isISO8601().withMessage('Valid to date is required'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRoom,
  validateRoomUpdate,
  validateBooking,
  validateBookingQuery
};
