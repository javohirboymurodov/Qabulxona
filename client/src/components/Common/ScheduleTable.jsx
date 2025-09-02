import React from 'react';
import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';

const ScheduleTable = ({ 
  dataSource = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  showActions = true,
  emptyText = "Бу кун учун маълумот мавжуд эмас",
  size = "small"
}) => {

  // Type bo'yicha icon olish
  const getTypeIcon = (type) => {
    switch (type) {
      case 'task':
        return <CalendarOutlined style={{ color: '#1890ff' }} />;
      case 'reception':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      case 'meeting':
        return <TeamOutlined style={{ color: '#faad14' }} />;
      default:
        return <CalendarOutlined style={{ color: '#666' }} />;
    }
  };

  // Type bo'yicha tag olish
  const getTypeTag = (type) => {
    switch (type) {
      case 'task':
        return <Tag color="blue">Вазифа</Tag>;
      case 'reception':
        return <Tag color="green">Қабул</Tag>;
      case 'meeting':
        return <Tag color="orange">Мажлис</Tag>;
      default:
        return <Tag>Номаълум</Tag>;
    }
  };

  // Meta ma'lumotlarni formatlash
  const getMetaInfo = (record) => {
    const metaParts = [];
    
    if (record.type === 'reception') {
      if (record.position) metaParts.push(`💼 ${record.position}`);
      if (record.department) metaParts.push(`🏢 ${record.department}`);
      if (record.phone) metaParts.push(`📞 ${record.phone}`);
    } else if (record.type === 'meeting') {
      if (record.location) metaParts.push(`📍 ${record.location}`);
      if (record.participants?.length) {
        metaParts.push(`👥 ${record.participants.length} иштирокчи`);
      }
    } else if (record.type === 'task') {
      if (record.priority && record.priority !== 'normal') {
        const priorityColors = {
          low: 'default',
          high: 'orange', 
          urgent: 'red'
        };
        const priorityTexts = {
          low: 'Паст',
          high: 'Юқори',
          urgent: 'Шошилинч'
        };
        metaParts.push(
          <Tag color={priorityColors[record.priority]} size="small">
            {priorityTexts[record.priority]}
          </Tag>
        );
      }
      if (record.endTime) metaParts.push(`⏰ ${record.time} - ${record.endTime}`);
    }

    return metaParts.length > 0 ? (
      <div style={{ 
        fontSize: '12px', 
        color: '#999', 
        marginTop: 4,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {metaParts.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </div>
    ) : null;
  };

  // Jadval ustunlari
  const columns = [
    {
      title: 'Вақт',
      dataIndex: 'time',
      key: 'time',
      width: 80,
      align: 'center',
      render: (time, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
            {time || '00:00'}
          </div>
          {record.endTime && (
            <div style={{ fontSize: '11px', color: '#999' }}>
              {record.endTime}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Тур',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      align: 'center',
      render: (type) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 4 }}>
            {getTypeIcon(type)}
          </div>
          {getTypeTag(type)}
        </div>
      )
    },
    {
      title: 'Тафсилотлар',
      key: 'details',
      render: (_, record) => (
        <div>
          {/* Sarlavha */}
          <div style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#262626',
            marginBottom: 4,
            lineHeight: '1.3'
          }}>
            {record.title || 'Номаълум'}
          </div>

          {/* Tavsif */}
          {record.description && (
            <div style={{
              fontSize: '13px',
              color: '#666',
              marginBottom: 4,
              lineHeight: '1.4'
            }}>
              {record.description}
            </div>
          )}

          {/* Meta ma'lumotlar */}
          {getMetaInfo(record)}
        </div>
      )
    }
  ];

  // Agar actions kerak bo'lsa, actions ustunini qo'shamiz
  if (showActions && (onEdit || onDelete)) {
    columns.push({
      title: 'Амаллар',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {onEdit && (
            <Tooltip title="Таҳрирлаш">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Ўчириш">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    });
  }

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      loading={loading}
      pagination={false}
      size={size}
      rowKey={(record) => record.key || record.id || record._id}
      locale={{ emptyText }}
      scroll={{ y: 400 }}
      rowClassName={(record, index) => 
        index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
      }
    />
  );
};

export default ScheduleTable;
