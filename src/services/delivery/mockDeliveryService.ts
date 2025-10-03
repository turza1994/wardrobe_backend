import {
  IDeliveryService,
  DeliveryRequest,
  DeliveryResponse,
  DeliveryStatus,
} from './deliveryService.interface';

export class MockDeliveryService implements IDeliveryService {
  async createDelivery(request: DeliveryRequest): Promise<DeliveryResponse> {
    console.log('[DeliveryService] Delivery would be created:', request);
    
    const trackingId = `TRK_${Date.now()}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    return {
      success: true,
      trackingId,
      estimatedDelivery,
    };
  }

  async requestDelivery(request: DeliveryRequest): Promise<DeliveryResponse> {
    return this.createDelivery(request);
  }

  async getDeliveryStatus(trackingId: string): Promise<DeliveryStatus> {
    console.log('[DeliveryService] Getting delivery status:', trackingId);
    
    return {
      trackingId,
      status: 'in_transit',
      currentLocation: 'Distribution Center',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  }

  async cancelDelivery(trackingId: string): Promise<boolean> {
    console.log('[DeliveryService] Delivery cancellation:', trackingId);
    return true;
  }
}
