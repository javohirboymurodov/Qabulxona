import React from 'react';
import { Modal, Form, Input, Select, App } from 'antd';
import { createAdmin, updateAdmin } from '../../services/api';

const AddAdminModal = ({ visible, onClose, onSuccess, editingAdmin }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm(); // Form instance yaratish

  // Form ni tozalash va boshlang'ich qiymatlarni o'rnatish
  React.useEffect(() => {
    if (visible) {
      if (editingAdmin) {
        form.setFieldsValue({
          username: editingAdmin.username,
          fullName: editingAdmin.fullName,
          role: editingAdmin.role || 'admin'
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingAdmin, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAdmin) {
        await updateAdmin(editingAdmin._id, values);
        message.success('Админ маълумотлари янгиланди');
      } else {
        await createAdmin(values);
        message.success('Янги админ қўшилди');
      }
      
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Хатолик юз берди');
    }
  };

  return (
    <Modal
      title={editingAdmin ? 'Админни таҳрирлаш' : 'Янги админ қўшиш'}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleSubmit}
      okText={editingAdmin ? 'Сақлаш' : 'Қўшиш'}
      cancelText="Бекор қилиш"
    >
      <Form 
        form={form} // Add form prop here
        layout="vertical"
        initialValues={{
          role: 'admin' // Default role
        }}
      >
        <Form.Item
          name="username"
          label="Логин"
          rules={[{ required: true, message: 'Логинни киритинг' }]}
        >
          <Input />
        </Form.Item>

        {!editingAdmin && (
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Паролни киритинг' }]}
          >
            <Input.Password />
          </Form.Item>
        )}

        <Form.Item
          name="fullName"
          label="Тўлиқ исми"
          rules={[{ required: true, message: 'Тўлиқ исмни киритинг' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="role"
          label="Роль"
          rules={[{ required: true, message: 'Рольни танланг' }]}
        >
          <Select>
            <Select.Option value="admin">Админ</Select.Option>
            <Select.Option value="super_admin">Супер админ</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAdminModal;