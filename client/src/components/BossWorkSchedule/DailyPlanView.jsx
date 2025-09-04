import React from 'react';
import { List, Card, Tag, Empty, Button } from 'antd';
import { CalendarOutlined, UserOutlined, TeamOutlined, DeleteOutlined } from '@ant-design/icons';

const DailyPlanView = ({
  tasks = [],
  receptions = [],
  meetings = [],
  onRemoveTask,
  onRemoveReception,
  onRemoveMeeting,
  onSaveAll,
  loading
}) => {

  // Barcha elementlarni vaqt bo'yicha birlashtirish
  const allItems = [
    ...tasks.map(task => ({ ...task, type: 'task' })),
    ...receptions.map(reception => ({ ...reception, type: 'reception' })),
    ...meetings.map(meeting => ({ ...meeting, type: 'meeting' }))
  ].sort((a, b) => {
    // Qabul uchun time, boshqalar uchun startTime
    const timeA = (a.type === 'reception' ? a.time : a.startTime) || a.time || '00:00';
    const timeB = (b.type === 'reception' ? b.time : b.startTime) || b.time || '00:00';
    const timeAFormatted = timeA.replace(':', '');
    const timeBFormatted = timeB.replace(':', '');
    return parseInt(timeAFormatted) - parseInt(timeBFormatted);
  });

  // Har bir element uchun ikonka va rang
  const getItemIcon = (type) => {
    switch (type) {
      case 'task':
        return <CalendarOutlined style={{ color: '#1890ff' }} />;
      case 'reception':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      case 'meeting':
        return <TeamOutlined style={{ color: '#faad14' }} />;
      default:
        return <CalendarOutlined />;
    }
  };

  const getItemTag = (type) => {
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

  // Element o'chirish
  const handleRemove = (item) => {
    switch (item.type) {
      case 'task':
        onRemoveTask?.(item.id);
        break;
      case 'reception':
        onRemoveReception?.(item.id);
        break;
      case 'meeting':
        onRemoveMeeting?.(item.id);
        break;
      default:
        console.warn('Unknown item type:', item.type);
    }
  };

  const totalItems = tasks.length + receptions.length + meetings.length;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: '12px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div>
          <h4 style={{ margin: 0 }}>
            Кунлик иш режаси
          </h4>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            Жами: {totalItems} та режа
            ({tasks.length} вазифа, {receptions.length} қабул, {meetings.length} мажлис)
          </div>
        </div>
        <Button
          type="primary"
          onClick={onSaveAll}
          loading={loading}
          disabled={totalItems === 0}
        >
          Барчасини сақлаш
        </Button>
      </div>

      {/* Content */}
      {allItems.length > 0 ? (
        <List
          dataSource={allItems}
          renderItem={(item) => (
            <List.Item style={{ padding: '8px 0' }}>
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
                    {/* Vaqt va tur */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      {getItemIcon(item.type)}
                      <strong style={{ fontSize: '14px' }}>
                        {item.type === 'reception' ? item.time : (item.startTime || item.time)}
                        {item.endTime && ` - ${item.endTime}`}
                      </strong>
                      {getItemTag(item.type)}
                    </div>

                    {/* Sarlavha */}
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      marginBottom: 4,
                      color: '#262626'
                    }}>
                      {item.title || item.name}
                    </div>

                    {/* Tavsif */}
                    {(item.description || item.purpose) && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: 4
                      }}>
                        {item.description || item.purpose}
                      </div>
                    )}

                    {/* Qo'shimcha ma'lumotlar */}
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {item.type === 'reception' && (
                        <div>
                          {item.position && `${item.position}`}
                          {item.department && ` - ${item.department}`}
                        </div>
                      )}
                      {item.type === 'meeting' && (
                        <div>
                          {item.location && `Жойи: ${item.location}`}
                          {item.participants && ` • Иштирокчилар: ${item.participants}`}
                        </div>
                      )}
                      {item.type === 'task' && item.priority && (
                        <div>Муҳимлик: {item.priority}</div>
                      )}
                    </div>
                  </div>

                  {/* O'chirish tugmasi */}
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(item)}
                    style={{
                      opacity: 0.6,
                      transition: 'opacity 0.2s'
                    }}
                  />
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description="Ҳозирча режалар қўшилмаган"
          style={{
            padding: '40px 0',
            color: '#999'
          }}
        >
          <div style={{ marginTop: 16, fontSize: '13px', color: '#666' }}>
            Юқоридаги табларда вазифа, қабул ёки мажлис қўшинг
          </div>
        </Empty>
      )}
    </div>
  );
};

export default DailyPlanView;