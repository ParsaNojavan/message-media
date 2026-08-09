import DataResultDto from "@app/contracts/models/dtos/dataResultDto";
import 'multer';

export default abstract class StorageService {
    abstract upload(file : Express.Multer.File) : Promise<DataResultDto<any>>;
    abstract download(filePath : string): Promise<any>;
    abstract delete(filePath: string): Promise<DataResultDto<any>>;
}