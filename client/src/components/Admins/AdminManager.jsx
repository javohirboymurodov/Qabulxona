import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Tag, App } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { getAdmins, deleteAdmin } from '../../services/api';
import AddAdminModal from './AddAdminModal';

const AdminManager = () => {
  const { message, modal } = App.useApp();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await getAdmins();
      // Make sure we have an array of admins
      setAdmins(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      message.error('Админлар рўйхатини юклашда хатолик');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = (adminId) => {
    modal.confirm({
      title: 'Админни ўчириш',
      content: 'Ушбу админни ўчиришни истайсизми?',
      okText: 'Ҳа',
      cancelText: 'Йўқ',
      onOk: async () => {
        try {
          await deleteAdmin(adminId);
          message.success('Админ ўчирилди');
          fetchAdmins();
        } catch (error) {
          message.error('Ўчиришда хатолик юз берди');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Тўлиқ исми',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Логин',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Роль',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (role) => (
        <Tag color={role === 'super_admin' ? 'gold' : 'blue'}>
          {role === 'super_admin' ? 'Супер админ' : 'Админ'}
        </Tag>
      ),
    },
    {
      title: 'Амаллар',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingAdmin(record);
              setShowModal(true);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            disabled={record.role?.name === 'super_admin'} // Super adminni o'chirib bo'lmaydi
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => {
            setEditingAdmin(null);
            setShowModal(true);
          }}
        >
          Админ қўшиш
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={admins}
        rowKey="_id"
        loading={loading}
      />

      <AddAdminModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAdmin(null);
        }}
        onSuccess={() => {
          setShowModal(false);
          setEditingAdmin(null);
          fetchAdmins();
        }}
        editingAdmin={editingAdmin}
      />
    </div>
  );
};

export default AdminManager;