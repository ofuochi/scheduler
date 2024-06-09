import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CONCURRENCY_LIMIT, TASK_QUEUE_NAME } from '../constants/task.constant';
import { Task, TaskStatus } from '../task_producer/entities/task.entity';
import { TaskProducerRepository } from '../task_producer/task_producer.repo';
import { TaskSocket } from './task.socket';
import { addMilliseconds } from 'date-fns';

@Processor(
  {
    name: TASK_QUEUE_NAME,
  },
  { concurrency: CONCURRENCY_LIMIT },
)
export class TaskConsumerService extends WorkerHost {
  private readonly logger = new Logger(TaskConsumerService.name);

  constructor(
    private readonly taskRepository: TaskProducerRepository,
    private readonly taskSocketGateway: TaskSocket,
  ) {
    super();
  }

  async process(job: Job<Task>) {
    const { data, opts } = job;
    this.logger.debug(`Started processing task ${data.id}...`);

    // Simulate 20s of processing time
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Simulate a 50% chance of failure
    if (Math.random() < 0.5) throw new Error('Simulated random failure');

    const taskToUpdate: Partial<Task> = {
      attempts: opts?.repeat?.count,
    };

    const { affected } = await this.taskRepository.update(
      data.id,
      taskToUpdate,
    );

    return affected > 0 ? { ...data, ...taskToUpdate } : null;
  }

  @OnWorkerEvent('active')
  async onActive(job: Job<Task>) {
    const { data, opts } = job;
    this.logger.debug(`Task ${data.id} is active...`);

    const toUpdate: Partial<Task> = {
      status: TaskStatus.processing,
      lastRunAt: new Date(),
      id: data.id,
      attempts: opts?.repeat?.count,
    };

    if (opts.delay && data.isRecurring)
      toUpdate.runAt = this.calculateNextRunAt(opts.delay);

    const { affected } = await this.taskRepository.update(data.id, toUpdate);

    if (affected > 0) this.taskSocketGateway.sendTaskUpdate(toUpdate);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<Task>) {
    const { data, opts } = job;

    this.logger.debug(`Task ${data.id} is completed...`);

    const toUpdate: Partial<Task> = {
      status: TaskStatus.completed,
      completedAt: new Date(),
      id: data.id,
      failedReason: null,
      attempts: opts?.repeat?.count,
    };
    if (opts.delay && data.isRecurring)
      toUpdate.runAt = this.calculateNextRunAt(opts.delay);

    const { affected } = await this.taskRepository.update(data.id, toUpdate);

    if (affected === 0) {
      this.logger.warn(`Task ${data.id} not found in database`);
      return;
    }

    const task = await this.taskRepository.findOneById(data.id);
    this.taskSocketGateway.sendTaskUpdate(task);
  }

  @OnWorkerEvent('failed')
  async onError(job: Job<Task>, error: Error) {
    const { data, opts } = job;
    this.logger.debug(`Task ${data.id} failed...`);

    const toUpdate = {
      status: TaskStatus.failed,
      failedReason: error.message,
      id: data.id,
      runAt: this.calculateNextRunAt(opts.delay),
      attempts: opts?.repeat?.count,
    };
    await this.taskRepository.update(data.id, toUpdate);

    this.taskSocketGateway.sendTaskUpdate(toUpdate);
  }

  private calculateNextRunAt(delay: number) {
    return addMilliseconds(new Date(), delay);
  }
}
