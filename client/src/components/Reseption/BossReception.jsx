import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Space, Button, message, Typography, Calendar, Table, Modal } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { updateReceptionStatus, getReceptionHistoryByDate, deleteReceptionItem } from '../../services/api';
import ViewReceptionModal from './ViewReceptionModal';
import AddReceptionModal from './AddReceptionModal';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const BossReception = ({ employees, meetings = [], onEdit, onDelete, setSelectedEmployee, fetchData }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReception, setSelectedReception] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReception, setEditingReception] = useState(null);

  useEffect(() => {
    // Component yuklanganda bugungi ma'lumotlarni olish
    loadHistoryData(selectedDate);
  }, []);

  const handleStatusUpdate = async (employeeId, newStatus) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      await updateReceptionStatus(employeeId, { status: newStatus }, today);
      
      // Ma'lumotlarni yangilash
      await loadHistoryData(selectedDate);
      if (fetchData) {
        await fetchData();
      }
      
      messageApi.success({
        content: `Ходим ҳолати "${newStatus === 'present' ? 'Келди' : 'Келмади'}" га ўзгартирилди`,
        duration: 3
      });
    } catch (error) {
      console.error('Status update error:', error);
      messageApi.error({
        content: 'Ходим ҳолатини янгилашда хатолик юз берди',
        duration: 3
      });
    }
  };

  const loadHistoryData = async (date) => {
    try {
      setLoading(true);
      const dateStr = date.format('YYYY-MM-DD');
      const response = await getReceptionHistoryByDate(dateStr);
      
      // Backend'dan kelgan ma'lumotlarni to'g'ri formatda olish
      const data = response?.data || [];
      const formattedData = data.map((item, index) => ({
        ...item,
        key: item._id || item.id || `history-${index}-${Date.now()}`,
        id: item._id || item.id || `temp-${index}`
      }));
      
      setHistoryData(formattedData);
    } catch (error) {
      console.error('History data loading error:', error);
      messageApi.error('Маълумотларни юклашда хатолик юз берди');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = (date) => {
    setSelectedDate(date);
    loadHistoryData(date);
  };

  const handleViewReception = (record) => {
    setSelectedReception(record);
    setViewModalVisible(true);
  };

  const handleViewModalClose = () => {
    setViewModalVisible(false);
    setSelectedReception(null);
  };

  const handleModalUpdate = async () => {
    // Ma'lumotlarni yangilash
    console.log('Refreshing data for date:', selectedDate.format('YYYY-MM-DD'));
    await loadHistoryData(selectedDate);
    
    // Agar fetchData mavjud bo'lsa, uni ham chaqiramiz
    if (fetchData) {
      await fetchData();
    }
  };

  // Qabul tahrirlash
  const handleEditReception = (record) => {
    console.log('Edit reception:', record);
    setEditingReception(record);
    setEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setEditingReception(null);
  };

  const handleEditModalSave = async () => {
    try {
      // Ma'lumotlarni qayta yuklash
      await loadHistoryData(selectedDate);
      if (fetchData) {
        await fetchData();
      }
      handleEditModalClose();
      messageApi.success('Қабул муваффақиятли янгиланди');
    } catch (error) {
      console.error('Edit save error:', error);
      messageApi.error('Янгилашда хатолик юз берди');
    }
  };

  // Qabul o'chirish
  const handleDeleteReception = (record) => {
    Modal.confirm({
      title: 'Қабулни ўчириш',
      content: `Ҳақиқатан ҳам ${record.name} нинг қабулини ўчиришни истайсизми?`,
      okText: 'Ҳа, ўчириш',
      cancelText: 'Бекор қилиш',
      okType: 'danger',
      onOk: async () => {
        await handleConfirmDeleteReception(record);
      }
    });
  };

  const handleConfirmDeleteReception = async (record) => {
    try {
      setDeleteLoading(true);
      console.log('Deleting reception:', record);
      
      if (record.id || record._id) {
        await deleteReceptionItem(record.id || record._id);
        messageApi.success('Қабул муваффақиятли ўчирилди');
        
        // Ma'lumotlarni qayta yuklash
        await loadHistoryData(selectedDate);
        if (fetchData) {
          await fetchData();
        }
      }
    } catch (error) {
      console.error('Delete reception error:', error);
      messageApi.error('Қабулни ўчиришда хатолик юз берди');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTaskStatusDisplay = (task) => {
    if (!task) return '-';

    const assignedDate = dayjs(task.assignedAt);
    const currentDate = dayjs();
    const deadlineDate = assignedDate.add(task.deadline, 'day');
    const remainingDays = deadlineDate.diff(currentDate, 'day');

    switch (task.status) {
      case 'completed':
        return <Tag color="success">Бажарилди</Tag>;
      case 'overdue':
        return <Tag color="error">Бажарилмади</Tag>;
      default: // pending
        if (remainingDays < 0) {
          return <Tag color="error">{Math.abs(remainingDays)} кун кечикди</Tag>;
        } else if (remainingDays === 0) {
          return <Tag color="warning">Бугун муддат</Tag>;
        } else {
          return <Tag color="processing">{remainingDays} кун қолди</Tag>;
        }
    }
  };

  // Table columns
  const historyColumns = [
    {
      title: 'Ҳолат',
      key: 'status',
      width: 100,
      render: (_, record) => {
        switch (record.status) {
          case 'present':
            return <Tag color="success">Келди</Tag>;
          case 'absent':
            return <Tag color="error">Келмади</Tag>;
          case 'waiting':
            return <Tag color="warning">Кутилмоқда</Tag>;
          default:
            return <Tag>Номаълум</Tag>;
        }
      }
    },
    {
      title: 'Ф.И.Ш.',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || '-'
    },
    {
      title: 'Лавозими',
      dataIndex: 'position',
      key: 'position',
      render: (text) => text || '-'
    },
    {
      title: 'Бўлим',
      dataIndex: 'department',
      key: 'department',
      render: (text) => text || '-'
    },
    {
      title: 'Қабул вақти',
      key: 'receptionTime',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ color: '#1890ff' }}>
            {record.time || 
             (record.timeUpdated ? dayjs(record.timeUpdated).format('HH:mm') : '-')
            }
          </Text>
        </div>
      )
    },
    {
      title: 'Топшириқ',
      key: 'taskStatus',
      render: (_, record) => {
        // Agar xodim kelmagan bo'lsa, task ma'lumotlarini ko'rsatmaymiz
        if (record.status === 'absent') {
          return '-';
        }
        
        // Agar task yo'q bo'lsa yoki description yo'q bo'lsa
        if (!record.task || !record.task.description) {
          return '-';
        }
        
        // Agar task completed yoki overdue bo'lsa, faqat statusni ko'rsatamiz
        if (record.task.status === 'completed' || record.task.status === 'overdue') {
          return getTaskStatusDisplay(record.task);
        }
        
        // Pending holatda description va statusni ko'rsatamiz
        return (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{ fontSize: '12px' }}>
                {record.task.description && record.task.description.length > 30 
                  ? `${record.task.description.substring(0, 30)}...` 
                  : record.task.description || '-'}
              </Text>
            </div>
            {getTaskStatusDisplay(record.task)}
          </div>
        );
      }
    },
    {
      title: 'Амаллар',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        const isToday = selectedDate.isSame(dayjs(), 'day');
        const isFuture = selectedDate.isAfter(dayjs(), 'day');
        const canEdit = isToday || isFuture;
        
        return (
          <Space size="small">
            {/* View button - har doim */}
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewReception(record)}
              size="small"
              title="Кўриш"
            />
            
            {/* Edit button - faqat bugun/kelajak */}
            {canEdit && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditReception(record)}
                size="small"
                title="Таҳрирлаш"
              />
            )}
            
            {/* Delete button - faqat bugun/kelajak */}
            {canEdit && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteReception(record)}
                size="small"
                title="Ўчириш"
                loading={deleteLoading}
              />
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="boss-reception">
      {contextHolder}
      <Row gutter={[16, 16]}>
        {/* Chap ustun - Kalendar (1/3) */}
        <Col xs={24} lg={8}>
          <Card title="Қабул кунлари тарихи">
            <Calendar 
              fullscreen={false} 
              onSelect={onSelect}
              value={selectedDate}
            />
          </Card>
        </Col>

        {/* O'ng ustun - Tanlangan кун ma'lumotлари (2/3) */}
        <Col xs={24} lg={16}>
          <Card 
            title={`Танланган кун: ${selectedDate.format('DD.MM.YYYY')}`}
            className="history-card"
            loading={loading}
          >
            <Table
              loading={loading || deleteLoading}
              dataSource={historyData}
              columns={historyColumns}
              rowKey={(record) => record.key || record._id || record.id}
              pagination={false}
              size="small"
              locale={{ 
                emptyText: `${selectedDate.format('DD.MM.YYYY')} санада қабул маълумотлари мавжуд эмас` 
              }}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>

      <ViewReceptionModal
        visible={viewModalVisible}
        onClose={handleViewModalClose}
        reception={selectedReception}
        onUpdate={handleModalUpdate}
      />

      {/* Edit Reception Modal */}
      {editModalVisible && editingReception && (
        <AddReceptionModal
          visible={editModalVisible}
          onClose={handleEditModalClose}
          onSave={handleEditModalSave}
          employees={employees || []}
          initialData={editingReception}
        />
      )}
    </div>
  );
};

export default BossReception;
