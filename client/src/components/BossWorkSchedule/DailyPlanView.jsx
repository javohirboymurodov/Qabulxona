import React from 'react';
import { Button, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import ScheduleTable from '../Common/ScheduleTable';

const DailyPlanView = ({
  tasks = [],
  receptions = [],
  meetings = [],
  onRemoveTask,
  onRemoveReception,
  onRemoveMeeting,
  onEditTask,
  onEditReception, 
  onEditMeeting,
  onSaveAll,
  loading,
  selectedDate
}) => {

  // Barcha elementlarni vaqt bo'yicha birlashtirish
  const allItems = [
    ...tasks.map(task => ({ ...task, type: 'task' })),
    ...receptions.map(reception => ({ ...reception, type: 'reception' })),
    ...meetings.map(meeting => ({ ...meeting, type: 'meeting' }))
  ].sort((a, b) => {
    const timeA = (a.startTime || a.time || '00:00').replace(':', '');
    const timeB = (b.startTime || b.time || '00:00').replace(':', '');
    return parseInt(timeA) - parseInt(timeB);
  });

  // Action handler'lar
  const handleView = (item) => {
    console.log('View item in modal:', item);
    // View logic (ixtiyoriy)
  };

  const handleEdit = (item) => {
    console.log('Edit item in modal:', item);
    switch (item.type) {
      case 'task':
        onEditTask?.(item);
        break;
      case 'reception':
        onEditReception?.(item);
        break;
      case 'meeting':
        onEditMeeting?.(item);
        break;
      default:
        console.warn('Unknown item type:', item.type);
    }
  };

  const handleDelete = (item) => {
    console.log('Delete item in modal:', item);
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

      {/* Schedule Table with Actions */}
      {allItems.length > 0 ? (
        <ScheduleTable
          dataSource={allItems}
          loading={loading}
          selectedDate={selectedDate}
          showActions={true}
          emptyText="Ҳозирча режалар қўшилмаган"
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
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