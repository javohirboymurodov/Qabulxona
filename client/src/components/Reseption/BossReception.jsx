import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Space, Button, message, Typography, Calendar, Skeleton, Table } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { updateReceptionStatus, getReceptionHistoryByDate } from '../../services/api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const BossReception = ({ employees, meetings = [], onEdit, onDelete, setSelectedEmployee, fetchData }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!meetings || !meetings.length);

  useEffect(() => {
    setDataLoading(!meetings || !meetings.length);
  }, [meetings]);

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

  // Bugungi rahbar qabuliga tanlangan xodimlarni filterlash
  const todaysMeetingEmployees = employees.filter(emp => {
    if (!meetings || !meetings.length || !emp) return false;
    const todayStr = dayjs().format('YYYY-MM-DD');
    return meetings.some(meeting => 
      meeting && 
      meeting.date &&
      meeting.participants && 
      dayjs(meeting.date).format('YYYY-MM-DD') === todayStr && 
      meeting.participants.some(p => p && p._id === emp._id)
    );
  });

  // Table columns
  const historyColumns = [
    {
      title: 'Ҳолат',
      key: 'status',
      width: 80,
      render: (_, record) => (
        record.status === 'present' ? 
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} /> : 
          record.status === 'absent' ?
          <CloseCircleOutlined style={{ color: '#f5222d', fontSize: '18px' }} /> :
          <CloseCircleOutlined style={{ color: '#faad14', fontSize: '18px' }} />
      )
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
      title: 'Вақт',
      key: 'timeUpdated',
      width: 100,
      render: (_, record) => (
        <Text type="secondary">
          {record.timeUpdated ? dayjs(record.timeUpdated).format('HH:mm') : '-'}
        </Text>
      )
    },
    {
      title: 'Топшириқ',
      key: 'task',
      render: (_, record) => {
        if (!record.task) return '-';
        return (
          <div>
            <Text style={{ fontSize: '12px' }}>{record.task.description}</Text>
            <br />
            <Tag color="blue" size="small">{record.task.deadline} кун</Tag>
          </div>
        );
      }
    }
  ];

  return (
    <div className="boss-reception">
      {contextHolder}
      <Row gutter={[16, 16]}>
        {/* Chap ustun - Bugungi qabullar */}
        <Col xs={24} lg={8}>
          <Card 
            title="Бугунги қабуллар" 
            className="reception-card today-meetings"
            extra={<Text type="secondary">{dayjs().format('DD.MM.YYYY')}</Text>}
          >
            {dataLoading ? (
              <List
                size="small"
                dataSource={[1, 2, 3]}
                renderItem={(item, index) => (
                  <List.Item key={`skeleton-${index}`}>
                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                  </List.Item>
                )}
              />
            ) : (
              <List
                size="small"
                dataSource={todaysMeetingEmployees}
                locale={{ emptyText: 'Бугунги раҳбар қабулларига ходимлар танланмаган' }}
                renderItem={(employee) => (
                  <List.Item
                    key={employee._id || employee.id}
                    className={`status-${employee.status}`}
                  >
                    <List.Item.Meta
                      avatar={<UserOutlined className="employee-avatar" />}
                      title={<Text strong>{employee.name || employee.fullName}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">{employee.position}</Text>
                          <Text type="secondary">{employee.department}</Text>
                          {getStatusTag(employee.status)}
                        </Space>
                      }
                    />
                    <Space>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleStatusUpdate(employee._id, 'present')}
                        disabled={employee.status === 'present'}
                      >
                        Келди
                      </Button>
                      <Button 
                        danger 
                        size="small"
                        onClick={() => handleStatusUpdate(employee._id, 'absent')}
                        disabled={employee.status === 'absent'}
                      >
                        Келмади
                      </Button>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* O'rta ustun - Kalendar */}
        <Col xs={24} lg={8}>
          <Card title="Қабул кунлари тарихи">
            <Calendar 
              fullscreen={false} 
              onSelect={onSelect}
              value={selectedDate}
            />
          </Card>
        </Col>

        {/* O'ng ustun - Tanlangan kun ma'lumotлари */}
        <Col xs={24} lg={8}>
          <Card 
            title={`Танланган кун: ${selectedDate.format('DD.MM.YYYY')}`}
            className="history-card"
            loading={loading}
          >
            <Table
              loading={loading}
              dataSource={historyData}
              columns={historyColumns}
              rowKey={(record) => record.key || record._id || record.id}
              pagination={false}
              size="small"
              locale={{ 
                emptyText: `${selectedDate.format('DD.MM.YYYY')} санада қабул маълумотлари мавжуд эмас` 
              }}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BossReception;
