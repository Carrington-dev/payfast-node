// ============================================
// FILE: pages/success.jsx
// ============================================
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function Success() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // Clear cart
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h2 className="font-semibold text-gray-900 mb-2">Order Details</h2>
              <p className="text-sm text-gray-600">Order ID: <span className="font-mono">{order.id}</span></p>
              <p className="text-sm text-gray-600">Status: <span className="font-semibold text-green-600">{order.status}</span></p>
              <p className="text-sm text-gray-600">Total: <span className="font-bold text-blue-600">R {order.total.toFixed(2)}</span></p>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
