import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService {
  private readonly minioClient: Minio.Client;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || 'localcompliance';
    
    // Fallback to defaults when not specified
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    const port = parseInt(this.configService.get<string>('MINIO_PORT') || '9000', 10);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin';

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.initBucket();
  }

  /** Initialize bucket if it does not exist */
  private async initBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        // Define standard public policy so evidence files can be viewed
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Action: ['s3:GetObject'],
              Effect: 'Allow',
              Principal: '*',
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Created MinIO bucket: ${this.bucketName}`);
      }
    } catch (err) {
      this.logger.error(`Error initializing MinIO bucket: ${(err as Error).message}`);
    }
  }

  /**
   * Upload a buffer to MinIO
   * @param objectName path inside bucket (e.g., 'evidence/123/file.pdf')
   * @param buffer file buffer
   * @param mimetype file mimetype
   * @returns public url of the file
   */
  async uploadFile(objectName: string, buffer: Buffer, mimetype: string): Promise<string> {
    try {
      await this.minioClient.putObject(this.bucketName, objectName, buffer, undefined, {
        'Content-Type': mimetype,
      });
      
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
      const port = this.configService.get<string>('MINIO_PORT') || '9000';
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
      const protocol = useSSL ? 'https' : 'http';
      
      // Use MINIO_PUBLIC_HOST env var (e.g., server IP or domain), fallback to endpoint
      const publicHost = this.configService.get<string>('MINIO_PUBLIC_HOST') || endpoint;

      return `${protocol}://${publicHost}:${port}/${this.bucketName}/${objectName}`;
    } catch (err) {
      this.logger.error(`Failed to upload file to MinIO: ${(err as Error).message}`);
      throw new InternalServerErrorException('Gagal mengunggah file bukti ke server penyimpanan.');
    }
  }

  /** Gets an existing file presigned URL (if bucket is private) */
  async getFileUrl(objectName: string): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(this.bucketName, objectName, 24 * 60 * 60);
    } catch (err) {
      this.logger.error(`Failed to generate presigned URL for ${objectName}: ${(err as Error).message}`);
      throw new InternalServerErrorException('Gagal mendapatkan akses file');
    }
  }
}
