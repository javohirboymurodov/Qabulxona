import React, { useEffect } from 'react';
import { Modal, Form, Select, TimePicker, Button, message, Card } from 'antd'; // Card qo'shildi
import dayjs from 'dayjs';
import { addToReception, updateReceptionEmployee } from '../../services/api';

const { Option } = Select;

const AddReceptionModal = ({ 
  visible, 
  onClose, 
  onSave, 
  employees = [], 
  preSelectedEmployees = [],
  defaultDate,
  initialData = null // Edit mode uchun
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      form.resetFields();
      
      if (initialData) {
        // Edit mode - mavjud ma'lumotlarni yuklash
        console.log('Edit mode - initialData:', initialData);
        
        // Vaqtni aniqlash - prioritet tartibida
        let timeToSet = dayjs().add(1, 'hour'); // Fallback
        
        console.log('=== Time detection ===');
        console.log('initialData fields:', {
          scheduledTime: initialData.scheduledTime,
          time: initialData.time,
          timeUpdated: initialData.timeUpdated,
          allFields: Object.keys(initialData)
        });
        
        if (initialData.scheduledTime) {
          timeToSet = dayjs(initialData.scheduledTime, 'HH:mm');
          console.log('✅ Using scheduledTime:', initialData.scheduledTime);
        } else if (initialData.time) {
          // time field'i string formatda bo'lishi mumkin (HH:mm)
          if (typeof initialData.time === 'string') {
            timeToSet = dayjs(initialData.time, 'HH:mm');
          } else {
            timeToSet = dayjs(initialData.time);
          }
          console.log('✅ Using time:', initialData.time);
        } else if (initialData.timeUpdated) {
          timeToSet = dayjs(initialData.timeUpdated);
          console.log('✅ Using timeUpdated:', initialData.timeUpdated);
        } else {
          console.log('⚠️ Using fallback time (current + 1 hour)');
        }
        
        console.log('Final time set:', timeToSet.format('HH:mm'));
        
        form.setFieldsValue({
          selectedEmployee: initialData.employeeId,
          time: timeToSet
        });
      } else {
        // Add mode - bir soat keyin ko'rsatish (qabul uchun mantiqiy)
        form.setFieldsValue({
          time: dayjs().add(1, 'hour'),
          // Agar preSelected employee bor bo'lsa, birinchisini tanlash
          selectedEmployee: preSelectedEmployees.length > 0 ? preSelectedEmployees[0]._id : undefined
        });
      }
    }
  }, [visible, form, preSelectedEmployees, initialData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const selectedEmployee = employees.find(emp => emp._id === values.selectedEmployee);
      
      console.log('=== AddReceptionModal Submit ===');
      console.log('Context check:', {
        defaultDate,
        onSave: !!onSave,
        isDailyPlanContext: defaultDate && onSave && typeof onSave === 'function',
        isEditMode: !!initialData
      });
      
      if (!selectedEmployee) {
        throw new Error('Ходим топільмади');
      }

      // Context'larni aniqlash
      const isEditMode = !!initialData;
      const isDailyPlanContext = defaultDate && onSave && typeof onSave === 'function';
      
      // Vaqt cheklovini tekshirish - faqat yangi qabul qo'shishda va vaqt o'zgartirishda
      if (!isDailyPlanContext) { // HomePage context - API ga yuborish
        const now = dayjs();
        const scheduledTime = values.time;
        const timeDiff = scheduledTime.diff(now, 'hour', true);
        
        // O'tgan kunlarni tahrirlab bo'lmaydi
        if (scheduledTime.isBefore(now, 'day')) {
          messageApi.error('Ўтган кунларни таҳрирлаб бўлмайди');
          setLoading(false);
          return;
        }
        
        // Bugungi kun uchun - eng kamida 1 soat qolganda qo'shish/o'zgartirish mumkin
        if (scheduledTime.isSame(now, 'day') && timeDiff < 1) {
          messageApi.error('Қабул вақтига камida 1 соат қолганда қўшиб/ўзгартириб бўлмайди');
          setLoading(false);
          return;
        }
      }
      
      if (isEditMode) {
        console.log('Edit context: updating reception');
        // Edit mode - mavjud reception'ni yangilash
        const updateData = {
          scheduledTime: values.time.format('HH:mm') // Asosiy qabul vaqti
        };
        
        // Agar yangi employee tanlangan bo'lsa, uni ham yangilaymiz
        if (selectedEmployee._id !== initialData.employeeId) {
          updateData.name = selectedEmployee.fullName || selectedEmployee.name;
          updateData.position = selectedEmployee.position;
          updateData.department = selectedEmployee.department;
          updateData.phone = selectedEmployee.phone || '';
        }
        
        await updateReceptionEmployee(
          initialData.employeeId, 
          updateData, 
          initialData.date || dayjs().format('YYYY-MM-DD')
        );
        
        messageApi.success({
          content: 'Қабул маълумотлари муваффақиятли янгиланди',
          duration: 3
        });
        
        if (onSave && typeof onSave === 'function') {
          onSave({
            employee: selectedEmployee,
            time: values.time.format('HH:mm'),
            updated: true
          });
        }
        
        // Edit mode'da modal'ni yopish va ma'lumotlarni yangilash
        onClose(true); // true - yangilanish bo'ldi
      } else if (isDailyPlanContext) {
        console.log('DailyPlan context: calling onSave callback');
        // DailyPlan dan chaqirilsa - faqat callback (API chaqirmaslik)
        const receptionData = {
          employee: selectedEmployee,
          time: values.time.format('HH:mm'),
          data: {
            employeeId: selectedEmployee._id,
            name: selectedEmployee.fullName || selectedEmployee.name,
            position: selectedEmployee.position,
            department: selectedEmployee.department,
            phone: selectedEmployee.phone || '',
            status: 'waiting',
            date: defaultDate
          }
        };

        onSave(receptionData);
        
        messageApi.success({
          content: `${selectedEmployee.fullName || selectedEmployee.name} кунлик режага қўшилди`,
          duration: 3
        });
      } else {
        console.log('HomePage context: calling API');
        // HomePage dan chaqirilsa - API ga yuborish
        const receptionApiData = {
          employeeId: selectedEmployee._id,
          name: selectedEmployee.fullName || selectedEmployee.name,
          position: selectedEmployee.position,
          department: selectedEmployee.department,
          phone: selectedEmployee.phone || '',
          status: 'waiting',
          scheduledTime: values.time ? values.time.format('HH:mm') : dayjs().format('HH:mm'), // Asosiy qabul vaqti (xodim keladigan vaqt)
          date: dayjs().format('YYYY-MM-DD')
        };

        console.log('API call with data:', receptionApiData);
        
        const result = await addToReception(receptionApiData);
        console.log('API response:', result);

        messageApi.success({
          content: `${selectedEmployee.fullName || selectedEmployee.name} бугунги қабулга қўшилди`,
          duration: 3
        });

        // HomePage callback (agar mavjud bo'lsa)
        if (onSave && typeof onSave === 'function') {
          console.log('Calling HomePage onSave callback');
          onSave({
            employee: selectedEmployee,
            time: values.time.format('HH:mm')
          });
        }
      }
      
      onClose(true);
    } catch (error) {
      console.error('Reception add error:', error);
      messageApi.error({
        content: error.message || 'Қабулга қўшишда хатолик',
        duration: 3
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialData ? "Қабул маълумотларини таҳрирлаш" : "Рахбар қабулига қўшиш"}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose(false)}
      okText={initialData ? "Янгилаш" : "Қўшиш"}
      cancelText="Орқага"
      width={600}
      confirmLoading={loading}
      style={{ top: 100 }}
      zIndex={2000}
      destroyOnHidden
      maskClosable={false}
    >
      {contextHolder}
      
      <Card size="small" style={{ border: 'none' }}>
        <Form
          form={form}
          layout="vertical"
          name="addReceptionForm"
        >
          <Form.Item
            name="selectedEmployee"
            label="Ходимни танланг"
            rules={[{ required: true, message: 'Ходимни танланг' }]}
          >
            <Select
              placeholder="Ходимни танланг"
              style={{ width: '100%' }}
              size="large"
              allowClear
              showSearch
              filterOption={(input, option) => {
                const employee = employees.find(emp => emp._id === option.value);
                if (!employee) return false;
                
                const searchText = input.toLowerCase();
                return (
                  (employee.fullName || employee.name)?.toLowerCase().includes(searchText) ||
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
                  label={`${employee.fullName || employee.name} - ${employee.position}`}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {employee.fullName || employee.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {employee.position} • {employee.department}
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Tanlangan ходим preview */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
            prevValues.selectedEmployee !== currentValues.selectedEmployee
          }>
            {({ getFieldValue }) => {
              const selectedId = getFieldValue('selectedEmployee');
              const selectedEmployee = employees.find(emp => emp._id === selectedId);
              
              return selectedEmployee ? (
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
                    Танланган ходим:
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    borderRadius: 4,
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {selectedEmployee.fullName || selectedEmployee.name} - {selectedEmployee.position}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: 4 
                  }}>
                    {selectedEmployee.department}
                  </div>
                </div>
              ) : null;
            }}
          </Form.Item>

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
              minuteStep={10} // 15 daqiqalik qadamlar
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
          <strong>Эслатма:</strong> {defaultDate 
            ? `Ходим ${defaultDate} санасидаги кунлик режага қўшилади.`
            : 'Ходим "Бугунги Раҳбар Қабули" рўйхатига қўшилади.'
          } Топшириқ бериш ходим келганда амалга оширилади.
        </div>
      </Card>
    </Modal>
  );
};

export default AddReceptionModal;