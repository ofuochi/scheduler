export type Task = {
  id: number;
  title: string;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  timestamp: Date;
  lastRunAt?: Date;
  completedAt?: Date;
  isRecurring: boolean;
  runAt?: Date;
  frequency?: string;
  failedReason?: string;
  attempts: number;
};
