export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  sandbox?: boolean;
}

export interface PaymentData {
  amount: number;
  itemName: string;
  // ... other fields
}

export class PayFast {
  constructor(config: PayFastConfig);
  createPayment(data: PaymentData): any;
  generateSignature(data: any): string;
  verifyPayment(postData: any): any;
}

export default PayFast;