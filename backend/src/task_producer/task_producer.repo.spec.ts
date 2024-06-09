import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskProducerRepository } from './task_producer.repo';
import { Task } from './entities/task.entity';
import { mock } from 'jest-mock-extended';

describe.only('TaskProducerRepository', () => {
  let repository: TaskProducerRepository;
  let mockTaskRepository: jest.Mocked<Repository<Task>>;

  beforeEach(async () => {
    mockTaskRepository = mock<Repository<Task>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskProducerRepository,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    repository = module.get(TaskProducerRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save a task', async () => {
      const task = new Task();
      mockTaskRepository.save = jest.fn().mockResolvedValue(task);

      const result = await repository.save(task);

      expect(result).toEqual(task);
      expect(mockTaskRepository.save).toHaveBeenCalledWith(task);
    });
  });

  describe('find', () => {
    it('should return all tasks', async () => {
      const tasks = [new Task(), new Task()];
      mockTaskRepository.find = jest.fn().mockResolvedValue(tasks);

      const result = await repository.find();

      expect(result).toEqual(tasks);
      expect(mockTaskRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOneById', () => {
    it('should return a task by id', async () => {
      const task = new Task();
      mockTaskRepository.findOneBy = jest.fn().mockResolvedValue(task);

      const result = await repository.findOneById(1);

      expect(result).toEqual(task);
      expect(mockTaskRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('update', () => {
    it('should update a task by id', async () => {
      mockTaskRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await repository.update(1, { title: 'Updated Title' });

      expect(result).toEqual({ affected: 1 });
      expect(mockTaskRepository.update).toHaveBeenCalledWith(1, {
        title: 'Updated Title',
      });
    });
  });

  describe('delete', () => {
    it('should delete a task by id', async () => {
      mockTaskRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.delete(1);

      expect(mockTaskRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new task', () => {
      const taskData = { title: 'New Task' };
      const task = new Task();
      mockTaskRepository.create = jest.fn().mockReturnValue(task);

      const result = repository.create(taskData);

      expect(result).toEqual(task);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(taskData);
    });
  });

  describe('deleteAll', () => {
    it('should delete all tasks', async () => {
      mockTaskRepository.clear = jest.fn().mockResolvedValue(undefined);

      await repository.deleteAll();

      expect(mockTaskRepository.clear).toHaveBeenCalled();
    });
  });
});
