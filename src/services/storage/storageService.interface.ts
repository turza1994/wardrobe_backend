export interface UploadedFile {
  originalName: string;
  fileName: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface FileUpload {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

export interface IStorageService {
  uploadFile(file: FileUpload, folder?: string): Promise<UploadedFile>;
  uploadFiles(files: FileUpload[], folder?: string): Promise<UploadedFile[]>;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): string;
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
}
