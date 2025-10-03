import { IDeliveryService } from './deliveryService.interface';
import { MockDeliveryService } from './mockDeliveryService';

export const deliveryService: IDeliveryService = new MockDeliveryService();

export { IDeliveryService };
