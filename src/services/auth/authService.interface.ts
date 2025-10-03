export interface IAuthService {
  generateToken(payload: { userId: number; email: string; role: string }): string;
  verifyToken(token: string): { userId: number; email: string; role: string };
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}
