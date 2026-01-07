const PayFast = require('../../../lib/payfast');
const store = require('../../../lib/store');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cart, customer } = req.body;

    if (!cart || !cart.length || !customer) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Calculate total
    const items = cart.map(item => {
      const product = store.getProduct(item.id);
      return {
        ...product,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Create order
    const order = store.createOrder({
      items,
      customer,
      total,
      currency: 'ZAR'
    });

    // Initialize PayFast
    const payfast = new PayFast({
      merchantId: process.env.PAYFAST_MERCHANT_ID,
      merchantKey: process.env.PAYFAST_MERCHANT_KEY,
      passphrase: process.env.PAYFAST_PASSPHRASE,
      sandbox: process.env.NODE_ENV !== 'production'
    });

    // Create payment
    const itemNames = items.map(i => `${i.name} x${i.quantity}`).join(', ');
    const payment = payfast.createPayment({
      amount: total,
      itemName: itemNames,
      itemDescription: `Order ${order.id}`,
      nameFirst: customer.firstName,
      nameLast: customer.lastName,
      email: customer.email,
      paymentId: order.id,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?orderId=${order.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel?orderId=${order.id}`,
      notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`
    });

    res.status(200).json({ success: true, orderId: order.id, payment });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
}