import React from 'react';
import { Modal, Descriptions, Tag, Space, Typography } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ViewMeetingModal = ({ visible, onClose, meeting }) => {
  if (!meeting) return null;

  return (
    <Modal
      title="Мажлис маълумотлари"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Мажлис номи">
          <Text strong>{meeting.name}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Сана">
          <Space>
            <CalendarOutlined />
            <Text>{meeting.date}</Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Вақти">
          <Space>
            <ClockCircleOutlined />
            <Text>{meeting.time}</Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Ходимлар сони">
          <Space>
            <TeamOutlined />
            <Text>{meeting.participants?.length || 0} киши</Text>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Иштирокчи ходимлар">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {meeting.participants?.map((participant) => (
              <Tag key={participant._id}>
                {participant.name} - {participant.position} ({participant.department})
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default ViewMeetingModal;
