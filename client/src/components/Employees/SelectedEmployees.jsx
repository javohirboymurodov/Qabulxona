import React from 'react';
import { Card, List, Typography, Space, Button, Badge, Avatar } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SelectedEmployees = ({ reportedEmployees, onUpdateStatus }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge status="success" text="Келди" />;
      case 'absent':
        return <Badge status="error" text="Келмади" />;
      default:
        return <Badge status="processing" text="Кутилмоқда" />;
    }
  };

  return (
    <Card style={{ flex: '1 1 350px' }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        <UserOutlined /> Йўналтирилган ходимлар
      </Title>

      <List
        dataSource={reportedEmployees}
        renderItem={employee => (
          <List.Item
            key={employee._id}
            actions={
              employee.status === 'pending' ? [
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => onUpdateStatus(employee._id, 'present')}
                />,
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  style={{ color: '#ff4d4f' }}
                  onClick={() => onUpdateStatus(employee._id, 'absent')}
                />
              ] : []
            }
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  size={40}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              }
              title={
                <Space>
                  <Text strong>{employee.name}</Text>
                  {getStatusBadge(employee.status)}
                </Space>
              }
              description={employee.position}
            />
          </List.Item>
        )}
        locale={{
          emptyText: (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: '24px', color: '#bfbfbf' }} />
              <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                Ҳозирча йўналтирилган ходимлар йўқ
              </Text>
            </div>
          )
        }}
      />
    </Card>
  );
};

export default SelectedEmployees;