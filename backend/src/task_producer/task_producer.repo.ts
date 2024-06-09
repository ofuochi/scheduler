import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

@Injectable()
export class TaskProducerRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async save(task: Task): Promise<Task> {
    return this.taskRepository.save(task);
  }

  async find(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async findOneById(id: number): Promise<Task> {
    return this.taskRepository.findOneBy({ id });
  }

  async update(id: number, updateData: Partial<Task>) {
    return this.taskRepository.update(id, updateData);
  }

  async delete(id: number): Promise<void> {
    await this.taskRepository.delete(id);
  }

  create(taskData: Partial<Task>): Task {
    return this.taskRepository.create(taskData);
  }

  async deleteAll(): Promise<void> {
    await this.taskRepository.clear();
  }
}
