const axios = require('axios');
const crypto = require('crypto');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

/**
 * Initialize a Chapa payment transaction
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.amount - Amount to charge
 * @param {string} paymentData.email - Customer email
 * @param {string} paymentData.firstName - Customer first name
 * @param {string} paymentData.lastName - Customer last name
 * @param {string} paymentData.phoneNumber - Customer phone number
 * @param {string} paymentData.txRef - Unique transaction reference
 * @param {string} paymentData.callbackUrl - Webhook callback URL
 * @param {string} paymentData.returnUrl - Frontend redirect URL after payment
 * @param {Object} paymentData.customization - UI customization
 * @returns {Promise<Object>} Chapa API response with checkout_url
 */
const initializePayment = async (paymentData) => {
  try {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('CHAPA_SECRET_KEY is not configured');
    }

    const payload = {
      amount: paymentData.amount.toString(),
      currency: 'ETB',
      email: paymentData.email,
      first_name: paymentData.firstName,
      last_name: paymentData.lastName,
      tx_ref: paymentData.txRef,
      callback_url: paymentData.callbackUrl,
      return_url: paymentData.returnUrl,
      customization: paymentData.customization || {
        title: 'Hotel Booking Payment',
        description: 'Payment for hotel room booking'
      }
    };

    // Only include phone_number if explicitly provided (avoid sending undefined/null)
    if (paymentData.phoneNumber) {
      payload.phone_number = paymentData.phoneNumber;
    }

    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Chapa initialization error:', error.response?.data || error.message);
    throw new Error(formatChapaError(error, 'Failed to initialize payment'));
  }
};

const formatChapaError = (error, defaultMsg) => {
  const data = error.response?.data;
  if (!data) return error.message || defaultMsg;
  
  if (typeof data.message === 'string') {
    return data.message;
  }
  
  if (typeof data.message === 'object' && data.message !== null) {
    // Flatten the validation errors into a single readable string
    return Object.entries(data.message)
      .map(([key, val]) => {
        const valueStr = Array.isArray(val) ? val.join(', ') : String(val);
        return `${key}: ${valueStr}`;
      })
      .join('; ');
  }
  
  return data.message || defaultMsg;
};

/**
 * Verify a Chapa payment transaction
 * @param {string} txRef - Transaction reference to verify
 * @returns {Promise<Object>} Transaction details
 */
const verifyPayment = async (txRef) => {
  try {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('CHAPA_SECRET_KEY is not configured');
    }

    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Chapa verification error:', error.response?.data || error.message);
    throw new Error(formatChapaError(error, 'Failed to verify payment'));
  }
};

/**
 * Verify webhook signature from Chapa
 * @param {Buffer|string} rawBody - Raw webhook body as received from Chapa
 * @param {string} signature - Signature from x-chapa-signature header
 * @param {string} legacySignature - Signature from chapa-signature header (fallback)
 * @returns {boolean} Whether signature is valid
 */
const verifyWebhookSignature = (rawBody, signature, legacySignature) => {
  try {
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ CHAPA_WEBHOOK_SECRET not configured - rejecting webhook');
      return false;
    }

    // Calculate expected hash
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody ?? ''), 'utf8');
    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyBuffer)
      .digest('hex');

    // Check if either signature matches
    const isValid = Boolean((signature && hash === signature) || (legacySignature && hash === legacySignature));

    if (!isValid) {
      console.error('❌ Webhook signature verification failed');
      console.error('Expected hash:', hash);
      console.error('Received x-chapa-signature:', signature);
      console.error('Received chapa-signature:', legacySignature);
    }

    return isValid;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature
};
