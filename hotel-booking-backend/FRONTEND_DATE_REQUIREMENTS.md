# Frontend Date Handling Requirements

## ⚠️ CRITICAL: Date Format Specification

The backend **strictly requires ISO 8601 format** for all date fields to avoid MM/DD vs DD/MM ambiguity.

### Required Format

**Always send dates as:** `YYYY-MM-DD` or full ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Examples

✅ **CORRECT:**
```json
{
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-03"
}
```

✅ **ALSO CORRECT (full ISO):**
```json
{
  "checkIn": "2026-07-01T00:00:00.000Z",
  "checkOut": "2026-07-03T00:00:00.000Z"
}
```

❌ **WRONG (ambiguous):**
```json
{
  "checkIn": "7/1/2026",    // Is this July 1 or Jan 7?
  "checkOut": "10/2/2026"   // Is this Oct 2 or Feb 10?
}
```

---

## Frontend Implementation (For Antigravity)

### Date Picker Configuration

When using any date picker library (e.g., react-datepicker, shadcn/ui calendar), ensure:

1. **Store dates as ISO strings:**
   ```javascript
   const [checkIn, setCheckIn] = useState('2026-07-01');
   ```

2. **Convert Date objects to ISO format before sending:**
   ```javascript
   const dateToISO = (date) => {
     if (date instanceof Date) {
       return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
     }
     return date;
   };
   ```

3. **Example API call:**
   ```javascript
   const response = await axios.post('/api/bookings', {
     roomId: selectedRoom.id,
     guestName: 'John Doe',
     guestPhone: '+251911223344',
     checkIn: dateToISO(checkInDate),  // '2026-07-01'
     checkOut: dateToISO(checkOutDate) // '2026-07-03'
   });
   ```

---

## Validation Response

If dates are sent in wrong format, backend returns:

```json
{
  "errors": [
    {
      "msg": "Check-in date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
      "param": "checkIn"
    }
  ]
}
```

---

## Calculation Logic (For Reference)

Backend calculates nights as:

```javascript
const checkInUTC = Date.UTC(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
const checkOutUTC = Date.UTC(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
const nights = Math.round((checkOutUTC - checkInUTC) / (1000 * 60 * 60 * 24));
const totalPrice = nights × room.pricePerNight;
```

**Example:**
- Check-in: `2026-07-01`
- Check-out: `2026-07-03`
- Nights: 2
- Price per night: 1200 ETB
- **Total: 2,400 ETB** (2 × 1,200)

---

## Testing Checklist

Before deploying, test these cases in the frontend:

- [ ] Today → tomorrow (1 night) calculates correctly
- [ ] July 1 → July 3 (2 nights) shows 2 × pricePerNight
- [ ] Cross-month booking (e.g., Jan 30 → Feb 2) calculates 3 nights
- [ ] Date format sent to API is always YYYY-MM-DD
- [ ] Backend validation error displays if wrong format sent
- [ ] Calendar UI shows dates unambiguously (e.g., "July 1, 2026" not "7/1/26")

---

## UI Display Format

While sending **YYYY-MM-DD** to the API, display dates to users in a clear, localized format:

```javascript
const formatDisplayDate = (isoDate) => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// "2026-07-01" → displays as "July 1, 2026"
```

This avoids confusion between MM/DD and DD/MM for users in different regions.

---

## Summary

✅ **Send to API:** `YYYY-MM-DD` format always  
✅ **Display to users:** Localized long format ("July 1, 2026")  
✅ **Store in state:** ISO string or Date object  
✅ **Convert before API call:** `.toISOString().split('T')[0]`  
✅ **Backend logs calculation:** Check console for debug info  

This eliminates all date ambiguity issues.
