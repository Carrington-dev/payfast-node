// payfast.js - PayFast Integration Library for Node.js/Next.js/React
const crypto = require('crypto');

class PayFast {
  constructor(config) {
    this.merchantId = config.merchantId;
    this.merchantKey = config.merchantKey;
    this.passphrase = config.passphrase || '';
    this.sandbox = config.sandbox !== false; // Default to sandbox
    this.baseUrl = this.sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  }

  /**
   * Generate payment data object
   */
  createPayment(paymentData) {
    const data = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: paymentData.returnUrl,
      cancel_url: paymentData.cancelUrl,
      notify_url: paymentData.notifyUrl,
      name_first: paymentData.nameFirst,
      name_last: paymentData.nameLast,
      email_address: paymentData.email,
      m_payment_id: paymentData.paymentId,
      amount: paymentData.amount.toFixed(2),
      item_name: paymentData.itemName,
      item_description: paymentData.itemDescription || '',
      custom_str1: paymentData.custom1 || '',
      custom_str2: paymentData.custom2 || '',
      custom_str3: paymentData.custom3 || '',
      custom_str4: paymentData.custom4 || '',
      custom_str5: paymentData.custom5 || '',
      custom_int1: paymentData.customInt1 || '',
      custom_int2: paymentData.customInt2 || '',
      custom_int3: paymentData.customInt3 || '',
      custom_int4: paymentData.customInt4 || '',
      custom_int5: paymentData.customInt5 || '',
      email_confirmation: paymentData.emailConfirmation || 1,
      confirmation_address: paymentData.confirmationAddress || paymentData.email
    };

    // Add subscription fields if provided
    if (paymentData.subscription) {
      data.subscription_type = paymentData.subscription.type; // 1 = monthly, 2 = quarterly, etc.
      data.billing_date = paymentData.subscription.billingDate;
      data.recurring_amount = paymentData.subscription.recurringAmount?.toFixed(2);
      data.frequency = paymentData.subscription.frequency;
      data.cycles = paymentData.subscription.cycles || 0;
    }

    // Generate signature
    data.signature = this.generateSignature(data);

