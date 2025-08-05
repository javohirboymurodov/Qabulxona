import React, { useEffect } from 'react';
import { Modal, Form, TimePicker, message } from 'antd';
import { addToReception } from '../../services/api';
import dayjs from 'dayjs';

const AddReceptionModal = ({ 
  visible, 
  onClose, 
  onSave, 
  employees = [], 
  preSelectedEmployees = [],
  defaultDate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      form.resetFields();
      
      // Default vaqt - hozirgi vaqtdan 1 soat keyin
      form.setFieldsValue({
        time: dayjs().add(1, 'hour')
      });
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Har bir tanlangan xodim uchun reception ga qo'shish
      const receptionPromises = preSelectedEmployees.map(async (employee) => {
        const receptionData = {
          employeeId: employee._id,
          name: employee.fullName || employee.name,
          position: employee.position,
          department: employee.department,
          phone: employee.phone || '',
          status: 'waiting', // Default holat - kutilmoqda
          scheduledTime: values.time.format('HH:mm') // Faqat vaqt
        };

        return addToReception(receptionData);
      });

      await Promise.all(receptionPromises);

      messageApi.success({
        content: `${preSelectedEmployees.length} та ходим рахбар қабулига қўшилди`,
        duration: 3
      });

      // onSave callback chaqirish
      if (onSave) {
        onSave({
          employees: preSelectedEmployees,
          time: values.time.format('HH:mm')
        });
      }
      
      onClose(true); // success = true
    } catch (error) {
      console.error('Reception add error:', error);
      messageApi.error({
        content: 'Рахбар қабулига қўшишда хатолик юз берди',
        duration: 3
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Рахбар қабулига қўшиш"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose(false)}
      okText="Қўшиш"
      cancelText="Орқага"
      width={500}
      confirmLoading={loading}
      style={{ top: 100 }}
      zIndex={2000}
      destroyOnHidden
      maskClosable={false}
    >
      {contextHolder}
      
      <div style={{ marginBottom: 16 }}>
        <strong>Танланган ходимлар ({preSelectedEmployees.length}):</strong>
        <div style={{ 
          marginTop: 8,
          padding: 12,
          backgroundColor: '#f6f8fa',
          borderRadius: 6,
          border: '1px solid #e8e8e8'
        }}>
          {preSelectedEmployees.map((emp, index) => (
            <div key={emp._id} style={{ 
              marginBottom: index < preSelectedEmployees.length - 1 ? 4 : 0,
              fontSize: '14px'
            }}>
              • {emp.fullName || emp.name} - {emp.position}
            </div>
          ))}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        name="addReceptionForm"
      >
        <Form.Item
          name="time"
          label="Қабул вақти"
          rules={[{ required: true, message: 'Вақтни танланг' }]}
        >
          <TimePicker
            style={{ width: '100%' }}
            size="large"
            format="HH:mm"
            placeholder="Вақтни танланг"
            minuteStep={15} // 15 daqiqalik qadamlar
          />
        </Form.Item>
      </Form>

      <div style={{ 
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fff7e6',
        borderRadius: 6,
        border: '1px solid #ffd591',
        fontSize: '13px',
        color: '#8c4b00'
      }}>
        <strong>Эслатма:</strong> Ходимлар "Бугунги Раҳбар Қабули" рўйхатига қўшилади. 
        Топшириқ бериш ходим келганда амалга оширилади.
      </div>
    </Modal>
  );
};

export default AddReceptionModal;