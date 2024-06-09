import { createMock } from '@golevelup/ts-jest';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { addMinutes } from 'date-fns';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { TASK_QUEUE_NAME } from '../src/constants/task.constant';
import { CreateTaskDto } from '../src/task_producer/dto/create-task.dto';
import { UpdateTaskDto } from '../src/task_producer/dto/update-task.dto';
import { Task } from '../src/task_producer/entities/task.entity';
import { TaskProducerModule } from '../src/task_producer/task_producer.module';
import { TaskProducerService } from '../src/task_producer/task_producer.service';

describe('TaskProducerController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const mockedQueue = createMock<Queue>();

  beforeAll(async () => {
    initializeTransactionalContext();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            return {
              type: 'sqlite',
              database: ':memory:',
              entities: [Task],
              synchronize: true,
            };
          },
          dataSourceFactory: async (options) =>
            addTransactionalDataSource(new DataSource(options)),
        }),
        BullModule.registerQueue({ name: TASK_QUEUE_NAME }),
        TaskProducerModule,
      ],
      providers: [TaskProducerService],
    })
      .overrideProvider(getQueueToken(TASK_QUEUE_NAME))
      .useValue(mockedQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM task');
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('/tasks (POST)', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      isRecurring: false,
      runAt: addMinutes(new Date(), 20),
    };
    const task = await sendCreateTaskRequest(app, createTaskDto);

    expect(task).toMatchObject({
      id: expect.any(Number),
      title: createTaskDto.title,
    });

    expect(mockedQueue.add).toHaveBeenCalledWith(
      TASK_QUEUE_NAME,
      expect.objectContaining({
        title: createTaskDto.title,
      }),
      expect.any(Object),
    );
  });

  it('/tasks (GET)', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      isRecurring: false,
      runAt: addMinutes(new Date(), 20),
    };

    await sendCreateTaskRequest(app, createTaskDto);

    const response = await request(app.getHttpServer())
      .get('/tasks')
      .expect(200);

    const expectedResponse = [
      {
        title: createTaskDto.title,
        isRecurring: createTaskDto.isRecurring,
        runAt: createTaskDto.runAt.toISOString(),
      },
    ];
    expect(response.body).toMatchObject(expectedResponse);
  });

  it('/tasks/:id (GET)', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      isRecurring: false,
      runAt: addMinutes(new Date(), 20),
    };

    const task = await sendCreateTaskRequest(app, createTaskDto);
    const response = await request(app.getHttpServer())
      .get(`/tasks/${task.id}`)
      .expect(200);

    expect(response.body).toEqual(task);
  });

  it('/tasks/:id (PUT)', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      isRecurring: false,
      runAt: addMinutes(new Date(), 20),
    };

    const task = await sendCreateTaskRequest(app, createTaskDto);

    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task',
    };
    const response = await request(app.getHttpServer())
      .put(`/tasks/${task.id}`)
      .send(updateTaskDto)
      .expect(200);

    expect(response.body).toEqual({
      ...task,
      title: updateTaskDto.title,
    });
  });

  it('/tasks/:id (DELETE)', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      isRecurring: false,
      runAt: addMinutes(new Date(), 20),
    };

    const task = await sendCreateTaskRequest(app, createTaskDto);
    await request(app.getHttpServer()).delete(`/tasks/${task.id}`).expect(200);
    await request(app.getHttpServer()).get(`/tasks/${task.id}`).expect(404);
  });

  it('/tasks (DELETE)', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      isRecurring: false,
      runAt: addMinutes(new Date(), 20),
    };

    await sendCreateTaskRequest(app, createTaskDto);
    await request(app.getHttpServer()).delete('/tasks').expect(200);
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .expect(200);

    expect(response.body).toEqual([]);
  });
});
async function sendCreateTaskRequest(
  app: INestApplication,
  createTaskDto: CreateTaskDto,
): Promise<Task> {
  const response = await request(app.getHttpServer())
    .post('/tasks')
    .send(createTaskDto)
    .expect(201);

  return response.body;
}
