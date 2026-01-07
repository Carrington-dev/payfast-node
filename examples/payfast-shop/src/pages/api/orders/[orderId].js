const store = require('../../../../lib/store');

export default function handler(req, res) {
  const { orderId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const order = store.getOrder(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.status(200).json(order);
}