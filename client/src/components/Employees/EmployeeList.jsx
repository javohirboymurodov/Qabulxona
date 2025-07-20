import React from 'react';
import { Card, Typography, Space, Button, Tooltip, Drawer, Table, Avatar, Tag, Descriptions } from 'antd';
import { 
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
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
  const [pageSize, setPageSize] = React.useState(5);
  const [currentPage, setCurrentPage] = React.useState(1);

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

  // Table uchun ustunlar
  const columns = [
    {
      title: 'Ф.И.О',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'Лавозими',
      dataIndex: 'position',
      key: 'position',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Бўлими',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Телефон рақами',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Амаллар',
      key: 'actions',
      render: (_, record) => renderActions(record)
    }
  ];

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
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey={(record) => record._id}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredEmployees.length,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['5', '10', '20', '50', '100'],
              showTotal: (total) => `Жами ${total} та ходим`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
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