import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TASK_QUEUE_NAME } from '../constants/task.constant';
import { TaskProducerModule } from '../task_producer/task_producer.module';
import { TaskSocket } from './task.socket';
import { TaskConsumerService } from './task_consumer.service';

@Module({
  imports: [
    TaskProducerModule,
    BullModule.registerQueue({
      name: TASK_QUEUE_NAME,
    }),
  ],
  providers: [TaskConsumerService, TaskSocket],
})
export class TaskConsumerModule {
  constructor(
    @InjectQueue(TASK_QUEUE_NAME) private readonly taskQueue: Queue,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    createBullBoard({
      queues: [new BullMQAdapter(this.taskQueue)],
      serverAdapter,
    });

    serverAdapter.setBasePath('/board');

    consumer.apply(serverAdapter.getRouter()).forRoutes('/board');
  }
}
