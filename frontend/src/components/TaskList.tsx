import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import cronstrue from 'cronstrue';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import { Task } from '../types';
import { useSocketTaskUpdate } from '../hooks/useSocketTaskUpdate';

interface TaskListProps {
  onClickEdit: (task: Task) => void;
  onClickDelete: (id: number) => Promise<void>;
  tasks: Task[];
}

const getColorConfig = (v: string) => {
  switch (v) {
    case 'completed':
      return {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: 'completed',
      };
    case 'failed':
      return { color: 'error', icon: <CloseCircleOutlined />, text: 'failed' };
    case 'processing':
      return {
        color: 'processing',
        icon: <SyncOutlined spin />,
        text: 'processing',
      };
    default:
      return {
        color: 'default',
        icon: <ClockCircleOutlined />,
        text: 'waiting',
      };
  }
};

const renderDateTime = (v?: Date) => v && moment(v).format('MMM Do YY, HH:mm');

const renderStatus = (v: string) => {
  const { color, icon, text } = getColorConfig(v);
  return (
    <Tag color={color} icon={icon}>
      {text}
    </Tag>
  );
};

const TaskList: React.FC<TaskListProps> = ({
  onClickEdit,
  onClickDelete,
  tasks,
}) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const updatedTask = useSocketTaskUpdate();

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!updatedTask) return;
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      )
    );
  }, [updatedTask]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Recurring',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      render: (v: boolean) => (v ? 'Yes' : 'No'),
    },
    {
      title: 'Attempts',
      dataIndex: 'attempts',
      key: 'attempts',
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (v?: string) => v && cronstrue.toString(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: renderStatus,
    },
    { title: 'Failed Reason', dataIndex: 'failedReason', key: 'failedReason' },

    {
      title: 'Next Run',
      dataIndex: 'runAt',
      key: 'runAt',
      render: renderDateTime,
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: renderDateTime,
    },
    {
      title: 'Created',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (v: Date) => moment(v).format('MMMM Do YYYY, HH:mm'),
    },

    {
      title: 'Actions',
      key: 'actions',
      render: (_: string, task: Task) => (
        <Space>
          <Button
            onClick={() => onClickEdit(task)}
            size="small"
            icon={<EditOutlined />}
            title="Edit"
            disabled={task.status === 'completed' && !task.isRecurring}
          />
          <Popconfirm
            title="Delete the task"
            description="Are you sure to delete this task?"
            onConfirm={() => onClickDelete(task.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteFilled />}
              size="small"
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table columns={columns} dataSource={localTasks} rowKey="id" size="small" />
  );
};

export default TaskList;
