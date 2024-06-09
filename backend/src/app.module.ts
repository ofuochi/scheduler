import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskConsumerModule } from './task_consumer/task_consumer.module';
import { TaskProducerModule } from './task_producer/task_producer.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          type: 'sqlite',
          database: 'data/sqlite.db',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true
        };
      },
      async dataSourceFactory(options) {
        if (!options) throw new Error('Invalid options passed');

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('QUEUE_HOST') || 'redis',
          port: configService.get('QUEUE_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    TaskProducerModule,
    TaskConsumerModule,
  ],
  providers: [],
})
export class AppModule {}
