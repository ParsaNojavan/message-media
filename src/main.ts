import { NestFactory } from '@nestjs/core';
import { MediaModule } from './media.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AllExceptionsFilter } from '@app/contracts/utils/crossCuttingConcerns/exception/rcpExceptionFilter';
import PerformanceAspect from '@app/contracts/utils/aspects/performanceAspect';
import { ExceptionAspcet } from '@app/contracts/utils/aspects/exceptionAspect';
import { ConfigService } from '@nestjs/config';
import { HttpContextAspcet } from '@app/contracts/utils/aspects/httpContextAspect';

async function bootstrap() {
  const app = await NestFactory.create(MediaModule);

  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: configService.get<string>('REDIS_HOST') ?? 'localhost',
      port: configService.get<number>('REDIS_PORT') ?? 6379,
      username: configService.get<string | undefined>('REDIS_USERNAME'),
      password: configService.get<string | undefined>('REDIS_PASSWORD')
    }
  })

  app.useGlobalInterceptors(new ExceptionAspcet())
  app.useGlobalInterceptors(new PerformanceAspect())

  app.useGlobalInterceptors(new HttpContextAspcet())

  await app.startAllMicroservices()

  await app.listen(configService.get<number>('PORT') || 3000);
}
bootstrap();
