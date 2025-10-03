import {
  INotificationService,
  EmailNotification,
  SMSNotification,
  InAppNotification,
} from './notificationService.interface';
import { db } from '../../db';
import { notifications } from '../../db/schema';

export class InAppNotificationService implements INotificationService {
  async sendEmail(notification: EmailNotification): Promise<void> {
    console.log('[NotificationService] Email would be sent:', notification);
  }

  async sendSMS(notification: SMSNotification): Promise<void> {
    console.log('[NotificationService] SMS would be sent:', notification);
  }

  async sendInApp(notification: InAppNotification): Promise<void> {
    await db.insert(notifications).values({
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      isRead: false,
    });
  }

  async sendNotification(notification: InAppNotification): Promise<void> {
    return this.sendInApp(notification);
  }

  async sendRealTime(userId: number, event: string, data: any): Promise<void> {
    console.log('[NotificationService] Real-time notification would be sent:', {
      userId,
      event,
      data,
    });
  }
}
