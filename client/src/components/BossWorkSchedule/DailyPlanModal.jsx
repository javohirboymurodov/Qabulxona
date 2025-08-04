import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Components
import DailyPlanView from './DailyPlanView';
import TaskForm from './TaskForm';
import ReceptionForm from './ReceptionForm';
import AddMeetingModal from '../Meetings/AddMeetingModal'; // <-- Mavjud modal

// API services
import { getDailyPlan, saveDailyPlan, getEmployees } from '../../services/api';

const DailyPlanModal = ({ date, isOpen, onClose, showMessage, onSave }) => {
  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for each type
  const [tasks, setTasks] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]); // <-- Employees uchun

  // Meeting modal state
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // Load employees
  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      loadDailyPlan();
    }
  }, [isOpen, date]);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Employees yuklashda xatolik:', error);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && date) {
      loadDailyPlan();
    }
  }, [isOpen, date]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('view');
      setTasks([]);
      setReceptions([]);
      setMeetings([]);
    }
  }, [isOpen]);

  const loadDailyPlan = async () => {
    try {
      setLoading(true);
      const response = await getDailyPlan(date);
      
      if (response.data?.success) {
        const data = response.data.data;
        
        // Separate data by type
        const taskItems = data.items?.filter(item => item.type === 'task') || [];
        const receptionItems = data.items?.filter(item => item.type === 'reception') || [];
        const meetingItems = data.items?.filter(item => item.type === 'meeting') || [];
        
        setTasks(taskItems);
        setReceptions(receptionItems);
        setMeetings(meetingItems);
      }
    } catch (error) {
      console.error('Kunlik rejani yuklashda xatolik:', error);
      if (error.response?.status !== 404) {
        showMessage?.error('Маълумотларни юклашда хатолик');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      const allItems = [
        ...tasks.map(task => ({ ...task, type: 'task' })),
        ...receptions.map(reception => ({ ...reception, type: 'reception' })),
        ...meetings.map(meeting => ({ ...meeting, type: 'meeting' }))
      ];

      if (allItems.length === 0) {
        showMessage?.warning('Сақлаш учун камида бита режа қўшинг');
        return;
      }

      const response = await saveDailyPlan(date, allItems);
      
      if (response.data?.success) {
        showMessage?.success('Кунлик режа муваффақиятли сақланди');
        onSave?.();
        onClose();
      } else {
        throw new Error(response.data?.message || 'Сақлашда хатолик');
      }
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
      showMessage?.error('Режани сақлашда хатолик юз берди');
    } finally {
      setSaving(false);
    }
  };

  // Handler functions for each form
  const handleTaskAdd = (newTask) => {
    setTasks(prev => [...prev, { ...newTask, id: Date.now() }]);
  };

  const handleTaskRemove = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleReceptionAdd = (newReception) => {
    setReceptions(prev => [...prev, { ...newReception, id: Date.now() }]);
  };

  const handleReceptionRemove = (receptionId) => {
    setReceptions(prev => prev.filter(reception => reception.id !== receptionId));
  };

  // Meeting handlers
  const handleMeetingAdd = () => {
    setEditingMeeting(null);
    setShowMeetingModal(true);
  };

  const handleMeetingEdit = (meeting) => {
    setEditingMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleMeetingModalClose = (shouldRefresh, meetingData) => {
    setShowMeetingModal(false);
    setEditingMeeting(null);
    
    // Agar meeting saqlandi - local state'ga qo'shish
    if (shouldRefresh && meetingData) {
      const newMeeting = {
        id: Date.now(),
        name: meetingData.name,
        time: meetingData.time,
        location: meetingData.location,
        description: meetingData.description,
        participants: meetingData.participants || [],
        date: meetingData.date
      };
      setMeetings(prev => [...prev, newMeeting]);
    }
  };

  const handleMeetingRemove = (meetingId) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
  };

  const totalItems = tasks.length + receptions.length + meetings.length;

  const tabItems = [
    {
      key: 'view',
      label: `Кўриш (${totalItems})`,
      children: loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Юкланмоқда...</div>
        </div>
      ) : (
        <DailyPlanView
          tasks={tasks}
          receptions={receptions}
          meetings={meetings}
          onRemoveTask={handleTaskRemove}
          onRemoveReception={handleReceptionRemove}
          onRemoveMeeting={handleMeetingRemove}
          onSaveAll={handleSaveAll}
          loading={saving}
        />
      )
    },
    {
      key: 'task',
      label: `Вазифалар (${tasks.length})`,
      children: (
        <TaskForm
          tasks={tasks}
          onAddTask={handleTaskAdd}
          onRemoveTask={handleTaskRemove}
        />
      )
    },
    {
      key: 'reception',
      label: `Қабуллар (${receptions.length})`,
      children: (
        <ReceptionForm
          receptions={receptions}
          onAddReception={handleReceptionAdd}
          onRemoveReception={handleReceptionRemove}
          employees={employees} // <-- Employees prop qo'shish
        />
      )
    },
    {
      key: 'meeting',
      label: `Мажлислар (${meetings.length})`,
      children: (
        <div>
          {/* Meeting list va add button */}
          <Button 
            type="dashed" 
            onClick={handleMeetingAdd}
            block
            size="large"
            style={{ marginBottom: 16 }}
          >
            Мажлис қўшиш
          </Button>
          
          {/* Meetings list */}
          {meetings.length > 0 && (
            <div>
              {meetings.map(meeting => (
                <div key={meeting.id} style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: 12, 
                  marginBottom: 8,
                  borderRadius: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{meeting.name}</strong>
                      <div>{meeting.time} | {meeting.location}</div>
                    </div>
                    <div>
                      <Button size="small" onClick={() => handleMeetingEdit(meeting)}>
                        Таҳрир
                      </Button>
                      <Button 
                        size="small" 
                        danger 
                        onClick={() => handleMeetingRemove(meeting.id)}
                        style={{ marginLeft: 8 }}
                      >
                        Ўчириш
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <Modal 
        open={isOpen} 
        onCancel={onClose} 
        width={1200}
        title={`${dayjs(date).format('DD.MM.YYYY')} - Рахбар кунлик иш режаси`}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Ёпиш
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />}
            loading={saving}
            disabled={totalItems === 0}
            onClick={handleSaveAll}
          >
            Барчасини сақлаш ({totalItems})
          </Button>
        ]}
        style={{ top: 20 }}
        zIndex={1000}
        destroyOnHidden
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Modal>

      {/* AddMeetingModal - mavjud modal */}
      <AddMeetingModal
        visible={showMeetingModal}
        onClose={handleMeetingModalClose}
        onSave={(meetingData) => handleMeetingModalClose(true, meetingData)}
        employees={employees}
        initialValues={editingMeeting}
        preSelectedEmployees={[]}
        defaultDate={date}
      />
    </>
  );
};

export default DailyPlanModal;