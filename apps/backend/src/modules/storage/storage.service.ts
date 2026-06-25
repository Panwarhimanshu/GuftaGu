import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { v4 as uuid } from 'uuid';
import * as path from 'path';

interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
}

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private cdnUrl: string;
  private logger = new Logger('StorageService');

  constructor(private configService: ConfigService) {
    this.bucket = configService.get<string>('AWS_S3_BUCKET', 'memechat-media');
    this.cdnUrl = configService.get<string>('AWS_CLOUDFRONT_URL', '');

    this.s3 = new S3Client({
      region: configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId:     configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<UploadResult> {
    const ext      = path.extname(file.originalname).toLowerCase();
    const key      = `${folder}/${uuid()}${ext}`;
    const isImage  = file.mimetype.startsWith('image/');
    const isVideo  = file.mimetype.startsWith('video/');

    // Upload original
    await this.s3.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        Body:        file.buffer,
        ContentType: file.mimetype,
        ACL:         'public-read' as any,
        Metadata:    { originalName: file.originalname },
      }),
    );

    const url = this.buildUrl(key);
    let thumbnailUrl: string | undefined;
    let thumbnailKey: string | undefined;

    // Generate thumbnail for images
    if (isImage) {
      const thumbKey  = `${folder}/thumbs/${uuid()}.webp`;
      const thumbBuf  = await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      await this.s3.send(
        new PutObjectCommand({
          Bucket:      this.bucket,
          Key:         thumbKey,
          Body:        thumbBuf,
          ContentType: 'image/webp',
          ACL:         'public-read' as any,
        }),
      );
      thumbnailUrl = this.buildUrl(thumbKey);
      thumbnailKey = thumbKey;
    }

    return { url, key, thumbnailUrl, thumbnailKey };
  }

  async uploadBuffer(buffer: Buffer, mimeType: string, folder = 'uploads'): Promise<UploadResult> {
    const ext = mimeType.split('/')[1] ?? 'bin';
    const key = `${folder}/${uuid()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        Body:        buffer,
        ContentType: mimeType,
        ACL:         'public-read' as any,
      }),
    );
    return { url: this.buildUrl(key), key };
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private buildUrl(key: string): string {
    if (this.cdnUrl) return `${this.cdnUrl}/${key}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
