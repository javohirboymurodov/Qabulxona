import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, message, Select, Card } from 'antd';
import { updateMeeting, addMeeting } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const AddMeetingModal = ({ 
  visible, 
  onClose, 
  onSave, 
  onSuccess,
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
          time: dayjs().add(1, 'hour') // Bir soat keyin (majlis uchun mantiqiy)
        };
        
        // Agar defaultDate berilgan bo'lsa
        if (defaultDate) {
          defaultValues.date = dayjs(defaultDate);
        }
        
        form.setFieldsValue(defaultValues);
      }
    }
  }, [visible, initialData, form, preSelectedEmployees, defaultDate]);

  // Form validation rules
  const validateMessages = {
    required: '${label} майдони тўлдирилиши шарт!',
    types: {
      email: '${label} нотўғри форматда!',
    },
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      console.log('=== AddMeetingModal Submit ===');
      console.log('Form values:', values);
      console.log('defaultDate:', defaultDate);
      console.log('onSave function exists:', !!onSave);

      const isDailyPlanContext = defaultDate && onSave;

      // Vaqt cheklovini tekshirish - faqat yangi majlis yaratishda va vaqt o'zgartirishda
      if (!isDailyPlanContext) { // HomePage context - API ga yuborish
        const now = dayjs();
        const meetingDateTime = dayjs(`${values.date.format('YYYY-MM-DD')} ${values.time.format('HH:mm')}`);
        const timeDiff = meetingDateTime.diff(now, 'hour', true);
        
        // O'tgan kunlarni tahrirlab bo'lmaydi
        if (meetingDateTime.isBefore(now, 'day')) {
          messageApi.error('Ўтган кунларни таҳрирлаб бўлмайди');
          setLoading(false);
          return;
        }
        
        // Bugungi kun uchun - eng kamida 1 soat qolganda yaratish/o'zgartirish mumkin
        if (meetingDateTime.isSame(now, 'day') && timeDiff < 1) {
          messageApi.error('Мажлис вақтига камida 1 соат қолганда яратиб/ўзгартириб бўлмайди');
          setLoading(false);
          return;
        }
      }

      if (isDailyPlanContext) {
        console.log('DailyPlan context: saving meeting');
        
        const meetingData = {
          time: values.time.format('HH:mm'),
          data: {
            name: values.name, // NAME QO'SHISH MUHIM!
            description: values.description || '',
            location: values.location || '',
            participants: values.participants || [],
            date: defaultDate
          }
        };

        console.log('=== MEETING DATA TO SAVE ===');
        console.log('Time:', meetingData.time);
        console.log('Name:', meetingData.data.name);
        console.log('Description:', meetingData.data.description);
        console.log('Location:', meetingData.data.location);
        console.log('Participants:', meetingData.data.participants);

        console.log('Calling onSave with meeting data:', meetingData);
        onSave(meetingData);
        
        messageApi.success({
          content: 'Мажлис кунлик режага қўшилди',
          duration: 3
        });
      } else {
        // HomePage yoki umumiy context
        const meetingApiData = {
          name: values.name,
          description: values.description,
          date: values.date.format('YYYY-MM-DD'),
          time: values.time.format('HH:mm'),
          location: values.location,
          participants: values.participants || []
        };

        if (initialData && initialData._id) {
          // UPDATE MODE
          console.log('Updating meeting:', initialData._id, meetingApiData);
          const result = await updateMeeting(initialData._id, meetingApiData);
          console.log('Meeting update response:', result);

          messageApi.success({
            content: 'Мажлис муваффақиятли таҳрирланди',
            duration: 3
          });
        } else {
          // CREATE MODE
          console.log('Creating meeting:', meetingApiData);
          const result = await addMeeting(meetingApiData);
          console.log('Meeting create response:', result);

          messageApi.success({
            content: 'Мажлис муваффақиятли сақланди',
            duration: 3
          });
        }

        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      }

      console.log('=== Modal closing ===');
      onClose(true);
    } catch (error) {
      console.error('=== Meeting add/update error ===', error);
      messageApi.error({
        content: error.message || 'Мажлисни сақлашда хатолик',
        duration: 3
      });
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
          validateMessages={validateMessages}
          initialValues={{
            date: defaultDate ? dayjs(defaultDate) : dayjs(),
            time: dayjs(),
            participants: preSelectedEmployees?.map(emp => emp._id) || []
          }}
          name="addMeetingForm"
          style={{ maxWidth: '100%' }}
        >
          <Form.Item
            name="name"
            label="Мажлис номи"
            rules={[{ required: true, message: 'Мажлис номини киритинг' }]}
          >
            <Input 
              placeholder="Мисол: Ҳафталик планерка"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Тафсилот"
            rules={[{ required: true, message: 'Мажлис тафсилотини киритинг' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Мажлис мавзуси ва кун тартиби"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Жой"
            rules={[{ required: true, message: 'Мажлис жойини киритинг' }]}
          >
            <Input 
              placeholder="Мисол: Мажлислар зали"
              size="large"
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