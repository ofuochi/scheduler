import 'react-js-cron/dist/styles.css';

import { Button, DatePicker, Form, Input, Switch } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Cron } from 'react-js-cron';

import { Task } from '../types';

const { Item } = Form;

interface TaskFormProps {
  selectedTask?: Task;
  onSubmit: (task: Task) => void;
  isModalOpen: boolean;
}

const ONCE_EVERY_MIN = '* * * * *';

const TaskForm: React.FC<TaskFormProps> = ({
  selectedTask,
  isModalOpen,
  onSubmit,
}) => {
  const [form] = Form.useForm<Task>();
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  useEffect(() => {
    if (isModalOpen) {
      setIsRecurring(!!selectedTask?.isRecurring);
      form.setFieldsValue({
        ...selectedTask,
        isRecurring: !!selectedTask?.isRecurring,
        frequency: selectedTask?.frequency || '',
        runAt: selectedTask?.runAt && moment(selectedTask.runAt),
      });
    } else {
      form.resetFields();
      setIsRecurring(false);
    }
  }, [isModalOpen, selectedTask, form]);

  const handleFinish = async (values: any) => {
    values.isRecurring = isRecurring;

    // If task is recurring and frequency is not set, default to once every minute
    if (isRecurring && !values.frequency) values.frequency = ONCE_EVERY_MIN;

    onSubmit(values);
    form.resetFields();
    setIsRecurring(false); // Reset isRecurring state after submission
  };

  const validateRunAt = () => ({
    validator(_: any, value: moment.Moment) {
      if (
        !isRecurring &&
        value &&
        value.isBefore(moment().add(15, 'minutes'))
      ) {
        return Promise.reject(
          new Error('Run At must be at least 15 minutes from now')
        );
      }
      return Promise.resolve();
    },
  });

  return (
    <Form form={form} onFinish={handleFinish} layout="vertical">
      <Item
        name="title"
        label="Title"
        rules={[{ required: true, message: 'Title is required' }]}
      >
        <Input placeholder="Title" />
      </Item>
      <Item name="isRecurring" valuePropName="checked" label="Type of Task">
        <Switch
          checkedChildren="Recurring"
          unCheckedChildren="One-time"
          onChange={setIsRecurring}
        />
      </Item>
      {!isRecurring && (
        <Item
          name="runAt"
          label="Run At"
          rules={[
            {
              required: true,
              message: 'Run At is required for one-time tasks',
            },
            validateRunAt,
          ]}
        >
          <DatePicker showTime />
        </Item>
      )}
      {isRecurring && (
        <Item label="Frequency" name="frequency" required>
          <Cron
            allowEmpty="for-default-value"
            defaultPeriod="day"
            value={form.getFieldValue('frequency')}
            setValue={(v: string) => form.setFieldsValue({ frequency: v })}
            clearButtonProps={{ type: 'dashed', danger: false }}
          />
        </Item>
      )}
      <Button type="primary" htmlType="submit">
        Save
      </Button>
    </Form>
  );
};

export default TaskForm;
