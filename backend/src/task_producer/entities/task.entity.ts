import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum TaskStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  jobId?: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ nullable: true })
  lastRunAt?: Date;

  @Column({ nullable: true, default: 0 })
  attempts?: number;

  @Column({
    type: 'simple-enum',
    enum: TaskStatus,
    default: TaskStatus.pending,
  })
  status: TaskStatus = TaskStatus.pending;

  @Column()
  isRecurring: boolean;

  @Column({ nullable: true })
  runAt?: Date;

  @Column({ nullable: true })
  frequency?: string;

  @Column({ nullable: true })
  failedReason?: string;

  @Column({
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;
}
