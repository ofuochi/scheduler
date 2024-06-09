import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TASK_QUEUE_NAME } from '../constants/task.constant';
import { Task } from './entities/task.entity';
import { TaskProducerService } from './task_producer.service';
import { TaskProducerController } from './task_producer.controller';
import { TaskProducerRepository } from './task_producer.repo';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({ name: TASK_QUEUE_NAME }),
  ],
  providers: [TaskProducerService, TaskProducerRepository],
  controllers: [TaskProducerController],
  exports: [TaskProducerRepository],
})
export class TaskProducerModule {}
