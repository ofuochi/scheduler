import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Task, UpdatedTask } from '../types';
import { useQueryClient } from '@tanstack/react-query';

export const useSocketTaskUpdate = () => {
  const [task, setTask] = useState<UpdatedTask>();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_BASE_URL!);

    socket.on('task_update', (updatedTask: UpdatedTask) => {
      // Update the task in the cache
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map((task) =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        );
      });
      setTask(updatedTask);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return task;
};
