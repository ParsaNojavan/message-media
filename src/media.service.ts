import DataResultDto from '@app/contracts/models/dtos/dataResultDto';
import { BadRequestException, HttpStatus, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import Media, { MediaDocument } from './models/concrete/media';
import { Model } from 'mongoose';
import StorageService from './storage/abstract/storage.service';
import { Context } from 'vm';
import { basename, join } from 'path';
import { Response } from 'express';
import ThumbnailService from './thumnail/abstract/thumbnail.service';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';

@Injectable()
export class MediaService {

  constructor(@InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    private readonly storageService: StorageService,
    private readonly thumbnailService: ThumbnailService) { }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<DataResultDto<any>> {
    const meta = await this.storageService.upload(file);

    let thumbnailUrl: string | undefined;
    const mi = file.mimetype ?? '';

    if (mi.startsWith('video/')) {
      thumbnailUrl = await this.thumbnailService.generateVideoThumb(meta.data.filePath, 320, 1);
    } else if (mi.startsWith('image/')) {
      thumbnailUrl = await this.thumbnailService.generateImageThumb(meta.data.filePath, 320, 80);
    }

    const media = await this.mediaModel.create({
      originalName: file.originalname,
      fileName: meta.data.name,
      mimeType: meta.data.mimeType,
      size: meta.data.size,
      url: meta.data.url,
      thumbnailUrl: thumbnailUrl,
      uploadedBy: userId,
      filePath: meta.data.filePath
    });

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: media,
      message: 'file.uploaded'
    };
  }

  async downloadFile(data: { mediaId: string, context: Context }): Promise<StreamableFile> {

    const { mediaId, context } = data;

    if (!mediaId) {
      throw new BadRequestException('file.download.file-id-required');
    }


    const file = await this.mediaModel
      .findById(mediaId)
      .exec();

    if (!file)
      throw new NotFoundException('file.download.notFound');


    return new StreamableFile(await this.storageService.download(file.url), {
      type: file.mimeType,
      disposition: `attachment; filename="${encodeURIComponent(basename(file.url))}"`,
    })
  }

  async streamFile(mediaId: string, range: string | undefined, res: Response) {
    const RANGE_REGEX = /^bytes=(\d*)-(\d*)$/;
    const media = await this.mediaModel.findById(mediaId);

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    let fileSize: number;

    try {
      const stats = await stat(media.filePath);
      fileSize = stats.size;
    } catch {
      throw new NotFoundException('File missing on disk');
    }

    const contentType = media.mimeType;

    if (!range) {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
      });
      createReadStream(media.filePath).pipe(res);
      return;
    }
    const match = RANGE_REGEX.exec(range);
    if (!match) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
      res.end();
      return;
    }

    const [, startStr, endStr] = match;
    let start: number;
    let end: number;

    if (startStr === '') {
      const suffixLength = parseInt(endStr, 10);
      start = Math.max(fileSize - suffixLength, 0);
      end = fileSize - 1;
    }
    else {
      start = parseInt(startStr, 10);
      end = endStr === '' ? fileSize - 1 : parseInt(endStr, 10);
    }

    if (start >= fileSize || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
      res.end();
      return;
    }

    end = Math.min(end, fileSize - 1);
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Type': contentType,
      'Content-Length': chunkSize,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    });

    const stream = createReadStream(media.filePath, {
      start,
      end,
      autoClose: true,
    });

    stream.on('error', () => res.destroy());
    stream.pipe(res);
  }
}
