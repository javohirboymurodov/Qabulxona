import React from 'react';
import { Modal, Form, Input, InputNumber, Button } from 'antd';

const TaskAssignmentModal = ({ visible, onClose, onSave, employeeName }) => {
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Топшириқ бериш - ${employeeName || 'Ходим'}`}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Бекор қилиш
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Сақлаш
        </Button>
      ]}
      destroyOnHidden // Modal yopilganda form'ni tozalash
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label="Топшириқ тавсифи"
          rules={[{ required: true, message: 'Топшириқ тавсифини киритинг!' }]}
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Топшириқ тавсифини киритинг..." 
            maxLength={500}
            showCount
          />
        </Form.Item>
        
        <Form.Item
          name="deadline"
          label="Муддат (кунларда)"
          rules={[
            { required: true, message: 'Муддатни киритинг!' },
            { type: 'number', min: 1, max: 365, message: '1 дан 365 кунгача бўлиши керак!' }
          ]}
        >
          <InputNumber
            min={1}
            max={365}
            placeholder="Кунлар сони"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskAssignmentModal;