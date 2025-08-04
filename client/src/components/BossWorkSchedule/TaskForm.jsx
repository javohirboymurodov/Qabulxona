import React from 'react';
import { Form, Input, TimePicker, Button, Card, List, Tag, Select, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskForm = ({ tasks, onAddTask, onRemoveTask }) => {
  const [form] = Form.useForm();

  const handleAddTask = () => {
    form.validateFields().then(values => {
      const newTask = {
        title: values.taskTitle,
        description: values.taskDescription,
        startTime: values.taskTime[0].format('HH:mm'),
        endTime: values.taskTime[1].format('HH:mm'),
        priority: values.priority || 'normal',
        status: 'pending'
      };
      onAddTask(newTask);
      form.resetFields();
    }).catch(error => {
      console.error('Form validation error:', error);
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'low': return 'default';
      default: return 'blue';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'Шошилинч';
      case 'high': return 'Муҳим';
      case 'low': return 'Паст';
      default: return 'Оддий';
    }
  };

  return (
    <div>
      <Card title="Янги вазифа қўшиш" size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="taskTitle"
            label="Вазифа номи"
            rules={[{ required: true, message: 'Вазифа номини киритинг' }]}
          >
            <Input placeholder="Вазифа номини киритинг" />
          </Form.Item>

          <Form.Item
            name="taskTime"
            label="Вақт ораликци"
            rules={[{ required: true, message: 'Вақт ораликцини танланг' }]}
          >
            <TimePicker.RangePicker
              format="HH:mm"
              style={{ width: '100%' }}
              placeholder={['Бошланиш вақти', 'Тугаш вақти']}
            />
          </Form.Item>

          <Form.Item name="priority" label="Муҳимлик даражаси" initialValue="normal">
            <Select placeholder="Муҳимлик даражасини танланг">
              <Option value="low">Паст</Option>
              <Option value="normal">Оддий</Option>
              <Option value="high">Муҳим</Option>
              <Option value="urgent">Шошилинч</Option>
            </Select>
          </Form.Item>

          <Form.Item name="taskDescription" label="Тавсиф">
            <TextArea
              rows={3}
              placeholder="Вазифа тавсифини киритинг"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddTask}
            block
            size="large"
          >
            Вазифа қўшиш
          </Button>
        </Form>
      </Card>

      <Divider orientation="left">
        Қўшилган вазифалар ({tasks.length})
      </Divider>

      {tasks.length > 0 ? (
        <List
          dataSource={tasks}
          renderItem={(task, index) => (
            <List.Item style={{ padding: '12px 0' }}>
              <Card
                size="small"
                style={{ width: '100%' }}
                styles={{
                  body: { padding: '12px 16px' }
                }}

              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Vaqt va prioritet */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <CalendarOutlined style={{ color: '#1890ff' }} />
                      <strong style={{ color: '#1890ff' }}>
                        {task.startTime} - {task.endTime}
                      </strong>
                      <Tag color={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Tag>
                    </div>

                    {/* Sarlavha */}
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: 4,
                      color: '#262626'
                    }}>
                      {task.title}
                    </div>

                    {/* Tavsif */}
                    {task.description && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        lineHeight: 1.4
                      }}>
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* O'chirish tugmasi */}
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveTask(task.id)}
                    style={{ marginLeft: 8 }}
                  />
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
          backgroundColor: '#fafafa',
          borderRadius: '6px'
        }}>
          Ҳозирча вазифалар қўшилмаган
        </div>
      )}
    </div>
  );
};

export default TaskForm;