import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, List, Typography, Spin, Empty, Table, Button, Space, Tag, App } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import TaskAssignmentModal from './modals/TaskAssignmentModal';
import { getReceptionHistoryRange, updateEmployeeStatus } from '../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const ReceptionHistory = ({ selectedDate }) => {
  const { message } = App.useApp();
  const [historyData, setHistoryData] = useState({ employees: [] });
  const [loading, setLoading] = useState(false);
  const [monthData, setMonthData] = useState({});
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const loadMonthData = async (date) => {
    try {
      setLoading(true);
      const startDate = date.startOf('month').format('YYYY-MM-DD');
      const endDate = date.endOf('month').format('YYYY-MM-DD');

      const response = await getReceptionHistoryRange(startDate, endDate);

      // Group data by date
      const dataByDate = {};
      const responseData = response?.data || [];

      responseData.forEach(record => {
        const dateKey = dayjs(record.timeUpdated).format('YYYY-MM-DD');
        if (!dataByDate[dateKey]) {
          dataByDate[dateKey] = {
            present: [],
            absent: [],
            total: 0
          };
        }
        dataByDate[dateKey][record.status].push(record);
        dataByDate[dateKey].total++;
      });

      setMonthData(dataByDate);
    } catch (error) {
      console.error('Month data loading error:', error);
      message.error('Ойлик маълумотларни юклашда хатолик');
    } finally {
      setLoading(false);
    }
  };

  const loadDayData = async (date) => {
    try {
      setLoading(true);
      const dateStr = date.format('YYYY-MM-DD');
      const response = await getReceptionHistoryRange(dateStr, dateStr);

      // Ma'lumotlarni formatlash va unique key qo'shish
      const data = response?.data || [];
      const formattedData = data.map((item, index) => ({
        ...item,
        key: item._id || item.id || `day-${index}-${Date.now()}`,
        id: item._id || item.id || `temp-day-${index}`
      }));

      setSelectedDayData(formattedData);
    } catch (error) {
      console.error('Day data loading error:', error);
      message.error('Кунлик маълумотларни юклашда хатолик');
      setSelectedDayData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadMonthData(dayjs(selectedDate));
    }
  }, [selectedDate]);

  const cellRender = (date, info) => {
    if (info.type !== 'date') return null;

    const dateKey = date.format('YYYY-MM-DD');
    const dayData = monthData[dateKey];

    if (!dayData) return null;

    return (
      <div className="calendar-cell">
        {dayData.present.length > 0 && (
          <Badge
            status="success"
            text={`Kelgan: ${dayData.present.length}`}
            style={{ display: 'block' }}
          />
        )}
        {dayData.absent.length > 0 && (
          <Badge
            status="error"
            text={`Kelmagan: ${dayData.absent.length}`}
            style={{ display: 'block' }}
          />
        )}
      </div>
    );
  };

  const onSelect = (date) => {
    loadDayData(date);
  };

  const renderDayDetails = () => {
    if (!selectedDayData || selectedDayData.length === 0) return null;

    return (
      <Card title={`Танланган кун: ${dayjs(selectedDayData[0]?.date || selectedDayData[0]?.timeUpdated).format('DD.MM.YYYY')}`}>
        <List
          dataSource={selectedDayData}
          rowKey={(item) => item.key || item._id || item.id}
          renderItem={item => (
            <List.Item key={item.key || item._id || item.id}>
              <List.Item.Meta
                avatar={item.status === 'present' ?
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                }
                title={item.name || 'Номаълум'}
                description={`${item.position || '-'} - ${item.department || '-'}`}
              />
              <div>
                <Text type="secondary">
                  {item.timeUpdated ? dayjs(item.timeUpdated).format('HH:mm') : '-'}
                </Text>
              </div>
            </List.Item>
          )}
          locale={{
            emptyText: <Empty description="Маълумот мавжуд эмас" />
          }}
        />
      </Card>
    );
  };

  const handleStatusUpdate = async (employee, status) => {
    try {
      if (status === 'present') {
        setSelectedEmployee(employee);
        setShowTaskModal(true);
        return;
      }

      await updateEmployeeStatus(historyData._id, employee.employeeId, { status });
      message.success('Статус янгиланди');
      // onUpdate(); // Bu funksiya yo'q, shuning uchun comment qildim

    } catch (error) {
      message.error('Статусни янгилашда хатолик');
    }
  };

  const handleTaskSave = async (taskData) => {

    try {
      // employeeId ni to'g'ri olish
      const employeeId = selectedEmployee.employeeId?._id ||
        selectedEmployee.employeeId ||
        selectedEmployee._id ||
        selectedEmployee.id;

      if (!employeeId) {
        throw new Error('Employee ID topilmadi');
      }

      await updateEmployeeStatus(
        historyData._id,
        employeeId,
        {
          status: 'present',
          task: taskData
        }
      );

      message.success('Топшириқ сақланди');
      setShowTaskModal(false);
      setSelectedEmployee(null);
      // onUpdate(); // Bu funksiya yo'q

    } catch (error) {
      message.error('Топшириқни сақлашда хатолик');
    }
  };

  const columns = [
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => (
        <Space>
          <Button
            type={record.status === 'present' ? 'primary' : 'default'}
            icon={<CheckOutlined />}
            onClick={() => handleStatusUpdate(record, 'present')}
          >
            Келди
          </Button>
          <Button
            danger={record.status === 'absent'}
            icon={<CloseOutlined />}
            onClick={() => handleStatusUpdate(record, 'absent')}
          >
            Келмади
          </Button>
        </Space>
      )
    },
    {
      title: 'Топшириқ',
      dataIndex: ['task', 'description'],
      render: (text, record) => {
        if (!text) return '-';
        return (
          <div>
            <div>{text}</div>
            <Tag color="blue">{record.task?.deadline || 0} кун</Tag>
          </div>
        );
      }
    }
  ];

  // Employees ma'lumotlarini formatlash
  const employeesData = (historyData?.employees || []).map((item, index) => ({
    ...item,
    key: item._id || item.employeeId || `employee-${index}`,
    id: item._id || item.employeeId || `temp-employee-${index}`
  }));

  return (
    <Spin spinning={loading}>
      <Calendar
        cellRender={cellRender}
        onSelect={onSelect}
        value={selectedDate ? dayjs(selectedDate) : undefined}
      />

      {selectedDayData && renderDayDetails()}

      <Table
        columns={columns}
        dataSource={employeesData}
        rowKey={(record) => record.key || record._id || record.employeeId}
        locale={{ emptyText: 'Ходимлар маълумоти топилмади' }}
        pagination={false}
      />

      <TaskAssignmentModal
        visible={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedEmployee(null);
        }}
        onSave={handleTaskSave}
        employeeName={selectedEmployee?.name}
      />
    </Spin>
  );
};

export default ReceptionHistory;
