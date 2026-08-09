import DataResultDto from '@app/contracts/models/dtos/dataResultDto';
import { BadRequestException, HttpStatus, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import Media, { MediaDocument } from './models/concrete/media';
import { Model } from 'mongoose';
import StorageService from './storage/abstract/storage.service';
import { Context } from 'vm';
import { basename } from 'path';

@Injectable()
export class MediaService {

  constructor(@InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    private readonly storageService: StorageService) { }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<DataResultDto<any>> {
    const meta = await this.storageService.upload(file);
    const media = await this.mediaModel.create({
      originalName: file.originalname,
      fileName: meta.data.name,
      mimeType: meta.data.mimeType,
      size: meta.data.size,
      url: meta.data.url,
      uploadedBy: userId
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
}
