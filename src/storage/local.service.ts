import DataResultDto from "@app/contracts/models/dtos/dataResultDto";
import StorageService from "./abstract/storage.service";
import { BadRequestException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { access, mkdir, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createReadStream, constants as FS_CONSTANTS } from "node:fs";
import { resolve, sep } from 'path';

@Injectable()
export class LocalStorageService extends StorageService {

    private rootDir;

    constructor(private configService: ConfigService) {
        super();
        this.rootDir = this.configService.get<string>('LOCAL_STORAGE_ROOT_DIR');
    }


    async upload(file: Express.Multer.File): Promise<DataResultDto<any>> {
        if (!file || !file.buffer) {
            throw new BadRequestException('errors.file.empty');
        }

        await mkdir(this.rootDir, { recursive: true });

        const fileExt = extname(file.originalname);
        const fileName = `${crypto.randomUUID()}${fileExt}`;
        const newPath = join(this.rootDir, fileName);

        await writeFile(newPath, file.buffer);

        const fileUrl = `/media/${fileName}`;

        return {
            success: true,
            statusCode: HttpStatus.CREATED,
            data: {
                name: fileName,
                url: fileUrl,
                mimeType: file.mimetype,
                size: file.size,
                originalName: file.originalname,
                filePath: newPath
            },
            message: 'File uploaded successfully'
        };


    }

    async download(filePath: string): Promise<any> {
        if (!filePath) {
            throw new BadRequestException('file.download.failure');
        }

        const absoluteRoot = resolve(this.rootDir);

        const safeRoot = absoluteRoot.endsWith(sep) ? absoluteRoot : absoluteRoot + sep;
        const safePath = resolve(this.rootDir, filePath);

        if (!safePath.startsWith(safeRoot))
            throw new BadRequestException('file.download.access-denied');

        await access(safePath, FS_CONSTANTS.R_OK);
        
        return createReadStream(safePath);

    }

    delete(filePath: string): Promise<DataResultDto<any>> {
        throw new Error("Method not implemented.");
    }
}