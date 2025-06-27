import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, message, Select } from 'antd';
import { createMeeting, updateMeeting } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const AddMeetingModal = ({ visible, onClose, onSave, employees, initialData, preSelectedEmployees = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Populate form with initial data for editing
        form.setFieldsValue({
          name: initialData.name,
          description: initialData.description || '',
          date: dayjs(initialData.date),
          time: dayjs(initialData.time, 'HH:mm'),
          location: initialData.location || '',
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
        description: values.description || '',
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        location: values.location || '',
        participants: values.participants || []
      };

      if (initialData) {
        await updateMeeting(initialData._id, meetingData);
        messageApi.success('Мажлис муваффақиятли янгиланди');
      } else {
        await createMeeting(meetingData);
        messageApi.success('Янги мажлис муваффақиятли яратилди');
      }

      onClose(true);
    } catch (error) {
      if (error.errorFields) {
        message.error("Илтимос, барча майдонларни тўлдиринг");
      } else {
        console.error('Форма валидатсиясида хатолик:', error);
      }
      messageApi.error('Хатолик юз берди');
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
      width={720}
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
          name="description"
          label="Тафсилот"
        >
          <TextArea
            rows={3}
            placeholder="Мажлис ҳақида тафсилот"
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="Сана"
          rules={[{ required: true, message: 'Санани танланг' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD.MM.YYYY"
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
          name="location"
          label="Жой"
        >
          <Input placeholder="Мажлис ўтказиладиган жой" />
        </Form.Item>

        <Form.Item
          name="participants"
          label="Иштирокчилар"
          rules={[{ required: true, message: 'Камида битта иштирокчи танланг' }]}
        >
          <Select
            mode="multiple"
            placeholder="Иштирокчиларни танланг"
            style={{ width: '100%' }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {employees.map(employee => (
              <Select.Option key={employee._id} value={employee._id}>
                {employee.fullName || employee.name} - {employee.position}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMeetingModal;