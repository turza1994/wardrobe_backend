export interface DeliveryRequest {
  orderId: number;
  fromAddress: string;
  toAddress: string;
  contactPhone: string;
  isReturn?: boolean;
  itemDescription?: string;
}

export interface DeliveryResponse {
  success: boolean;
  trackingId?: string;
  estimatedDelivery?: Date;
  error?: string;
}

export interface DeliveryStatus {
  trackingId: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  currentLocation?: string;
  estimatedDelivery?: Date;
}

export interface IDeliveryService {
  createDelivery(request: DeliveryRequest): Promise<DeliveryResponse>;
  requestDelivery(request: DeliveryRequest): Promise<DeliveryResponse>;
  getDeliveryStatus(trackingId: string): Promise<DeliveryStatus>;
  cancelDelivery(trackingId: string): Promise<boolean>;
}
