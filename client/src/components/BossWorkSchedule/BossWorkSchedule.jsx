import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

import {
  Card,
  Calendar,
  Button,
  Empty,
  Row,
  Col,
  List,
  Tag,
  Spin,
  Badge
} from "antd";
import { PlusOutlined, EditOutlined, CalendarOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";

// Modal import
import DailyPlanModal from './DailyPlanModal';

// API services
import axios from "axios";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const BossWorkSchedule = ({ showMessage }) => {
  if (!showMessage || typeof showMessage.error !== 'function') {
    console.error('showMessage prop is required with error function');
    return null;
  }

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isDailyPlanModalVisible, setIsDailyPlanModalVisible] = useState(false);
  const [dailyPlanData, setDailyPlanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState({}); // Kalendar uchun badge ma'lumotlari

  useEffect(() => {
    fetchDailyPlan(selectedDate);
  }, [selectedDate]);

  // Oylik ma'lumotlarni yuklash (kalendar badge'lari uchun)
  useEffect(() => {
    loadMonthlyData(selectedDate);
  }, [selectedDate.format('YYYY-MM')]);

  const isDateEditable = (date) => {
    const selectedDay = dayjs(date).startOf('day');
    const today = dayjs().startOf('day');
    return selectedDay.isSameOrAfter(today);
  };

  // Kunlik rejani yuklash
  const fetchDailyPlan = async (date) => {
    try {
      setLoading(true);
      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      const response = await axios.get(`/api/schedule/daily-plan/${formattedDate}`);

      if (response.data?.success) {
        setDailyPlanData(response.data.data);
      } else {
        setDailyPlanData(null);
      }
    } catch (error) {
      console.error("Kunlik reja yuklashda xatolik:", error);
      // 404 xatolikni ignore qilish (reja yo'q bo'lsa)
      if (error.response?.status !== 404) {
        showMessage.error("Кунлик режа маълумотларини юклашда хатолик");
      }
      setDailyPlanData(null);
    } finally {
      setLoading(false);
    }
  };

  // Oylik ma'lumotlarni yuklash
  const loadMonthlyData = async (date) => {
    try {
      const startOfMonth = date.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = date.endOf('month').format('YYYY-MM-DD');

      const response = await axios.get(`/api/schedule/monthly-summary`, {
        params: { startDate: startOfMonth, endDate: endOfMonth }
      });

      if (response.data?.success) {
        setCalendarData(response.data.data || {});
      }
    } catch (error) {
      console.error("Oylik ma'lumotlarni yuklashda xatolik:", error);
    }
  };

  // Modal ochish
  const handleModalOpen = () => {
    setIsDailyPlanModalVisible(true);
  };

  // Modal yopish va ma'lumotlarni yangilash
  const handleModalClose = () => {
    setIsDailyPlanModalVisible(false);
    fetchDailyPlan(selectedDate);
    loadMonthlyData(selectedDate);
  };

  // Element uchun ikonka olish
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

  // Element uchun tag olish
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

  // Calendar cell render - yangi format
  const cellRender = (current, info) => {
    // Faqat date cell'lar uchun
    if (info.type !== 'date') {
      return info.originNode;
    }

    const dateKey = current.format('YYYY-MM-DD');
    const dayData = calendarData[dateKey];

    if (!dayData || dayData.totalItems === 0) {
      return info.originNode;
    }

    return (
      <div style={{ position: 'relative' }}>
        {info.originNode}
        <div style={{ position: 'absolute', top: 2, right: 2 }}>
          <Badge
            count={dayData.totalItems}
            size="small"
            style={{
              backgroundColor: dayData.totalItems > 3 ? '#ff4d4f' : '#52c41a'
            }}
          />
        </div>
      </div>
    );
  };

  // Rejalar mavjudligini tekshirish
  const hasPlans = dailyPlanData?.items?.length > 0;
  const totalItems = dailyPlanData?.summary?.totalItems || 0;

  return (
    <Row gutter={[16, 16]}>
      {/* Calendar */}
      <Col span={8}>
        <Card>
          <Calendar
            fullscreen={false}
            value={selectedDate}
            onChange={setSelectedDate}
            cellRender={cellRender}
          />
        </Card>
      </Col>

      {/* Kunlik reja ko'rinishi */}
      <Col span={16}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{selectedDate.format("DD MMMM YYYY")}</span>
              {totalItems > 0 && (
                <Tag color="blue">{totalItems} та режа</Tag>
              )}
            </div>
          }
          extra={
            isDateEditable(selectedDate) && (
              <Button
                type="primary"
                icon={hasPlans ? <EditOutlined /> : <PlusOutlined />}
                onClick={handleModalOpen}
              >
                {hasPlans ? "Таҳрирлаш" : "Жадвал қўшиш"}
              </Button>
            )
          }
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Юкланмоқда...</div>
            </div>
          ) : hasPlans ? (
            <div>
              {/* Qisqacha hisobot */}
              <div style={{
                marginBottom: 16,
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap'
              }}>
                {dailyPlanData.summary.totalTasks > 0 && (
                  <span>
                    <CalendarOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                    {dailyPlanData.summary.totalTasks} вазифа
                  </span>
                )}
                {dailyPlanData.summary.totalReceptions > 0 && (
                  <span>
                    <UserOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    {dailyPlanData.summary.totalReceptions} қабул
                  </span>
                )}
                {dailyPlanData.summary.totalMeetings > 0 && (
                  <span>
                    <TeamOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    {dailyPlanData.summary.totalMeetings} мажлис
                  </span>
                )}
              </div>

              {/* Rejalar ro'yxati */}
              <List
                dataSource={dailyPlanData.items}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      width: '100%'
                    }}>
                      {/* Ikonka */}
                      <div style={{ marginTop: 4 }}>
                        {getItemIcon(item.type)}
                      </div>

                      {/* Ma'lumotlar */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4
                        }}>
                          <strong style={{ fontSize: '14px' }}>
                            {item.time}
                            {item.endTime && ` - ${item.endTime}`}
                          </strong>
                          {getItemTag(item.type)}
                        </div>

                        <div style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#262626',
                          marginBottom: 2
                        }}>
                          {item.title}
                        </div>

                        {item.description && (
                          <div style={{
                            fontSize: '13px',
                            color: '#666',
                            marginBottom: 2
                          }}>
                            {item.description}
                          </div>
                        )}

                        {/* Qo'shimcha ma'lumotlar */}
                        {item.type === 'reception' && (item.department || item.position) && (
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {item.position && `${item.position}`}
                            {item.department && ` • ${item.department}`}
                          </div>
                        )}

                        {item.type === 'meeting' && item.location && (
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            📍 {item.location}
                            {item.participants && ` • Иштирокчилар: ${item.participants.length}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          ) : (
            <Empty
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    {isDateEditable(selectedDate)
                      ? "Бу кун учун режа тузилмаган"
                      : "Бу кун учун иш режа мавжуд эмас"
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {isDateEditable(selectedDate)
                      ? "Янги режа тузиш учун юқоридаги тугмани босинг"  // <-- Bu qatorni o'zgartirdim
                      : "Фақат келажак сана учун режа тузиш мумкин"
                    }
                  </div>
                </div>
              }
              style={{ padding: '60px 20px' }}
            >
              {/* Bu Button ni olib tashlash kerak */}
              {/* Chunki yuqorida Card extra qismida tugma bor */}
            </Empty>
          )}
        </Card>
      </Col>

      {/* DailyPlanModal */}
      <DailyPlanModal
        date={selectedDate.format('YYYY-MM-DD')}
        isOpen={isDailyPlanModalVisible}
        onClose={handleModalClose}
        showMessage={showMessage}
      />
    </Row>
  );
};

BossWorkSchedule.propTypes = {
  showMessage: PropTypes.shape({
    success: PropTypes.func.isRequired,
    error: PropTypes.func.isRequired,
    warning: PropTypes.func.isRequired,
    info: PropTypes.func.isRequired
  }).isRequired
};

export default BossWorkSchedule;