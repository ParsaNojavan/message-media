import { NestFactory } from '@nestjs/core';
import { MediaModule } from './media.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AllExceptionsFilter } from '@app/contracts/utils/crossCuttingConcerns/exception/rcpExceptionFilter';
import PerformanceAspect from '@app/contracts/utils/aspects/performanceAspect';
import { ExceptionAspcet } from '@app/contracts/utils/aspects/exceptionAspect';
import { ConfigService } from '@nestjs/config';
import { HttpContextAspcet } from '@app/contracts/utils/aspects/httpContextAspect';
import { existsSync } from 'fs';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(MediaModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: ['http://localhost:4200', 'http://192.168.1.107:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const storagePath = join(process.cwd(), 'storage');

  app.use(
    '/media',
    express.static(storagePath, {
      maxAge: 86400000,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: configService.get<string>('REDIS_HOST') ?? 'localhost',
      port: configService.get<number>('REDIS_PORT') ?? 6379,
      username: configService.get<string | undefined>('REDIS_USERNAME'),
      password: configService.get<string | undefined>('REDIS_PASSWORD'),
    },
  });

  app.useGlobalInterceptors(new ExceptionAspcet());
  app.useGlobalInterceptors(new PerformanceAspect());
  app.useGlobalInterceptors(new HttpContextAspcet());

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Media Service running on port ${port}`);
  console.log(`Static assets served from: ${storagePath} at /uploads/`);
}
bootstrap();
