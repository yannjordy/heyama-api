import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3: S3Client;
  private bucket: string;
  private useLocal: boolean;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'heyama-bucket';
    this.useLocal = process.env.S3_USE_LOCAL === 'true';

    if (this.useLocal) {
      this.logger.log('S3: Using local file storage');
    } else {
      this.s3 = new S3Client({
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
        },
        forcePathStyle: true,
      });
      this.logger.log(`S3: Using endpoint ${process.env.S3_ENDPOINT || 'http://localhost:9000'}`);
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const key = `objects/${uuidv4()}${ext}`;

    if (this.useLocal) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'objects');
      fs.mkdirSync(uploadDir, { recursive: true });
      const uploadPath = path.join(uploadDir, `${uuidv4()}${ext}`);
      fs.writeFileSync(uploadPath, file.buffer);
      return `/uploads/objects/${path.basename(uploadPath)}`;
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${this.bucket}/${key}`;
  }

  async delete(imageUrl: string): Promise<void> {
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.indexOf(this.bucket);
    if (bucketIndex === -1) return;
    const key = urlParts.slice(bucketIndex + 1).join('/');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}