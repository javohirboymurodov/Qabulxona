import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, List, Typography, Spin, Empty } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getReceptionHistoryRange } from '../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const ReceptionHistory = ({ selectedDate }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monthData, setMonthData] = useState({});
  const [selectedDayData, setSelectedDayData] = useState(null);

  const loadMonthData = async (date) => {
    try {
      setLoading(true);
      const startDate = date.startOf('month').format('YYYY-MM-DD');
      const endDate = date.endOf('month').format('YYYY-MM-DD');
      
      const response = await getReceptionHistoryRange(startDate, endDate);
      
      // Group data by date
      const dataByDate = {};
      response.data.forEach(record => {
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
    } finally {
      setLoading(false);
    }
  };

  const loadDayData = async (date) => {
    try {
      setLoading(true);
      const dateStr = date.format('YYYY-MM-DD');
      const response = await getReceptionHistoryRange(dateStr, dateStr);
      setSelectedDayData(response.data);
    } catch (error) {
      console.error('Day data loading error:', error);
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
    if (!selectedDayData) return null;

    return (
      <Card title={`Танланган кун: ${dayjs(selectedDayData[0]?.date).format('YYYY-MM-DD')}`}>
        <List
          dataSource={selectedDayData}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={item.status === 'present' ? 
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                }
                title={item.name}
                description={`${item.position} - ${item.department}`}
              />
              <div>
                <Text type="secondary">{dayjs(item.timeUpdated).format('HH:mm')}</Text>
              </div>
            </List.Item>
          )}
          locale={{
            emptyText: <Empty description="Маълумот мавжуд эмасMa'lumot mavjud emas" />
          }}
        />
      </Card>
    );
  };

  return (
    <Spin spinning={loading}>
      <Calendar 
        cellRender={cellRender}
        onSelect={onSelect}
        value={selectedDate ? dayjs(selectedDate) : undefined}
      />
      {selectedDayData && renderDayDetails()}
    </Spin>
  );
};

export default ReceptionHistory;
