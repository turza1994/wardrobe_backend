import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { IStorageService, UploadedFile, FileUpload } from './storageService.interface';

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(baseDir: string = env.UPLOAD_DIR) {
    this.baseDir = baseDir;
    this.ensureBaseDir();
  }

  private async ensureBaseDir() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  private async ensureDir(dirPath: string) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  }

  async uploadFile(file: FileUpload, folder: string = ''): Promise<UploadedFile> {
    const targetDir = path.join(this.baseDir, folder);
    await this.ensureDir(targetDir);

    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return {
      originalName: file.originalname,
      fileName,
      path: path.join(folder, fileName),
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadFiles(files: FileUpload[], folder: string = ''): Promise<UploadedFile[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  getFileUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    return this.getFileUrl(filePath);
  }
}
