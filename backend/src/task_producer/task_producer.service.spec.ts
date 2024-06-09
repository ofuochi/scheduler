import { createMock } from '@golevelup/ts-jest';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job, Queue } from 'bullmq';
import { mock } from 'jest-mock-extended';
import { TASK_QUEUE_NAME } from '../constants/task.constant';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskProducerRepository } from './task_producer.repo';
import { TaskProducerService } from './task_producer.service';

import { CreateTaskDto } from './dto/create-task.dto';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
}));

describe('TaskProducerService', () => {
  let service: TaskProducerService;
  let taskRepository: jest.Mocked<TaskProducerRepository>;
  let taskQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    taskRepository = mock<TaskProducerRepository>();
    taskQueue = mock<Queue>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskProducerService,
        {
          provide: TaskProducerRepository,
          useValue: taskRepository,
        },
        { provide: getQueueToken(TASK_QUEUE_NAME), useValue: taskQueue },
      ],
    }).compile();

    service = module.get(TaskProducerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task and add it to the queue', async () => {
      const createTaskDto = createMock<CreateTaskDto>({
        isRecurring: false,
        runAt: new Date(Date.now() + 1000), // 1 second in the future
      });

      const savedTask = createMock<Task>({
        ...createTaskDto,
        id: 1,
        jobId: '123',
      });
      taskRepository.create.mockReturnValue(savedTask);
      taskRepository.save.mockResolvedValue(savedTask);
      taskQueue.add.mockResolvedValue({
        id: '123',
        opts: { delay: 1000 },
      } as any);

      const result = await service.create(createTaskDto);

      expect(result).toEqual(savedTask);
      expect(taskQueue.add).toHaveBeenCalledWith(
        TASK_QUEUE_NAME,
        savedTask,
        expect.any(Object),
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const tasks = createMock<Task[]>([{ id: 1 }, { id: 2 }]);

      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(result).toEqual(tasks);
      expect(taskRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const task = createMock<Task>({ id: 1 });
      taskRepository.findOneById.mockResolvedValue(task);

      const result = await service.findOne(1);

      expect(result).toEqual(task);
      expect(taskRepository.findOneById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should throw an error if task is a completed one-time task', async () => {
      const task = createMock<Task>({
        id: 1,
        status: TaskStatus.completed,
        isRecurring: false,
      });
      taskRepository.findOneById.mockResolvedValue(task);

      await expect(service.update(1, {} as UpdateTaskDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete and recreate a new task while updating a recurring task', async () => {
      const task = createMock<Task>({
        id: 1,
        status: TaskStatus.pending,
        isRecurring: true,
        jobId: '123',
      });
      const newTask = createMock<Task>({
        id: 2,
        status: TaskStatus.pending,
        isRecurring: true,
      });
      taskRepository.findOneById.mockResolvedValue(task);
      taskQueue.getJob.mockResolvedValue(createMock<Job>({ id: '123' }));
      taskQueue.removeRepeatableByKey.mockResolvedValue(null);
      taskQueue.add.mockResolvedValue(createMock<Job>({ id: '123' }));
      taskRepository.save.mockResolvedValue(newTask);

      const result = await service.update(1, createMock<UpdateTaskDto>());

      expect(result).toEqual(newTask);
    });

    it('should update a task and its job data if it is a one-time pending task', async () => {
      const task = createMock<Task>({
        id: 1,
        status: TaskStatus.pending,
        isRecurring: false,
        jobId: '123',
      });
      taskRepository.findOneById.mockResolvedValue(task);
      const job = { updateData: jest.fn() };
      taskQueue.getJob.mockResolvedValue(job as any);

      const updateTaskDto: UpdateTaskDto = { title: 'New Title' };

      const result = await service.update(1, updateTaskDto);

      expect(result).toEqual(task);
      expect(job.updateData).toHaveBeenCalledWith(updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should remove a task and its job from the queue', async () => {
      const task = createMock<Task>({ id: 1, jobId: '123' });
      taskRepository.findOneById.mockResolvedValue(task);
      taskQueue.getJob.mockResolvedValue(createMock<Job>());

      await service.remove(1);

      expect(taskRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw if task does not exist', async () => {
      taskRepository.findOneById.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);

      expect(taskRepository.delete).not.toHaveBeenCalled();
      expect(taskQueue.remove).not.toHaveBeenCalled();
    });
  });

  describe('removeAll', () => {
    it('should remove all tasks and obliterate the queue', async () => {
      await service.removeAll();

      expect(taskQueue.obliterate).toHaveBeenCalledWith({ force: true });
      expect(taskRepository.deleteAll).toHaveBeenCalled();
    });
  });
});
