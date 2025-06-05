import React from 'react';
import { Card, Typography, Space, Button, Tooltip, Drawer, List, Avatar, Tag, Descriptions } from 'antd';
import { 
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BankOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import SearchableEmployeeList from './SearchableEmployeeList';
import EmployeeDetails from './EmployeeDetails';

const { Title, Text } = Typography;

const EmployeeList = ({ 
  employees,
  onEdit,
  onDelete,
  onView,
  selectedEmployee,
  style = {}
}) => {
  const [filteredEmployees, setFilteredEmployees] = React.useState(employees);

  React.useEffect(() => {
    setFilteredEmployees(employees);
  }, [employees]);

  const renderActions = (employee) => (
    <Space>
      <Tooltip title="Кўриш">
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onView(employee)}
        />
      </Tooltip>
      <Tooltip title="Тахрирлаш">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(employee)}
        />
      </Tooltip>
      <Tooltip title="Ўчириш">
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(employee._id)}
        />
      </Tooltip>
    </Space>
  );

  return (
    <>
      <Card style={{ ...style }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={4}>
            <UserOutlined /> Ходимлар Рўйхати
          </Title>
          
          <SearchableEmployeeList
            employeeOptions={employees}
            onChange={setFilteredEmployees}
            placeholder="Ходимларни қидириш"
          />

          <List
            dataSource={filteredEmployees}
            renderItem={employee => (
              <List.Item
                key={employee._id}
                actions={[renderActions(employee)]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  }
                  title={
                    <Space>
                      <span>{employee.name}</span>
                      <Tag color="blue">{employee.position}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">
                        <BankOutlined /> {employee.department}
                      </Text>
                      <Text type="secondary">
                        <PhoneOutlined /> {employee.phone}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Space>
      </Card>

      <Drawer
        title="Ходим маълумотлари"
        placement="right"
        width={520}
        onClose={() => onView(null)}
        open={!!selectedEmployee}
      >
        {selectedEmployee && (
          <EmployeeDetails employee={selectedEmployee} />
        )}
      </Drawer>
    </>
  );
};

export default EmployeeList;