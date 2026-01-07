const store = require('../../../lib/store');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const products = store.getProducts();
    res.status(200).json(products);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}