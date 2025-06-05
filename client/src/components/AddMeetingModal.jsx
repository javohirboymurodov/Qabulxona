import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, message } from 'antd';
import { createMeeting, updateMeeting } from '../services/api';
import SearchableEmployeeList from './SearchableEmployeeList';
import dayjs from 'dayjs';

const AddMeetingModal = ({ visible, onClose, initialData, preSelectedEmployees = [], employees = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Populate form with initial data
        form.setFieldsValue({
          name: initialData.name,
          date: dayjs(initialData.date),
          time: dayjs(initialData.time, 'HH:mm'),
          participants: initialData.participants?.map(p => p._id)
        });
      } else {
        // Reset form and set preselected employees when opening for new meeting
        form.resetFields();
        if (preSelectedEmployees.length > 0) {
          form.setFieldsValue({
            participants: preSelectedEmployees
          });
        }
      }
    }
  }, [visible, initialData, form, preSelectedEmployees]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const meetingData = {
        name: values.name,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        participants: values.participants || []
      };

      if (initialData) {
        await updateMeeting(initialData._id, meetingData);
        messageApi.success('Majlis muvaffaqiyatli yangilandi');
      } else {
        await createMeeting(meetingData);
        messageApi.success('Yangi majlis muvaffaqiyatli yaratildi');
      }

      onClose(true);
    } catch (error) {
      if (!error.isAxiosError) {
        console.error('Forma validatsiyasida xatolik:', error);
      }
      messageApi.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialData ? "Мажлисни таҳрирлаш" : "Янги мажлис қўшиш"}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose(false)}
      okText={initialData ? "Сақлаш" : "Қўшиш"}
      cancelText="Бекор қилиш"
      width={600}
      confirmLoading={loading}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        name="addMeetingForm"
        initialValues={{
          participants: []
        }}
      >
        <Form.Item
          name="name"
          label="Мажлис номи"
          rules={[{ required: true, message: 'Мажлис номини киритинг' }]}
        >
          <Input placeholder="Мажлис номини киритинг" />
        </Form.Item>

        <Form.Item
          name="date"
          label="Сана"
          rules={[{ required: true, message: 'Санани танланг' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder="Сана"
          />
        </Form.Item>

        <Form.Item
          name="time"
          label="Вақти"
          rules={[{ required: true, message: 'Вақтни киритинг' }]}
        >
          <TimePicker
            style={{ width: '100%' }}
            format="HH:mm"
            placeholder="Вақтни танланг"
          />
        </Form.Item>
        <Form.Item
          name="participants"
          label="Иштирокчилар"
          rules={[{ required: true, message: 'Камида битта иштирокчи танланг' }]}
        >
          <SearchableEmployeeList 
            mode="multiple"
            employeeOptions={employees}
            placeholder="Иштирокчиларни танланг"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMeetingModal;