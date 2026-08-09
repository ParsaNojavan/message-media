import { BadRequestException, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { MediaService } from './media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@app/contracts/utils/jwt_token/guards/jwt.guard';
import { HttpContext } from '@app/contracts/utils/crossCuttingConcerns/decorators/http-context.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Post('upload')
  @UseGuards(new JwtAuthGuard(['user']))
  @UseInterceptors(FileInterceptor('document'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req
  ) {

    if (!file) {
      throw new BadRequestException('file.required');
    }

    const userId = req.user.sub;
    console.log(userId)

    return await this.mediaService.uploadFile(file, userId);
  }

  @Get('download/:id')
  @UseGuards(new JwtAuthGuard(['user']))
  async download(@Param('id') mediaId: string, @HttpContext() context) {
    return await this.mediaService.downloadFile({ mediaId, context });
  }
}
