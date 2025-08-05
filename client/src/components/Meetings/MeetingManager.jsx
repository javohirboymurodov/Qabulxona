import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Space,
  Popconfirm,
  Tag,
  Typography,
  App
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewMeetingModal from './ViewMeetingModal';
import SearchableMeetingList from './SearchableMeetingList';
import { updateMeeting, createMeeting } from '../../services/api'; // API funksiyalarini import qilamiz
import AddMeetingModal from './AddMeetingModal'; // <-- Import qo'shish

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MeetingManager = ({ meetings = [], employees = [], onDeleteMeeting, fetchData }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false); // <-- Modal state o'zgartirish
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null); // <-- Tahrirlash uchun
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredMeetings, setFilteredMeetings] = React.useState(meetings);

  React.useEffect(() => {
    setFilteredMeetings(meetings);
  }, [meetings]);

  // Form useEffect'larni olib tashlash - AddMeetingModal o'zi boshqaradi

  const safeMeetings = Array.isArray(meetings) ? meetings : [];
  
  const sortedMeetings = safeMeetings.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleAddMeeting = () => {
    setEditingMeeting(null); // <-- Yangi mažlis uchun null
    setShowMeetingModal(true);
  };

  const handleEditMeeting = (record) => {
    console.log('Editing meeting:', record);
    setEditingMeeting(record); // <-- Tahrirlash uchun record ni set qilish
    setShowMeetingModal(true);
  };

  const handleViewMeeting = (record) => {
    console.log('Viewing meeting:', record);
    setViewingMeeting(record);
    setViewModalVisible(true);
  };

  const handleViewModalClose = () => {
    setViewModalVisible(false);
    setViewingMeeting(null);
  };

  const handleDeleteMeeting = async (id) => {
    try {
      if (onDeleteMeeting) {
        await onDeleteMeeting(id);
      }
    } catch (error) {
      console.error('Delete meeting error:', error);
      message.error('Мажлисни ўчиришда хатолик');
    }
  };

  // AddMeetingModal callback'lari
  const handleMeetingModalClose = async (success) => {
    setShowMeetingModal(false);
    setEditingMeeting(null);
    
    if (success && fetchData) {
      await fetchData(); // <-- Ma'lumotlarni yangilash
    }
  };

  const handleMeetingSave = (meetingData) => {
    // AddMeetingModal o'zi success message ko'rsatadi
    console.log('Meeting saved:', meetingData);
  };

  const columns = [
    {
      title: 'Номи',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Сана',
      dataIndex: 'date',
      key: 'date',
      render: (text) => text ? dayjs(text).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'Вақт',
      dataIndex: 'time',
      key: 'time',
      render: (text) => text || '09:00'
    },
    {
      title: 'Жой',
      dataIndex: 'location',
      key: 'location',
      render: (text) => text || '-'
    },
    {
      title: 'Иштирокчилар',
      dataIndex: 'participants',
      key: 'participants',
      render: (participants) => {
        if (!participants || participants.length === 0) {
          return <Tag>Иштирокчилар йўқ</Tag>;
        }
        return (
          <Space wrap>
            {participants.slice(0, 2).map((participant, index) => (
              <Tag key={participant._id || index} color="blue">
                {participant.name || participant.fullName || participant}
              </Tag>
            ))}
            {participants.length > 2 && (
              <Tag key="more">+{participants.length - 2} та</Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Амаллар',
      key: 'actions',
      render: (_, record) => {
        const meetingDate = dayjs(record.date);
        const today = dayjs();
        const isPastMeeting = meetingDate.isBefore(today, 'day');

        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewMeeting(record)}
            />
            {!isPastMeeting && (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditMeeting(record)}
                />
                <Popconfirm
                  title="Ушбу мажлисни ўчирмоқчимисиз?"
                  onConfirm={() => handleDeleteMeeting(record._id)}
                  okText="Ҳа"
                  cancelText="Йўқ"
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={3} style={{ margin: 0 }}>
              Мажлислар
            </Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMeeting}
          >
            Янги мажлис
          </Button>
        }
      >
        <SearchableMeetingList
          meetingOptions={meetings}
          onChange={setFilteredMeetings}
          placeholder="Мажлисларни қидириш"
        />
        <Table
          columns={columns}
          dataSource={filteredMeetings}
          loading={loading}
          rowKey={(record) => record._id || record.id}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredMeetings.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Жами ${total} та мажлис`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }
          }}
          locale={{
            emptyText: "Мажлислар топилмади"
          }}
        />
      </Card>

      {/* Eski modallarni olib tashlash va AddMeetingModal qo'shish */}
      <AddMeetingModal
        visible={showMeetingModal}
        onClose={handleMeetingModalClose}
        onSave={handleMeetingSave}
        employees={employees}
        initialData={editingMeeting} // <-- Tahrirlash uchun ma'lumot
        preSelectedEmployees={[]}
      />

      {/* View Modal - shu qolsin */}
      <ViewMeetingModal
        visible={viewModalVisible}
        onClose={handleViewModalClose}
        meeting={viewingMeeting}
      />
    </div>
  );
};

export default MeetingManager;