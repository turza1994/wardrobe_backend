export interface EmailNotification {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SMSNotification {
  to: string;
  message: string;
}

export interface InAppNotification {
  userId: number;
  type: 'order_confirmation' | 'rental_reminder' | 'negotiation' | 'system';
  message: string;
}

export interface INotificationService {
  sendEmail(notification: EmailNotification): Promise<void>;
  sendSMS(notification: SMSNotification): Promise<void>;
  sendInApp(notification: InAppNotification): Promise<void>;
  sendNotification(notification: InAppNotification): Promise<void>;
  sendRealTime(userId: number, event: string, data: any): Promise<void>;
}
