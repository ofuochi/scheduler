import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { Task } from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

const fetchTasks = async (): Promise<Task[]> => {
  const { data } = await api.get<Task[]>('/tasks');
  return data.sort((a, b) => b.id - a.id); // Sort tasks by id in descending order
};

const createTask = async (task: Partial<Task>): Promise<Task> => {
  const { data } = await api.post<Task>('/tasks', task);
  return data;
};

const updateTask = async ({
  id,
  data,
}: {
  id: number;
  data: Partial<Task>;
}) => {
  const response = await api.put<Task>(`/tasks/${id}`, data);
  return response.data;
};

const deleteTask = async (id: number): Promise<number> => {
  await api.delete<void>(`/tasks/${id}`);
  return id;
};

const deleteAllTasks = async (_?: null): Promise<void> => {
  await api.delete<void>('/tasks');
};

export const useTasks = () => {
  return useQuery<Task[], Error>({ queryKey: ['tasks'], queryFn: fetchTasks });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks) => {
        if (oldTasks)
          return [newTask, ...oldTasks.map((task) => ({ ...task }))]; // Add new task to the top
        return [newTask];
      });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks) => {
        if (oldTasks) {
          return oldTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          ); // Update only the affected task
        }
        return [updatedTask];
      });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (deletedTaskId) => {
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks) => {
        if (oldTasks) {
          return oldTasks.filter((task) => task.id !== deletedTaskId);
        }
        return [];
      });
    },
  });
};

export const useDeleteAllTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllTasks,
    onSuccess: () => {
      queryClient.setQueryData<Task[]>(['tasks'], []);
    },
  });
};
