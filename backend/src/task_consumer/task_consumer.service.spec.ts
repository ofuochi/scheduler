import { TestingModule, Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { TaskProducerRepository } from '../task_producer/task_producer.repo';
import { TaskConsumerService } from './task_consumer.service';
import { TaskSocket } from './task.socket';
import { createMock } from '@golevelup/ts-jest';
import { Job } from 'bullmq';
import { Task, TaskStatus } from '../task_producer/entities/task.entity';
import { UpdateResult } from 'typeorm';

describe.only('TaskConsumerService', () => {
  let service: TaskConsumerService;
  let mockTaskRepository: jest.Mocked<TaskProducerRepository>;
  let mockTaskSocket: jest.Mocked<TaskSocket>;

  beforeEach(async () => {
    mockTaskRepository = mock<TaskProducerRepository>();
    mockTaskSocket = mock<TaskSocket>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskConsumerService,
        {
          provide: TaskProducerRepository,
          useValue: mockTaskRepository,
        },
        {
          provide: TaskSocket,
          useValue: mockTaskSocket,
        },
      ],
    }).compile();

    service = module.get(TaskConsumerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    it('should process job successfully', async () => {
      const data = createMock<Task>({ id: 2 });
      const job = createMock<Job<Task>>({ id: '1', data, opts: { delay: 10 } });
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return {} as any;
      });
      jest.spyOn(global.Math, 'random').mockReturnValue(1); // to avoid random failure simulation
      mockTaskRepository.update.mockResolvedValue(
        createMock<UpdateResult>({ affected: 1 }),
      );

      const result = await service.process(job);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(data.id, {
        attempts: job.opts?.repeat?.count,
        runAt: expect.any(Date),
      });
      expect(result).not.toBeNull();
    });

    it('should fail to process job', async () => {
      const job = createMock<Job<Task>>({ id: '1' });
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return {} as any;
      });
      mockTaskRepository.update.mockResolvedValue(
        createMock<UpdateResult>({ affected: 0 }),
      );

      const result = await service.process(job);

      expect(result).toBeNull();
    });

    it('should throw an error randomly', async () => {
      const job = createMock<Job<Task>>({ id: '1' });
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return {} as any;
      });
      jest.spyOn(global.Math, 'random').mockReturnValue(0.4);

      await expect(service.process(job)).rejects.toThrow();
    });
  });

  describe('onActive', () => {
    it('should handle active event', async () => {
      const job = createMock<Job<Task>>({ data: { id: 1 } });
      mockTaskRepository.update.mockResolvedValue(
        createMock<UpdateResult>({ affected: 1 }),
      );

      await service.onActive(job);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        job.data.id,
        expect.objectContaining({
          status: TaskStatus.processing,
        }),
      );
      expect(mockTaskSocket.sendTaskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: job.data.id,
          status: TaskStatus.processing,
        }),
      );
    });
  });

  describe('onCompleted', () => {
    it('should handle completed event', async () => {
      const job = createMock<Job<Task>>({ data: { id: 1 } });
      const dbTask = createMock<Task>({ status: TaskStatus.completed });
      mockTaskRepository.update.mockResolvedValue(
        createMock<UpdateResult>({ affected: 1 }),
      );
      mockTaskRepository.findOneById.mockResolvedValue(dbTask);

      await service.onCompleted(job);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        job.data.id,
        expect.objectContaining({
          status: TaskStatus.completed,
        }),
      );
      expect(mockTaskSocket.sendTaskUpdate).toHaveBeenCalledWith(dbTask);
    });

    it('should log a warning if task not found', async () => {
      const job = createMock<Job<Task>>({ data: { id: 1 } });
      mockTaskRepository.update.mockResolvedValue(
        createMock<UpdateResult>({ affected: 0 }),
      );

      await service.onCompleted(job);
      expect(mockTaskSocket.sendTaskUpdate).not.toHaveBeenCalled();
    });
  });

  describe('onError', () => {
    it('should handle failed event', async () => {
      const job = createMock<Job<Task>>({ data: { id: 1 } });
      const error = new Error('test error');

      await service.onError(job, error);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        job.data.id,
        expect.objectContaining({
          status: TaskStatus.failed,
          failedReason: error.message,
        }),
      );
      expect(mockTaskSocket.sendTaskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: job.data.id,
          status: TaskStatus.failed,
          failedReason: error.message,
        }),
      );
    });
  });
});
