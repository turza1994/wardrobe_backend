import { IPaymentService } from './paymentService.interface';
import { MockPaymentService } from './mockPaymentService';

export const paymentService: IPaymentService = new MockPaymentService();

export { IPaymentService };
