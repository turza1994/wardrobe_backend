import {
  IPaymentService,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
} from './paymentService.interface';

export class MockPaymentService implements IPaymentService {
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('[PaymentService] Payment would be created:', request);
    
    return {
      success: true,
      transactionId: `TXN_${Date.now()}`,
      paymentUrl: `https://payment.example.com/pay/${request.orderId}`,
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log('[PaymentService] Payment verification:', transactionId);
    return true;
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    console.log('[PaymentService] Refund would be processed:', request);
    
    return {
      success: true,
      refundId: `REF_${Date.now()}`,
    };
  }
}
