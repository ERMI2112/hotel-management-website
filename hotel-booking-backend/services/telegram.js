const TelegramBot = require('node-telegram-bot-api');

let bot = null;

// Initialize Telegram bot
const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - notifications disabled');
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: false });
    console.log('✅ Telegram bot initialized');
    return bot;
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    return null;
  }
};

// Send booking notification to owner
const notifyNewBooking = async (booking, room) => {
  if (!bot || !process.env.OWNER_CHAT_ID) {
    console.warn('⚠️  Telegram notification skipped - bot not configured');
    return;
  }

  try {
    const checkInDate = new Date(booking.checkIn).toLocaleDateString();
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
    
    const message = `
🛎️ *New Booking*

*Room:* ${room.roomNumber} (${room.type})
*Guest:* ${booking.guestName}
*Phone:* ${booking.guestPhone}
*Dates:* ${checkInDate} → ${checkOutDate}
*Total:* ${booking.totalPrice} ETB

_Booking ID: ${booking._id}_
    `.trim();

    await bot.sendMessage(process.env.OWNER_CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram notification sent');
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error.message);
  }
};

// Send payment receipt notification to owner
const notifyPaymentReceived = async (booking, room) => {
  if (!bot || !process.env.OWNER_CHAT_ID) {
    console.warn('⚠️  Telegram notification skipped - bot not configured');
    return;
  }

  try {
    const message = `
💳 *Payment Received* ✅

*Room:* ${room.roomNumber} (${room.type})
*Guest:* ${booking.guestName}
*Phone:* ${booking.guestPhone}
*Amount Paid:* ${booking.totalPrice} ETB
*Transaction Ref:* \`${booking.chapaReference || 'N/A'}\`

_Booking ID: ${booking._id}_
    `.trim();

    await bot.sendMessage(process.env.OWNER_CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram payment notification sent');
  } catch (error) {
    console.error('❌ Failed to send Telegram payment notification:', error.message);
  }
};

module.exports = { initTelegramBot, notifyNewBooking, notifyPaymentReceived };
