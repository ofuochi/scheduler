import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CONCURRENCY_LIMIT, TASK_QUEUE_NAME } from '../constants/task.constant';
import { Task, TaskStatus } from '../task_producer/entities/task.entity';
import { TaskProducerRepository } from '../task_producer/task_producer.repo';
import { TaskSocket } from './task.socket';

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

    // Simulate 10s of processing time
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Simulate a 50% chance of failure
    if (Math.random() < 0.5)
      throw new Error(`Random failure for task ${data.id}`);

    const taskToUpdate = {
      attempts: opts?.repeat?.count,
      runAt: this.calculateNextRunAt(opts?.delay),
    };

    const result = await this.taskRepository.update(data.id, taskToUpdate);

    return result.affected > 0 ? { ...data, ...taskToUpdate } : null;
  }

  @OnWorkerEvent('active')
  async onActive(job: Job<Task>) {
    const { data, opts } = job;
    this.logger.debug(`Task ${data.id} is active...`);

    const toUpdate = {
      status: TaskStatus.processing,
      lastRunAt: new Date(),
      id: data.id,
      runAt: this.calculateNextRunAt(opts?.delay),
      attempts: opts?.repeat?.count,
    };
    const result = await this.taskRepository.update(data.id, toUpdate);

    if (result.affected > 0) this.taskSocketGateway.sendTaskUpdate(toUpdate);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<Task>) {
    const { data, opts } = job;

    this.logger.debug(`Task ${data.id} is completed...`);

    const result = await this.taskRepository.update(data.id, {
      status: TaskStatus.completed,
      completedAt: new Date(),
      id: data.id,
      runAt: this.calculateNextRunAt(opts?.delay),
      attempts: opts?.repeat?.count,
    });

    if (result.affected === 0) {
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

  private calculateNextRunAt(delay?: number) {
    return delay ? new Date(Date.now() + delay) : null;
  }
}