    return {
      url: this.baseUrl,
      data: data
    };
  }

  /**
   * Generate MD5 signature for PayFast
   */
  generateSignature(data) {
    // Create parameter string
    let paramString = '';
    const sortedData = {};
    
    // Sort keys alphabetically
    Object.keys(data).sort().forEach(key => {
      if (key !== 'signature' && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        sortedData[key] = data[key];
      }
    });

    // Build parameter string
    for (const key in sortedData) {
      paramString += `${key}=${encodeURIComponent(sortedData[key].toString().trim()).replace(/%20/g, '+')}&`;
    }

    // Remove last ampersand
    paramString = paramString.slice(0, -1);

    // Add passphrase if set
    if (this.passphrase) {
      paramString += `&passphrase=${encodeURIComponent(this.passphrase.trim()).replace(/%20/g, '+')}`;
    }

    // Generate MD5 hash
    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  /**
   * Verify PayFast payment notification (ITN)
   */
  verifyPayment(postData, headers = {}) {
    // Check if signature is valid
    const signature = postData.signature;
    delete postData.signature;
    
    const generatedSignature = this.generateSignature(postData);
    
    if (signature !== generatedSignature) {
      return {
        valid: false,
        error: 'Invalid signature'
      };
    }

    // Verify payment status
    const validStatuses = ['COMPLETE'];
    if (!validStatuses.includes(postData.payment_status)) {
      return {
        valid: false,
        error: `Invalid payment status: ${postData.payment_status}`,
        status: postData.payment_status
      };
    }

    return {
      valid: true,
      data: postData
    };
  }

  /**
   * Validate IP address (for webhook security)
   */
  isValidPayFastIP(ipAddress) {
    const validHosts = [
      'www.payfast.co.za',
      'sandbox.payfast.co.za',
      'w1w.payfast.co.za',
      'w2w.payfast.co.za'
    ];

    // For production, you should DNS lookup these hosts
    // For now, accept PayFast IP ranges
    const validIPs = [
      '197.97.145.144/28', // PayFast production
      '41.134.191.64/27'    // PayFast sandbox
    ];

    return true; // Implement proper IP validation in production
  }

  /**
   * Generate payment form HTML
   */
  generateFormHtml(paymentData) {
    const payment = this.createPayment(paymentData);
    
    let html = `<form action="${payment.url}" method="POST">\n`;
    
    for (const [key, value] of Object.entries(payment.data)) {
      html += `  <input type="hidden" name="${key}" value="${value}">\n`;
    }
    
    html += '  <button type="submit">Pay with PayFast</button>\n';
    html += '</form>';
    
    return html;
  }

  /**
   * Get payment URL with query parameters (for redirect)
   */
  getPaymentUrl(paymentData) {
    const payment = this.createPayment(paymentData);
    const params = new URLSearchParams(payment.data);
    return `${payment.url}?${params.toString()}`;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PayFast;
}

// Usage Examples:

/*
// 1. Initialize PayFast
const PayFast = require('./payfast');

const payfast = new PayFast({
  merchantId: process.env.PAYFAST_MERCHANT_ID,
  merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_PASSPHRASE, // Optional but recommended
  sandbox: process.env.NODE_ENV === 'development' // Set to false for production
});

// 2. Create a payment
const payment = payfast.createPayment({
  amount: 100.00,
  itemName: 'Test Product',
  itemDescription: 'A test product description',
  nameFirst: 'John',
  nameLast: 'Doe',
  email: 'john@example.com',
  paymentId: 'ORDER-12345',
  returnUrl: 'https://yoursite.com/payment/success',
  cancelUrl: 'https://yoursite.com/payment/cancel',
  notifyUrl: 'https://yoursite.com/api/payfast/webhook',
  custom1: 'custom data 1',
  custom2: 'custom data 2'
});

// 3. Use in Express/Next.js API route
app.post('/api/create-payment', (req, res) => {
  const payment = payfast.createPayment({
    amount: req.body.amount,
    itemName: req.body.itemName,
    nameFirst: req.body.firstName,
    nameLast: req.body.lastName,
    email: req.body.email,
    paymentId: generateUniqueId(),
    returnUrl: `${process.env.BASE_URL}/payment/success`,
    cancelUrl: `${process.env.BASE_URL}/payment/cancel`,
    notifyUrl: `${process.env.BASE_URL}/api/payfast/webhook`
  });
  
  res.json(payment);
});

// 4. Handle webhook (ITN - Instant Transaction Notification)
app.post('/api/payfast/webhook', (req, res) => {
  const verification = payfast.verifyPayment(req.body);
  
  if (verification.valid) {
    // Payment is valid, update your database
    console.log('Payment successful:', verification.data);
    
    // Update order status in database
    // await updateOrderStatus(verification.data.m_payment_id, 'paid');
    
    res.status(200).send('OK');
  } else {
    console.error('Payment verification failed:', verification.error);
    res.status(400).send('Invalid payment');
  }
});

// 5. For React/Next.js Frontend - Submit form
function CheckoutButton({ paymentData }) {
  const handleCheckout = async () => {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    const payment = await response.json();
    
    // Create and submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payment.url;
    
    Object.entries(payment.data).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  };
  
  return <button onClick={handleCheckout}>Pay Now</button>;
}

// 6. Subscription Example
const subscription = payfast.createPayment({
  amount: 99.00,
  itemName: 'Monthly Subscription',
  nameFirst: 'Jane',
  nameLast: 'Smith',
  email: 'jane@example.com',
  paymentId: 'SUB-12345',
  returnUrl: 'https://yoursite.com/subscription/success',
  cancelUrl: 'https://yoursite.com/subscription/cancel',
  notifyUrl: 'https://yoursite.com/api/payfast/webhook',
  subscription: {
    type: 1, // 1 = monthly
    billingDate: '2025-02-01',
    recurringAmount: 99.00,
    frequency: 3, // Monthly
    cycles: 0 // 0 = until cancelled
  }
});
*/