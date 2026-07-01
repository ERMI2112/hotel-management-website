const PDFDocument = require('pdfkit');

// Generate PDF invoice for a booking
const generateInvoice = (booking, room) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF chunks
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('BOOKING INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.text(`Booking ID: ${booking._id}`, { align: 'right' });
      doc.moveDown(2);

      // Guest Information
      doc.fontSize(14).text('Guest Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Name: ${booking.guestName}`);
      doc.text(`Phone: ${booking.guestPhone}`);
      doc.moveDown(2);

      // Booking Details
      doc.fontSize(14).text('Booking Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Room Number: ${room.roomNumber}`);
      doc.text(`Room Type: ${room.type.charAt(0).toUpperCase() + room.type.slice(1)}`);
      doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
      doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
      
      const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
      doc.text(`Number of Nights: ${nights}`);
      doc.text(`Price per Night: ${room.pricePerNight} ETB`);
      doc.moveDown(2);

      // Total
      doc.fontSize(14).text('Payment Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Amount: ${booking.totalPrice} ETB`, { bold: true });
      doc.text(`Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`);
      doc.moveDown(3);

      // Footer
      doc.fontSize(8).text('Thank you for choosing our hotel!', { align: 'center', color: 'gray' });
      doc.text('For inquiries, please contact our front desk.', { align: 'center', color: 'gray' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoice };
