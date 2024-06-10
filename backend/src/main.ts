import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  StorageDriver,
  initializeTransactionalContext,
} from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO }); // Initialize TypeORM transaction

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: '*',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(process.env.PORT || 3001);
  Logger.log(`Server is running on: ${await app.getUrl()}`);
}
bootstrap();
