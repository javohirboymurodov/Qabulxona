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
  Tag,
  Spin,
  Badge,
  Modal
} from "antd";
import { PlusOutlined, EditOutlined, FilePdfOutlined } from "@ant-design/icons";

// Modal import
import DailyPlanModal from './DailyPlanModal';

// Components
import ScheduleTable from '../Common/ScheduleTable';

// API services
import { getDailyPlan } from '../../services/api';

// PDF Generator will be dynamically imported

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const BossWorkSchedule = ({ showMessage }) => {
  // State'larni tozalash
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dailyPlanData, setDailyPlanData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);



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
      
      // Haqiqiy API call with JWT token (automatic via service)
      const response = await getDailyPlan(dateStr);
      
      console.log('Daily plan response:', response);
      
      if (response.success) {
        setDailyPlanData({
          items: response.data.items || [],
          summary: response.data.summary || {
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



  // PDF generation handler with dynamic import
  const handleGeneratePDF = async () => {
    try {
      setPdfGenerating(true);
      console.log('🔄 PDF: Starting PDF generation...');
      
      // Dynamic import of PDF generator
      const { generateSchedulePDF } = await import('../../utils/pdfGenerator');
      
      const result = await generateSchedulePDF(dailyPlanData, selectedDate);
      
      if (result && result.success) {
        showMessage?.success?.(result.message || 'PDF муваффақиятли яратилди');
        console.log('✅ PDF generated:', result.fileName);
      } else {
        throw new Error(result?.message || 'PDF generation failed');
      }
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      showMessage?.error?.('PDF яратишда хатолик: ' + (error.message || 'Номаълум хатолик'));
    } finally {
      setPdfGenerating(false);
    }
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
              <div style={{ display: 'flex', gap: 8 }}>
                {/* PDF Download Button */}
                {hasPlans && (
                  <Button
                    icon={<FilePdfOutlined />}
                    onClick={handleGeneratePDF}
                    loading={pdfGenerating}
                    title="PDF yuklash"
                  >
                    PDF
                  </Button>
                )}
                
                {/* Edit/Add Button - DailyPlanModal ochish */}
                {isDateEditable(selectedDate) && (
                  <Button
                    type="primary"
                    icon={hasPlans ? <EditOutlined /> : <PlusOutlined />}
                    onClick={handleModalOpen}
                    loading={loading}
                  >
                    {hasPlans ? "Таҳрирлаш" : "Жадвал қўшиш"}
                  </Button>
                )}
              </div>
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
                      📋 {dailyPlanData.summary.totalTasks} вазифа
                    </span>
                  )}
                  {dailyPlanData.summary.totalReceptions > 0 && (
                    <span>
                      👤 {dailyPlanData.summary.totalReceptions} қабул
                    </span>
                  )}
                  {dailyPlanData.summary.totalMeetings > 0 && (
                    <span>
                      🤝 {dailyPlanData.summary.totalMeetings} мажлис
                    </span>
                  )}
                </div>

                {/* Schedule Table - Faqat ko'rish uchun */}
                <ScheduleTable
                  dataSource={dailyPlanData.items}
                  loading={loading}
                  selectedDate={selectedDate}
                  showActions={false}
                  emptyText={
                    isDateEditable(selectedDate)
                      ? "Бу кун учун режа тузилмаган"
                      : "Бу кун учун иш режа мавжуд эмас"
                  }
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

// Helper funksiyalar endi ScheduleTable komponentida

export default BossWorkSchedule;