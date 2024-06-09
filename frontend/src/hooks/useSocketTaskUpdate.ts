import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Task } from '../types';

type UpdatedTask = Partial<Task> & { id: number };

export const useSocketTaskUpdate = () => {
  const [task, setTask] = useState<UpdatedTask>();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_BASE_URL!);

    socket.on('task_update', (task: UpdatedTask) => setTask(task));

    return () => {
      socket.disconnect();
    };
  }, []);

  return task;
};
