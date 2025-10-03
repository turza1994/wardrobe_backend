import { IAuthService } from './authService.interface';
import { JWTAuthService } from './jwtAuthService';

export const authService: IAuthService = new JWTAuthService();

export { IAuthService };
