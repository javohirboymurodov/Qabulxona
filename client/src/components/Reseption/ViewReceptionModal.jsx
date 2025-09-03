import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Typography, Space, Avatar, Button, message } from 'antd';
import { UserOutlined, PhoneOutlined, BankOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { updateTaskStatus } from '../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const ViewReceptionModal = ({ visible, onClose, reception, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  if (!reception) return null;

  const getStatusTag = (status) => {
    switch (status) {
      case 'present':
        return <Tag color="success">Келган</Tag>;
      case 'absent':
        return <Tag color="error">Келмаган</Tag>;
      case 'waiting':
        return <Tag color="warning">Кутилмоқда</Tag>;
      default:
        return <Tag>Номаълум</Tag>;
    }
  };

  const getTaskStatusTag = (task) => {
    if (!task) return null;

    const assignedDate = dayjs(task.assignedAt);
    const currentDate = dayjs();
    const deadlineDate = assignedDate.add(task.deadline, 'day');
    const remainingDays = deadlineDate.diff(currentDate, 'day');

    switch (task.status) {
      case 'completed':
        return <Tag color="success">Бажарилди</Tag>;
      case 'overdue':
        return <Tag color="error">Муддати ўтди</Tag>;
      case 'pending':
        if (remainingDays < 0) {
          return <Tag color="error">Муддати ўтди ({Math.abs(remainingDays)} кун кечикди)</Tag>;
        } else if (remainingDays === 0) {
          return <Tag color="warning">Бугун муддат тугайди</Tag>;
        } else {
          return <Tag color="processing">{remainingDays} кун қолди</Tag>;
        }
      default:
        return <Tag>Номаълум</Tag>;
    }
  };

  const handleTaskStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      
      const updateData = {
        task: {
          ...reception.task,
          status: newStatus
        }
      };

      console.log('Updating task status:', { receptionId: reception._id, updateData });
      
      await updateTaskStatus(reception._id, updateData);
      
      message.success(
        newStatus === 'completed' ? 'Топшириқ бажарилди деб белгиланди' : 
        'Топшириқ бажарилмади деб белгиланди'
      );
      
      // Ma'lumotларни yangilash
      if (onUpdate) {
        await onUpdate();
      }
      
      // Modalni yopish
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Task status update error:', error);
      message.error('Топшириқ холатини янгилашда хатолик: ' + (error.message || 'Номаълум хатолик'));
    } finally {
      setLoading(false);
    }
  };

  const renderTaskActions = (task) => {
    // Agar topshiriq yo'q yoki allaqachon bajarilgan/bajarilmagan bo'lsa tugmalarni ko'rsatmaymiz
    if (!task || task.status === 'completed' || task.status === 'overdue') {
      return null;
    }

    return (
      <Space style={{ marginTop: 8 }}>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          size="small"
          loading={loading}
          onClick={() => handleTaskStatusUpdate('completed')}
        >
          Бажарилди
        </Button>
        <Button
          danger
          icon={<CloseOutlined />}
          size="small"
          loading={loading}
          onClick={() => handleTaskStatusUpdate('overdue')}
        >
          Бажарилмади
        </Button>
      </Space>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <Text strong>Қабул маълумотлари</Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Ф.И.Ш.">
          <Text strong>{reception.name || '-'}</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Лавозими">
          <Text>{reception.position || '-'}</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Бўлими">
          <Space>
            <BankOutlined />
            <Text>{reception.department || '-'}</Text>
          </Space>
        </Descriptions.Item>
        
        {reception.phone && (
          <Descriptions.Item label="Телефон">
            <Space>
              <PhoneOutlined />
              <Text>{reception.phone}</Text>
            </Space>
          </Descriptions.Item>
        )}
        
        <Descriptions.Item label="Қабул вақти">
          <Space>
            <ClockCircleOutlined style={{ color: '#1890ff' }} />
            <Text strong>
              {reception.time || 
               (reception.timeUpdated ? dayjs(reception.timeUpdated).format('HH:mm') : '-')
              }
            </Text>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="Ҳолати">
          {getStatusTag(reception.status)}
        </Descriptions.Item>
        
        <Descriptions.Item label="Янгиланган вақти">
          <Space>
            <ClockCircleOutlined />
            <Text type="secondary">
              {reception.timeUpdated ? 
                dayjs(reception.timeUpdated).format('DD.MM.YYYY HH:mm') : 
                '-'
              }
            </Text>
          </Space>
        </Descriptions.Item>
        
        {/* Faqat xodim kelgan bo'lsa task ma'lumotlarini ko'rsatamiz */}
        {reception.status === 'present' && reception.task && (
          <>
            <Descriptions.Item label="Топшириқ тавсифи">
              <Text>{reception.task.description || '-'}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Топшириқ муддати">
              <Tag color="blue">{reception.task.deadline || 0} кун</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Топшириқ ҳолати">
              <div>
                {getTaskStatusTag(reception.task)}
                {renderTaskActions(reception.task)}
              </div>
            </Descriptions.Item>
          </>
        )}
        
        <Descriptions.Item label="Қўшилган сана">
          <Text type="secondary">
            {reception.createdAt ? 
              dayjs(reception.createdAt).format('DD.MM.YYYY HH:mm') : 
              '-'
            }
          </Text>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default ViewReceptionModal;