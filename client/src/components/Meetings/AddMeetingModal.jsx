import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, message, Select, Card } from 'antd';
import { createMeeting, updateMeeting } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const AddMeetingModal = ({ 
  visible, 
  onClose, 
  onSave, 
  employees = [], 
  initialData, 
  preSelectedEmployees = [],
  defaultDate // Yangi prop - tanlangan sana
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Edit mode
        form.setFieldsValue({
          name: initialData.name,
          description: initialData.description || '',
          date: dayjs(initialData.date),
          time: dayjs(initialData.time, 'HH:mm'),
          location: initialData.location || '',
          participants: initialData.participants?.map(p => p._id || p)
        });
      } else {
        // Create mode
        form.resetFields();
        const defaultValues = {
          participants: preSelectedEmployees,
          time: dayjs('10:00', 'HH:mm') // Default vaqt
        };
        
        // Agar defaultDate berilgan bo'lsa
        if (defaultDate) {
          defaultValues.date = dayjs(defaultDate);
        }
        
        form.setFieldsValue(defaultValues);
      }
    }
  }, [visible, initialData, form, preSelectedEmployees, defaultDate]);

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

      // onSave callback chaqirish - meeting data билан
      if (onSave) {
        onSave(meetingData);
      }
      
      onClose(true);
    } catch (error) {
      if (error.errorFields) {
        messageApi.error("Илтимос, барча майдонларни тўлдиринг");
      } else {
        console.error('Форма валидатсиясида хатолик:', error);
        messageApi.error('Хатолик юз берди');
      }
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
      width={800}
      confirmLoading={loading}
      style={{ top: 50 }}
      styles={{ 
        body: { padding: '24px' }
      }}
      zIndex={2000}
      destroyOnHidden
      mask={true}
      maskClosable={false}
    >
      {contextHolder}
      
      <Card size="small" style={{ border: 'none' }}>
        <Form
          form={form}
          layout="vertical"
          name="addMeetingForm"
          style={{ maxWidth: '100%' }}
        >
          <Form.Item
            name="name"
            label="Мажлис номи"
            rules={[{ required: true, message: 'Мажлис номини киритинг' }]}
          >
            <Input 
              placeholder="Мажлис номини киритинг"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Тафсилот"
          >
            <TextArea
              rows={4}
              placeholder="Мажлис ҳақида тафсилот"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="date"
              label="Сана"
              rules={[{ required: true, message: 'Санани танланг' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                format="DD.MM.YYYY"
                placeholder="Санани танланг"
              />
            </Form.Item>

            <Form.Item
              name="time"
              label="Вақти"
              rules={[{ required: true, message: 'Вақтни киритинг' }]}
            >
              <TimePicker
                style={{ width: '100%' }}
                size="large"
                format="HH:mm"
                placeholder="Вақтни танланг"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="location"
            label="Жой"
          >
            <Input 
              placeholder="Мажлис ўтказиладиган жой"
              size="large"
            />
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
              size="large"
              allowClear
              showSearch
              filterOption={(input, option) => {
                const employee = employees.find(emp => emp._id === option.value);
                if (!employee) return false;
                
                const searchText = input.toLowerCase();
                return (
                  employee.name?.toLowerCase().includes(searchText) ||
                  employee.position?.toLowerCase().includes(searchText) ||
                  employee.department?.toLowerCase().includes(searchText)
                );
              }}
              optionLabelProp="label"
            >
              {employees.map(employee => (
                <Option 
                  key={employee._id} 
                  value={employee._id}
                  label={`${employee.name} - ${employee.position}`}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{employee.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {employee.position} • {employee.department}
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Tanlangan ishtirokchilar preview */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
            prevValues.participants !== currentValues.participants
          }>
            {({ getFieldValue }) => {
              const selectedIds = getFieldValue('participants') || [];
              const selectedEmployees = employees.filter(emp => 
                selectedIds.includes(emp._id)
              );
              
              return selectedEmployees.length > 0 ? (
                <div style={{ 
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: '#f6f8fa',
                  borderRadius: 6,
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666', 
                    marginBottom: 8,
                    fontWeight: 500
                  }}>
                    Танланган иштирокчилар ({selectedEmployees.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedEmployees.map(emp => (
                      <div key={emp._id} style={{
                        padding: '4px 8px',
                        backgroundColor: '#1890ff',
                        color: 'white',
                        borderRadius: 4,
                        fontSize: '12px'
                      }}>
                        {emp.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};

export default AddMeetingModal;