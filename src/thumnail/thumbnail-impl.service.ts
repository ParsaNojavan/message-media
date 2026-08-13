// thumbnail-impl.service.ts — پیاده‌سازی
import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import ThumbnailService from './abstract/thumbnail.service';

@Injectable()
export class ThumbnailServiceImpl extends ThumbnailService {
  async generateVideoThumb(videoPath: string, width = 320, atSecond = 1): Promise<string> {
    const outputPath = `/tmp/thumb-${randomUUID()}.jpg`;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timemarks: [atSecond],
          folder: '/tmp',
          filename: outputPath.split('/').pop()!,
          size: `${width}x?`,
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    return outputPath;
  }

  async generateImageThumb(imagePath: string, width = 320, quality = 80): Promise<string> {
    const outputPath = `/tmp/thumb-${randomUUID()}.jpg`;

    await sharp(imagePath)
      .resize(width, null, { withoutEnlargement: true })
      .jpeg({ quality })
      .toFile(outputPath);

    return outputPath;
  }
}
