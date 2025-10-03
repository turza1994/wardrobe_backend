import { INotificationService } from './notificationService.interface';
import { InAppNotificationService } from './inAppNotificationService';

export const notificationService: INotificationService = new InAppNotificationService();

export { INotificationService };
