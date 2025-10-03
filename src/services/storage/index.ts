import { IStorageService } from './storageService.interface';
import { LocalStorageService } from './localStorageService';

export const storageService: IStorageService = new LocalStorageService();

export { IStorageService };
