# PayFast Node.js

Official PayFast payment gateway integration for Node.js, Next.js, and React.

## Installation

npm install payfast-node

## Quick Start
```js
// const PayFast = require('payfast-node');
const PayFast = require('payfast');

const payfast = new PayFast({
  merchantId: 'YOUR_MERCHANT_ID',
  merchantKey: 'YOUR_MERCHANT_KEY',
  passphrase: 'YOUR_PASSPHRASE',
  sandbox: true
});
```

## Documentation

- [Getting Started](docs/GETTING_STARTED.md)
- [API Reference](docs/API_REFERENCE.md)
- [Webhooks](docs/WEBHOOKS.md)
- [Examples](examples/)

## Features

- ✅ One-time payments
- ✅ Recurring subscriptions
- ✅ Webhook verification
- ✅ Signature generation
- ✅ Express.js support
- ✅ Next.js support
- ✅ React support
- ✅ TypeScript definitions

## License

MIT