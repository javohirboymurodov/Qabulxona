import React from 'react';
import { Modal, Form, Input, TimePicker, Select, App } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskModal = ({ 
  visible, 
  onClose, 
  onSave, 
  defaultDate 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { message: messageApi } = App.useApp();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      console.log('=== TaskModal Submit ===');
      console.log('Form values:', values);

      const isDailyPlanContext = defaultDate && onSave;

      if (isDailyPlanContext) {
        console.log('DailyPlan context: saving task');
        
        const taskData = {
          time: values.time.format('HH:mm'),
          data: {
            title: values.title,
            description: values.description,
            priority: values.priority || 'normal',
            status: 'pending'
          }
        };

        console.log('Calling onSave with task data:', taskData);
        onSave(taskData);
        
        messageApi.success('Вазифа кунлик режага қўшилди');
      }
      
      onClose(true);
    } catch (error) {
      console.error('Task add error:', error);
      messageApi.error('Вазифа қўшишда хатолик');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Вазифа қўшиш"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose(false)}
      confirmLoading={loading}
      okText="Сақлаш"
      cancelText="Бекор қилиш"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Вазифа номи"
          rules={[{ required: true, message: 'Вазифа номини киритинг' }]}
        >
          <Input placeholder="Вазифа номини киритинг" />
        </Form.Item>

        <Form.Item
          name="time"
          label="Вақт"
          rules={[{ required: true, message: 'Вақтни танланг' }]}
          initialValue={dayjs('09:00', 'HH:mm')}
        >
          <TimePicker
            format="HH:mm"
            style={{ width: '100%' }}
            placeholder="Вақтни танланг"
          />
        </Form.Item>

        <Form.Item 
          name="priority" 
          label="Муҳимлик даражаси" 
          initialValue="normal"
        >
          <Select>
            <Option value="low">Паст</Option>
            <Option value="normal">Оддий</Option>
            <Option value="high">Муҳим</Option>
            <Option value="urgent">Шошилинч</Option>
          </Select>
        </Form.Item>

        <Form.Item name="description" label="Тавсиф">
          <TextArea
            rows={3}
            placeholder="Вазифа тавсифини киритинг"
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskModal;