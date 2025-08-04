import React from 'react';
import { Button, Card, List, Avatar, Tag, Divider, Select, TimePicker, Form } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const ReceptionForm = ({ receptions, onAddReception, onRemoveReception, employees = [] }) => {
  const [form] = Form.useForm();

  const handleAddReception = () => {
    form.validateFields().then(values => {
      const selectedEmployee = employees.find(emp => emp._id === values.employeeId);

      if (!selectedEmployee) {
        console.error('Xodim topilmadi');
        return;
      }

      const newReception = {
        employeeId: selectedEmployee._id,
        name: selectedEmployee.name,
        position: selectedEmployee.position,
        department: selectedEmployee.department,
        phone: selectedEmployee.phone,
        time: values.receptionTime ? values.receptionTime.format('HH:mm') : '09:00',
        purpose: values.purpose || 'Рахбар қабули',
        status: 'waiting'
      };

      onAddReception(newReception);
      form.resetFields();
    }).catch(error => {
      console.error('Form validation error:', error);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'cancelled': return 'red';
      default: return 'orange';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Келди';
      case 'in-progress': return 'Жараёнда';
      case 'cancelled': return 'Бекор қилинди';
      default: return 'Кутмоқда';
    }
  };

  return (
    <div>
      <Card title="Рахбар қабулига қўшиш" size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="employeeId"
            label="Ходимни танланг"
            rules={[{ required: true, message: 'Ходимни танланг' }]}
          >
            <Select
              placeholder="Ходимни қидиринг ва танланг"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const employee = employees.find(emp => emp._id === option?.value);
                if (!employee) return false;

                const searchText = input.toLowerCase();
                return (
                  employee.name?.toLowerCase().includes(searchText) ||
                  employee.position?.toLowerCase().includes(searchText) ||
                  employee.department?.toLowerCase().includes(searchText)
                );
              }}
            >
              {employees.map(employee => (
                <Option key={employee._id} value={employee._id}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{employee.name}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {employee.position} • {employee.department}
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="receptionTime"
            label="Қабул вақти"
            initialValue={dayjs('09:00', 'HH:mm')}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              placeholder="Қабул вақтини танланг"
            />
          </Form.Item>

          <Form.Item name="purpose" label="Қабул мақсади">
            <Select placeholder="Қабул мақсадини танланг" allowClear>
              <Option value="Рахбар қабули">Рахбар қабули</Option>
              <Option value="Ишга қабул қилиш">Ишга қабул қилиш</Option>
              <Option value="Маслаҳат олиш">Маслаҳат олиш</Option>
              <Option value="Ҳисобот бериш">Ҳисобот бериш</Option>
              <Option value="Лойиҳа муҳокамаси">Лойиҳа муҳокамаси</Option>
              <Option value="Масала ҳал қилиш">Масала ҳал қилиш</Option>
              <Option value="Бошқа">Бошқа</Option>
            </Select>
          </Form.Item>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddReception}
            block
            size="large"
          >
            Қабулга қўшиш
          </Button>
        </Form>
      </Card>

      <Divider orientation="left">
        Қабулга ёзилганлар ({receptions.length})
      </Divider>

      {receptions.length > 0 ? (
        <List
          dataSource={receptions}
          renderItem={(reception) => (
            <List.Item style={{ padding: '12px 0' }}>
              <Card
                size="small"
                style={{ width: '100%' }}
                styles={{
                  body: { padding: '12px 16px' }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Vaqt va holat */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <Avatar
                        icon={<UserOutlined />}
                        size="small"
                        style={{ backgroundColor: '#52c41a' }}
                      />
                      <strong style={{ color: '#52c41a' }}>
                        {reception.time}
                      </strong>
                      <Tag color={getStatusColor(reception.status)}>
                        {getStatusText(reception.status)}
                      </Tag>
                    </div>

                    {/* Ism */}
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: 4,
                      color: '#262626'
                    }}>
                      {reception.name}
                    </div>

                    {/* Lavozim va bo'lim */}
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: 4
                    }}>
                      {reception.position}
                      {reception.department && ` • ${reception.department}`}
                    </div>

                    {/* Telefon */}
                    {reception.phone && (
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        marginBottom: 4
                      }}>
                        📞 {reception.phone}
                      </div>
                    )}

                    {/* Maqsad */}
                    {reception.purpose && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        lineHeight: 1.4
                      }}>
                        <strong>Мақсад:</strong> {reception.purpose}
                      </div>
                    )}
                  </div>

                  {/* O'chirish tugmasi */}
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveReception(reception.id)}
                    style={{ marginLeft: 8 }}
                  />
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
          backgroundColor: '#fafafa',
          borderRadius: '6px'
        }}>
          Ҳозирча қабулга ёзилганлар йўқ
        </div>
      )}
    </div>
  );
};

export default ReceptionForm;