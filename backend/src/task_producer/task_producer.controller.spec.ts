import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';
import { TaskProducerController } from './task_producer.controller';
import { TaskProducerService } from './task_producer.service';

describe('TaskProducerController', () => {
  let taskController: TaskProducerController;
  let mockTaskService: jest.Mocked<TaskProducerService>;

  beforeEach(async () => {
    mockTaskService = mock<TaskProducerService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskProducerController],
      providers: [
        {
          provide: TaskProducerService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    taskController = app.get<TaskProducerController>(TaskProducerController);
  });

  it('should be defined', () => {
    expect(taskController).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto = createMock<CreateTaskDto>({
        title: 'Task 1',
      });
      const result = createMock<Task>(createTaskDto);
      mockTaskService.create.mockResolvedValue(result);

      expect(await taskController.create(createTaskDto)).toEqual(result);
      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const result = createMock<Task[]>();
      mockTaskService.findAll.mockResolvedValue(result);

      expect(await taskController.findAll()).toEqual(result);
      expect(mockTaskService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = createMock<Task>({
        title: 'Task 1',
      });
      mockTaskService.findOne.mockResolvedValue(result);

      expect(await taskController.findOne('1')).toEqual(result);
      expect(mockTaskService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = createMock<Task>({
        title: 'Updated Task',
      });
      const result = { ...updateTaskDto, id: 1 };
      mockTaskService.update.mockResolvedValue(result);

      expect(await taskController.update('1', updateTaskDto)).toEqual(result);
      expect(mockTaskService.update).toHaveBeenCalledWith(1, updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      mockTaskService.remove.mockResolvedValue();

      await taskController.remove('1');
      expect(mockTaskService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('removeAll', () => {
    it('should remove all tasks', async () => {
      mockTaskService.removeAll.mockResolvedValue();

      await taskController.removeAll();

      expect(mockTaskService.removeAll).toHaveBeenCalled();
    });
  });
});
