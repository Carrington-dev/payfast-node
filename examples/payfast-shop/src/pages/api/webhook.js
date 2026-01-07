const PayFast = require('../../lib/payfast');
const store = require('../../lib/store');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    console.log('PayFast webhook received:', req.body);

    const payfast = new PayFast({
      merchantId: process.env.PAYFAST_MERCHANT_ID,
      merchantKey: process.env.PAYFAST_MERCHANT_KEY,
      passphrase: process.env.PAYFAST_PASSPHRASE,
      sandbox: process.env.NODE_ENV !== 'production'
    });

    const verification = payfast.verifyPayment(req.body);

    if (!verification.valid) {
      console.error('Payment verification failed:', verification.error);
      return res.status(400).send('Invalid payment');
    }

    const orderId = verification.data.m_payment_id;
    store.updateOrder(orderId, {
      status: 'paid',
      paymentData: verification.data
    });

    console.log('Payment verified, order updated:', orderId);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
}
