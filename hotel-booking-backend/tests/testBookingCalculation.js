// Test booking price calculation logic
// Run with: node tests/testBookingCalculation.js

function calculateNights(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Normalize to UTC midnight
  const checkInUTC = Date.UTC(
    checkInDate.getFullYear(), 
    checkInDate.getMonth(), 
    checkInDate.getDate()
  );
  const checkOutUTC = Date.UTC(
    checkOutDate.getFullYear(), 
    checkOutDate.getMonth(), 
    checkOutDate.getDate()
  );
  
  const nights = Math.round((checkOutUTC - checkInUTC) / (1000 * 60 * 60 * 24));
  return nights;
}

function testCase(checkIn, checkOut, pricePerNight, description) {
  const nights = calculateNights(checkIn, checkOut);
  const total = nights * pricePerNight;
  
  console.log(`\n${description}`);
  console.log('─'.repeat(50));
  console.log(`Check-in:  ${checkIn}`);
  console.log(`Check-out: ${checkOut}`);
  console.log(`Nights:    ${nights}`);
  console.log(`Price/night: ${pricePerNight} ETB`);
  console.log(`Total:     ${total} ETB`);
  console.log(`Formula:   ${nights} × ${pricePerNight} = ${total}`);
}

console.log('='.repeat(50));
console.log('BOOKING PRICE CALCULATION TESTS');
console.log('='.repeat(50));

// Test 1: Simple 2-night booking
testCase('2026-07-01', '2026-07-03', 1200, 'Test 1: Simple 2-night stay');

// Test 2: Your reported issue (if dates are MM/DD)
testCase('2026-07-01', '2026-10-02', 1200, 'Test 2: July 1 to Oct 2 (93 nights)');

// Test 3: Same dates but DD/MM interpretation (Jan 7 to Feb 10)
testCase('2026-01-07', '2026-02-10', 1200, 'Test 3: Jan 7 to Feb 10 (34 nights)');

// Test 4: Single night
testCase('2026-07-01', '2026-07-02', 1200, 'Test 4: Single night');

// Test 5: One week
testCase('2026-07-01', '2026-07-08', 1200, 'Test 5: One week (7 nights)');

// Test 6: Today + 2 nights (using actual dates)
const today = new Date();
const in2Days = new Date(today);
in2Days.setDate(today.getDate() + 2);

const todayStr = today.toISOString().split('T')[0];
const in2DaysStr = in2Days.toISOString().split('T')[0];
testCase(todayStr, in2DaysStr, 1200, 'Test 6: Today + 2 nights');

// Test 7: Verify your exact scenario
console.log('\n' + '='.repeat(50));
console.log('YOUR REPORTED ISSUE ANALYSIS:');
console.log('='.repeat(50));
console.log('Booking: 7/1/2026 to 10/2/2026');
console.log('Total: 111,600 ETB');
console.log('Implied nights: 111,600 ÷ 1,200 = 93 nights');
console.log('\nPossible interpretations:');
testCase('2026-07-01', '2026-10-02', 1200, 'MM/DD format: July 1 to Oct 2');
testCase('2026-01-07', '2026-02-10', 1200, 'DD/MM format: Jan 7 to Feb 10');

console.log('\n' + '='.repeat(50));
console.log('RECOMMENDATION:');
console.log('='.repeat(50));
console.log('✓ Always use ISO format: YYYY-MM-DD');
console.log('✓ Frontend date picker should send: 2026-07-01');
console.log('✓ Backend validates ISO format');
console.log('✓ No ambiguity between MM/DD and DD/MM');
console.log('='.repeat(50));
