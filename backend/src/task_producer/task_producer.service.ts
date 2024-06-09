import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { differenceInMilliseconds } from 'date-fns';
import { Transactional } from 'typeorm-transactional';
import { TASK_QUEUE_NAME } from '../constants/task.constant';
import { calculateNextExecutionTime } from '../utils/job.util';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskProducerRepository } from './task_producer.repo';

@Injectable()
export class TaskProducerService {
  private readonly logger = new Logger(TaskProducerService.name);

  constructor(
    @InjectQueue(TASK_QUEUE_NAME)
    private readonly taskQueue: Queue,
    private readonly taskRepository: TaskProducerRepository,
  ) {}

  @Transactional()
  async create(createTaskDto: Partial<Task>) {
    const opts: JobsOptions = {
      removeOnComplete: !createTaskDto.isRecurring,
    };

    if (createTaskDto.isRecurring)
      opts.repeat = { pattern: createTaskDto.frequency };
    else opts.delay = differenceInMilliseconds(createTaskDto.runAt, new Date());

    const task = await this.taskRepository.save(
      this.taskRepository.create(createTaskDto),
    );
    if (createTaskDto.isRecurring) opts.jobId = task.id.toString();

    const job = await this.taskQueue.add(TASK_QUEUE_NAME, task, opts);
    task.jobId = job.id.toString();

    if (createTaskDto.isRecurring)
      task.runAt = calculateNextExecutionTime(createTaskDto.frequency);

    const result = await this.taskRepository.save(task);

    return result;
  }

  findAll() {
    return this.taskRepository.find();
  }

  async findOne(id: number) {
    const task = await this.taskRepository.findOneById(id);

    if (!task) throw new NotFoundException(`Task with id ${id} not found`);

    return task;
  }

  @Transactional()
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id);
    if (!task) return;

    // cannot update a one-time completed task. It's set to be removed from the queue on completion
    if (task.status === TaskStatus.completed && !task.isRecurring)
      throw new BadRequestException('Cannot update a one-time completed task');

    if (task.isRecurring) {
      // Cannot update a recurring task, deleting and creating a new one
      const [, newTask] = await Promise.all([
        this.deleteJob(task),
        this.create({ ...updateTaskDto, id }),
      ]);

      return newTask;
    }

    const job = await this.taskQueue.getJob(task.jobId);
    if (!job) return;

    await Promise.all([
      job.updateData(updateTaskDto),
      this.taskRepository.update(id, {
        ...updateTaskDto,
        status: TaskStatus.pending,
        frequency: null,
      }),
    ]);

    return await this.taskRepository.findOneById(id);
  }

  @Transactional()
  async remove(id: number) {
    const task = await this.findOne(id);
    if (!task) {
      this.logger.warn(`Task with id ${id} not found`);
      return;
    }

    await Promise.all([this.deleteJob(task), this.taskRepository.delete(id)]);
  }

  @Transactional()
  async removeAll() {
    await Promise.all([
      this.taskQueue.obliterate({ force: true }),
      this.taskRepository.deleteAll(),
    ]);
  }

  private async deleteJob(task: Task) {
    const job = await this.taskQueue.getJob(task.jobId);
    if (!job) return;

    if (job.opts.repeat)
      await this.taskQueue.removeRepeatableByKey(job.repeatJobKey);

    await job.remove();
  }
}
