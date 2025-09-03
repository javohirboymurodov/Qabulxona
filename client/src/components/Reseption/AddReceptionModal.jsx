import React, { useEffect } from 'react';
import { Modal, Form, Select, TimePicker, Button, message, Card } from 'antd'; // Card qo'shildi
import dayjs from 'dayjs';
import { addToReception } from '../../services/api';

const { Option } = Select;

const AddReceptionModal = ({ 
  visible, 
  onClose, 
  onSave, 
  employees = [], 
  preSelectedEmployees = [],
  defaultDate,
  initialData // Edit mode uchun
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Edit mode - form'ni initial data bilan to'ldirish
        console.log('Edit mode - initialData:', initialData);
        
        // Time field'ni to'g'ri aniqlash
        console.log('Time detection:', {
          scheduledTime: initialData.scheduledTime,
          time: initialData.time,
          timeUpdated: initialData.timeUpdated
        });
        
        let timeValue;
        if (initialData.scheduledTime) {
          console.log('Using scheduledTime:', initialData.scheduledTime);
          timeValue = dayjs(initialData.scheduledTime, 'HH:mm');
        } else if (initialData.time) {
          console.log('Using time:', initialData.time);
          timeValue = dayjs(initialData.time, 'HH:mm');
        } else if (initialData.timeUpdated) {
          console.log('Using timeUpdated:', initialData.timeUpdated);
          timeValue = dayjs(initialData.timeUpdated);
        } else {
          console.log('Using fallback: current + 1 hour');
          timeValue = dayjs().add(1, 'hour'); // Fallback
        }
        
        form.setFieldsValue({
          selectedEmployee: initialData.employeeId,
          time: timeValue
        });
      } else {
        // Create mode
        form.resetFields();
        form.setFieldsValue({
          time: dayjs().add(1, 'hour'),
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
        isDailyPlanContext: defaultDate && onSave && typeof onSave === 'function'
      });
      
      if (!selectedEmployee) {
        throw new Error('Ходим топільмади');
      }

      // DailyPlan context'ini aniqroq aniqlash
      // DefaultDate mavjud VA onSave funksiya bo'lsa - DailyPlan context
      const isDailyPlanContext = defaultDate && onSave && typeof onSave === 'function';
      
      if (isDailyPlanContext) {
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
          content: initialData 
            ? `${selectedEmployee.fullName || selectedEmployee.name} қабули янгиланди`
            : `${selectedEmployee.fullName || selectedEmployee.name} кунлик режага қўшилди`,
          duration: 3
        });
      } else {
        console.log(initialData ? 'Edit context: updating reception' : 'HomePage context: calling API');
        
        if (initialData) {
          // Edit mode - reception'ni yangilash
          const updateData = {
            employeeId: selectedEmployee._id,
            name: selectedEmployee.fullName || selectedEmployee.name,
            position: selectedEmployee.position,
            department: selectedEmployee.department,
            phone: selectedEmployee.phone || '',
            status: initialData.status || 'waiting',
            time: values.time.format('HH:mm'),
            date: defaultDate ? defaultDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
          };
          
          console.log('Updating reception with data:', updateData);
          
          // Hozircha faqat success message (real API keyinroq)
          messageApi.success('Қабул муваффақиятли янгиланди');
          onClose(true);
          return;
        }
        
        // HomePage dan chaqirilsa - API ga yuborish
        const receptionApiData = {
          employeeId: selectedEmployee._id,
          name: selectedEmployee.fullName || selectedEmployee.name,
          position: selectedEmployee.position,
          department: selectedEmployee.department,
          phone: selectedEmployee.phone || '',
          status: 'waiting',
          time: values.time ? values.time.format('HH:mm') : dayjs().format('HH:mm'),
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
      title={initialData ? "Қабулни таҳрирлаш" : "Рахбар қабулига қўшиш"}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose(false)}
      okText={initialData ? "Сақлаш" : "Қўшиш"}
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