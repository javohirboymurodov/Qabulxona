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
  // State'larni tozalash
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dailyPlanData, setDailyPlanData] = useState({});
  const [loading, setLoading] = useState(false);
  // const [isDailyPlanModalVisible, setIsDailyPlanModalVisible] = useState(false); // OLIB TASHLASH
  const [showDailyPlan, setShowDailyPlan] = useState(false); // FAQAT BUNI QOLDIRISH

  // useEffect'lar
  useEffect(() => {
    fetchDailyPlan(selectedDate);
  }, [selectedDate]);

  const isDateEditable = (date) => {
    const selectedDay = dayjs(date).startOf('day');
    const today = dayjs().startOf('day');
    return selectedDay.isSameOrAfter(today);
  };

  // Kunlik rejani yuklash (haqiqiy API call)
  const fetchDailyPlan = async (date) => {
    try {
      setLoading(true);
      const dateStr = date.format('YYYY-MM-DD');
      
      console.log('Fetching daily plan for:', dateStr);
      
      // Haqiqiy API call
      const response = await axios.get(`http://localhost:5000/api/schedule/daily-plan/${dateStr}`);
      
      console.log('Daily plan response:', response.data);
      
      if (response.data.success) {
        setDailyPlanData({
          items: response.data.data.items || [],
          summary: response.data.data.summary || {
            totalItems: 0,
            totalTasks: 0,
            totalReceptions: 0,
            totalMeetings: 0
          }
        });
      } else {
        // Ma'lumot topilmagan holatda
        setDailyPlanData({
          items: [],
          summary: {
            totalItems: 0,
            totalTasks: 0,
            totalReceptions: 0,
            totalMeetings: 0
          }
        });
      }
    } catch (error) {
      console.error('Daily plan fetch error:', error);
      // Xatolik holatida ham bo'sh data
      setDailyPlanData({
        items: [],
        summary: {
          totalItems: 0,
          totalTasks: 0,
          totalReceptions: 0,
          totalMeetings: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Calendar onSelect handler
  const onSelect = (date) => {
    setSelectedDate(date);
    fetchDailyPlan(date);
  };

  // Modal ochish/yopish funksiyalarini tuzatish
  const handleModalOpen = () => {
    setShowDailyPlan(true); // to'g'ri state ishlatish
  };

  const handleModalClose = () => {
    setShowDailyPlan(false);
    // Ma'lumotlarni yangilash
    fetchDailyPlan(selectedDate);
  };

  // Rejalar mavjudligini tekshirish
  const hasPlans = dailyPlanData?.items?.length > 0;
  const totalItems = dailyPlanData?.summary?.totalItems || 0;

  return (
    <div className="boss-work-schedule">
      <Row gutter={[16, 16]}>
        {/* Chap ustun - Kalendar (1/3) */}
        <Col xs={24} lg={8}>
          <Card title="Иш режаси календари">
            <Calendar 
              fullscreen={false} 
              onSelect={onSelect}
              value={selectedDate}
              // cellRender ni umuman olib tashlash - sodda kalendar
            />
          </Card>
        </Col>

        {/* O'ng ustun - Tanlangan kun ma'lumotlari (2/3) */}
        <Col xs={24} lg={16}>
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
                  onClick={handleModalOpen} // Bu to'g'ri
                >
                  {hasPlans ? "Таҳрирлаш" : "Жадвал қўшиш"}
                </Button>
              )
            }
            loading={loading}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Юкланмоқда...</div>
              </div>
            ) : hasPlans ? (
              <div>
                {/* Summary */}
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

                {/* Plan items list */}
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
                        <div style={{ marginTop: 4 }}>
                          {getItemIcon(item.type)}
                        </div>

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

                          {/* Type-specific details */}
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
                        ? "Янги режа тузиш учун юқоридаги тугмани босинг"
                        : "Фақат келажак сана учун режа тузиш мумкин"
                      }
                    </div>
                  </div>
                }
                style={{ padding: '60px 20px' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Daily Plan Modal */}
      <DailyPlanModal
        date={selectedDate}
        isOpen={showDailyPlan}
        onClose={() => {
          setShowDailyPlan(false);
          // Modal yopilganda ma'lumotlarni qayta yuklash
          fetchDailyPlan(selectedDate);
        }}
        onSave={(savedData) => {
          console.log('Daily plan saved:', savedData);
          // Saqlangandan keyin ham ma'lumotlarni yangilash
          setTimeout(() => {
            fetchDailyPlan(selectedDate);
          }, 500);
        }}
      />
    </div>
  );
};

// Helper funksiyalar (component ichida yoki tashqarida)
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

export default BossWorkSchedule;