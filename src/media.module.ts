import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import Media, { MediaSchema } from './models/concrete/media';
import { JwtModule } from '@nestjs/jwt';
import StorageService from './storage/abstract/storage.service';
import { LocalStorageService } from './storage/local.service';
import { JwtStrategy } from '@app/contracts/utils/jwt_token/strategies/jwt.strategy';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
      PORT: Joi.number().default(3000),
      REDIS_HOST: Joi.string().default('localhost'),
      REDIS_PORT: Joi.number().default(6379),
      MONGO_STRING: Joi.string().required(),
      MONGO_DB_NAME: Joi.string().default('mediadb')
    })
  }),
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: process.env.JWT_EXPIRATION as any
    },
    global: true
  }),
  MongooseModule.forRoot(process.env.MONGO_STRING?.toString() ?? '', { dbName: 'message_mediadb' }),
  MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),],
  controllers: [MediaController],
  providers: [MediaService,
    {
      provide: StorageService,
      useClass: LocalStorageService
    },JwtStrategy
  ],
})
export class MediaModule { }
