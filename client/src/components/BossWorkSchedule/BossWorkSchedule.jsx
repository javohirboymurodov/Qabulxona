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
import AddMeetingModal from '../Meetings/AddMeetingModal';
import AddReceptionModal from '../Reseption/AddReceptionModal';
import TaskModal from './TaskModal';

// API services
import { 
  getDailyPlan, 
  getEmployees, 
  updateMeeting, 
  deleteMeeting,
  deleteTask,
  deleteReceptionItem
} from '../../services/api';

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
  
  // Individual edit modal states
  const [employees, setEmployees] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);


  useEffect(() => {
    fetchDailyPlan(selectedDate);
    loadEmployees(); // Employees'ni yuklash
  }, [selectedDate]);

  // Load employees for modals
  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response?.data && Array.isArray(response.data)) {
        setEmployees(response.data);
      } else if (response && Array.isArray(response)) {
        setEmployees(response);
      }
    } catch (error) {
      console.error('Employees loading error:', error);
      setEmployees([]);
    }
  };

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

  // Modal states for individual editing
  const [editingItem, setEditingItem] = useState(null);
  const [editModalType, setEditModalType] = useState(null); // 'task', 'meeting', 'reception'

  // Modal ochish/yopish funksiyalarini tuzatish
  const handleModalOpen = () => {
    setShowDailyPlan(true); // to'g'ri state ishlatish
  };

  const handleModalClose = () => {
    setShowDailyPlan(false);
    // Ma'lumotlarni yangilash
    fetchDailyPlan(selectedDate);
  };

  // Individual item actions
  const handleViewItem = (item) => {
    console.log('View item:', item);
    // View modal ochish (ixtiyoriy)
  };

  const handleEditItem = (item) => {
    console.log('Edit item:', item);
    setEditingItem(item);
    setEditModalType(item.type);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditModalType(null);
  };

  const handleEditModalSave = async () => {
    try {
      setEditLoading(true);
      // Edit saqlangandan keyin ma'lumotlarni yangilash
      await fetchDailyPlan(selectedDate);
      handleEditModalClose();
      showMessage?.success('Маълумот муваффақиятли янгиланди');
    } catch (error) {
      console.error('Edit save error:', error);
      showMessage?.error('Янгилашда хатолик юз берди');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteItem = (item) => {
    console.log('Delete item:', item);
    
    const typeNames = {
      'task': 'вазифани',
      'meeting': 'мажлисни', 
      'reception': 'қабулни'
    };
    
    Modal.confirm({
      title: 'Ўчириш тасдиқи',
      content: `Ҳақиқатан ҳам ушбу ${typeNames[item.type] || 'элементни'} ўчиришни истайсизми?`,
      okText: 'Ҳа, ўчириш',
      cancelText: 'Бекор қилиш',
      okType: 'danger',
      onOk: async () => {
        await handleConfirmDelete(item);
      }
    });
  };

  const handleConfirmDelete = async (item) => {
    try {
      setDeleteLoading(true);
      console.log('Deleting item:', item);
      
      // Type bo'yicha delete API chaqirish
      switch (item.type) {
        case 'meeting':
          if (item.id || item._id) {
            await deleteMeeting(item.id || item._id);
            showMessage?.success('Мажлис муваффақиятли ўчирилди');
          }
          break;
          
        case 'task':
          if (item.id || item._id) {
            await deleteTask(item.id || item._id);
            showMessage?.success('Вазифа муваффақиятли ўчирилди');
          }
          break;
          
        case 'reception':
          if (item.id || item._id) {
            await deleteReceptionItem(item.id || item._id);
            showMessage?.success('Қабул муваффақиятли ўчирилди');
          }
          break;
          
        default:
          showMessage?.error('Номаълум элемент тури');
          return;
      }
      
      // Ma'lumotlarni qayta yuklash
      await fetchDailyPlan(selectedDate);
      
    } catch (error) {
      console.error('Delete error:', error);
      showMessage?.error('Ўчиришда хатолик юз берди: ' + (error.message || 'Номаълум хатолик'));
    } finally {
      setDeleteLoading(false);
    }
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
                
                {/* Edit/Add Button */}
                {isDateEditable(selectedDate) && (
                  <Button
                    type="primary"
                    icon={hasPlans ? <EditOutlined /> : <PlusOutlined />}
                    onClick={handleModalOpen}
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

                {/* Schedule Table - Yangi jadval format */}
                <ScheduleTable
                  dataSource={dailyPlanData.items}
                  loading={loading || deleteLoading}
                  selectedDate={selectedDate}
                  showActions={true}
                  emptyText={
                    isDateEditable(selectedDate)
                      ? "Бу кун учун режа тузилмаган"
                      : "Бу кун учун иш режа мавжуд эмас"
                  }
                  onView={handleViewItem}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
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

      {/* Individual Edit Modal'lar */}
      
      {/* Meeting Edit Modal */}
      {showEditModal && editModalType === 'meeting' && editingItem && (
        <AddMeetingModal
          visible={showEditModal}
          onClose={handleEditModalClose}
          onSuccess={handleEditModalSave}
          employees={employees}
          initialData={editingItem}
          loading={editLoading}
        />
      )}

      {/* Task Edit Modal */}
      {showEditModal && editModalType === 'task' && editingItem && (
        <TaskModal
          visible={showEditModal}
          onClose={handleEditModalClose}
          onSave={handleEditModalSave}
          defaultDate={selectedDate}
          initialData={editingItem}
          loading={editLoading}
        />
      )}

      {/* Reception Edit Modal */}
      {showEditModal && editModalType === 'reception' && editingItem && (
        <AddReceptionModal
          visible={showEditModal}
          onClose={handleEditModalClose}
          onSave={handleEditModalSave}
          employees={employees}
          initialData={editingItem}
          loading={editLoading}
        />
      )}
    </div>
  );
};

// Helper funksiyalar endi ScheduleTable komponentida

export default BossWorkSchedule;