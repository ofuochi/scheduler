import {
  Alert,
  Button,
  Flex,
  Layout,
  message,
  Modal,
  Popconfirm,
  Spin,
} from 'antd';
import React, { useState } from 'react';
import { PlusOutlined, ClearOutlined } from '@ant-design/icons';
import {
  useCreateTask,
  useDeleteAllTasks,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '../hooks/useTaskApi';
import { Task } from '../types';
import Navbar from './Navbar';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const { Header, Content } = Layout;

const TaskApp: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>();

  const { data: tasks, error, isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const deleteAllMutation = useDeleteAllTasks();

  const handleEdit = (task: Task) => {
    setIsModalVisible(true);
    setCurrentTask(task);
  };

  const handleSubmit = (task: Task) => {
    const isEdit = currentTask !== undefined;
    if (isEdit) {
      updateTaskMutation.mutate(
        { id: currentTask.id, data: task },
        {
          onSuccess: () => {
            message.success('Task updated successfully');
            resetView();
          },
          onError: (err) => message.error(err.message),
        }
      );
    } else {
      createTaskMutation.mutate(task, {
        onSuccess: () => {
          message.success('Task created successfully');
          resetView();
        },
        onError: (err) => message.error(err.message),
      });
    }
  };

  const resetView = () => {
    setIsModalVisible(false);
    setCurrentTask(undefined);
  };

  const handleDelete = async (id: number) => {
    deleteTaskMutation.mutate(id, {
      onSuccess: () => message.success('Task deleted successfully'),
      onError: (err) => message.error(err.message),
    });
  };

  const handleDeleteAll = async () => {
    deleteAllMutation.mutate(null, {
      onSuccess: () => message.success('All tasks deleted successfully'),
      onError: (err) => message.error(err.message),
    });
  };

  return (
    <Layout>
      <Header style={{ backgroundColor: 'white' }}>
        <Navbar />
      </Header>
      <Content style={{ padding: '20px' }}>
        {error && (
          <Alert
            message={error.message}
            type="error"
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        <Flex justify="space-between" style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Add Task
          </Button>
          <Popconfirm
            title="Delete all tasks?"
            description="Are you sure to delete all the tasks, this action cannot be undone!"
            onConfirm={handleDeleteAll}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" size="large" danger icon={<ClearOutlined />}>
              Clear All
            </Button>
          </Popconfirm>
        </Flex>

        <Spin spinning={isLoading}>
          <TaskList
            tasks={tasks || []}
            onClickEdit={handleEdit}
            onClickDelete={handleDelete}
          />
        </Spin>
        <Modal
          title={currentTask ? 'Edit Task' : 'Add Task'}
          open={isModalVisible}
          onCancel={resetView}
          footer={null}
        >
          <TaskForm
            selectedTask={currentTask}
            onSubmit={handleSubmit}
            isModalOpen={isModalVisible}
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default TaskApp;
