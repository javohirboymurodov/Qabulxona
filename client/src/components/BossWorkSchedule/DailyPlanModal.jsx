import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  Button, 
  List, 
  Tag, 
  Empty, 
  Spin, 
  App,
  Card,
  Space
} from 'antd';

import { SaveOutlined} from '@ant-design/icons';

// Components import
import dayjs from 'dayjs';
import AddReceptionModal from '../Reseption/AddReceptionModal';
import AddMeetingModal from '../Meetings/AddMeetingModal';
import TaskModal from './TaskModal';
import DailyPlanView from './DailyPlanView';

// API services import
import { getDailyPlan, saveDailyPlan, getEmployees } from '../../services/api';

const DailyPlanModal = ({ date, isOpen, onClose, showMessage, onSave }) => {
  const { message: messageApi } = App.useApp();

  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // State for each type
  const [tasks, setTasks] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]); // Barcha item'lar uchun umumiy state
  const [deletedItems, setDeletedItems] = useState([]); // O'chirilgan item'lar

  // Modal states
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      loadEmployees();
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
      setEmployees([]); // Employees ham reset qilish
      setItems([]); // Items ham reset qilish
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      console.log('Loading employees...');
      
      const response = await getEmployees();
      console.log('Employees response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        setEmployees(response.data);
        console.log('Employees loaded:', response.data.length);
      } else if (response && Array.isArray(response)) {
        setEmployees(response);
        console.log('Employees loaded (direct array):', response.length);
      } else {
        console.warn('Employees data not found or invalid format');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Employees yuklashda xatolik:', error);
      setEmployees([]);
      showMessage?.error('Ходимларни юклашда хатолик');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadDailyPlan = async () => {
    try {
      setLoading(true);
      console.log('Loading daily plan for date:', date);
      
      const response = await getDailyPlan(date);
      console.log('Daily plan loaded:', response);
      
      if (response.success && response.data) {
        const allItems = (response.data.items || []).map(item => ({
          ...item,
          isNew: false // Backend'dan kelgan ma'lumotlar yangi emas
        }));
        
        // Barcha item'larni set qilish
        setItems(allItems);
        
        // Type bo'yicha ajratish
        const receptionItems = allItems.filter(item => item.type === 'reception');
        const meetingItems = allItems.filter(item => item.type === 'meeting');
        const taskItems = allItems.filter(item => item.type === 'task');
        
        setReceptions(receptionItems);
        setMeetings(meetingItems);
        setTasks(taskItems);
        
        console.log('Data loaded and separated:', {
          total: allItems.length,
          receptions: receptionItems.length,
          meetings: meetingItems.length,
          tasks: taskItems.length
        });
      }
    } catch (error) {
      console.error('Daily plan load error:', error);
      messageApi.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleReceptionModalSave = (receptionData) => {
    console.log('Reception modal data received:', receptionData);
    
    const newReception = {
      id: Date.now() + Math.random(), // Unique ID
      type: 'reception',
      employeeId: receptionData.data.employeeId,
      name: receptionData.data.name,
      position: receptionData.data.position,
      department: receptionData.data.department,
      phone: receptionData.data.phone,
      status: receptionData.data.status,
      scheduledTime: receptionData.time, // Asosiy qabul vaqti (xodim keladigan vaqt)
      date: date, // selectedDate -> date
      isNew: true // Yangi item flag
    };
    
    console.log('Adding reception to local state:', newReception);
    setReceptions(prev => [...prev, newReception]);
    setItems(prev => [...prev, newReception]); // items'ga ham qo'shish
    setShowReceptionModal(false);
    showMessage?.success('Қабул кунлик режага қўшилди');
  };

  // DailyPlanModal.jsx'da
  const handleMeetingModalSave = (meetingData) => {
    console.log('=== Meeting Modal Save Callback ===');
    console.log('Meeting modal data received:', meetingData);
    
    const newMeeting = {
      id: Date.now() + Math.random(), // Unique ID
      type: 'meeting', // TYPE MUHIM!
      time: meetingData.time,
      name: meetingData.data.name, // NAME
      title: meetingData.data.name, // TITLE ham qo'shish
      description: meetingData.data.description || '',
      location: meetingData.data.location || '',
      participants: meetingData.data.participants || [],
      date: date,
      isNew: true
    };
    
    console.log('Adding meeting to local state with all fields:', newMeeting);
    setItems(prev => [...prev, newMeeting]);
    setMeetings(prev => [...prev, newMeeting]);
    setShowMeetingModal(false);
  };

  // DailyPlanModal.jsx da handleTaskModalSave callback qo'shish
  const handleTaskModalSave = (taskData) => {
    console.log('Task modal data received:', taskData);
    
    const newTask = {
      id: Date.now() + Math.random(), // Unique ID
      type: 'task',
      time: taskData.time,
      title: taskData.data.title,
      description: taskData.data.description,
      priority: taskData.data.priority || 'normal',
      status: taskData.data.status || 'pending',
      date: date,
      isNew: true
    };
    
    console.log('Adding task to local state:', newTask);
    setTasks(prev => [...prev, newTask]);
    setItems(prev => [...prev, newTask]); // items'ga ham qo'shish
    setShowTaskModal(false);
  };

  // DailyPlanModal.jsx da handleSaveAll funksiyasida
  const handleSaveAll = async () => {
    try {
      setLoading(true);
      
      const newItems = items.filter(item => item.isNew === true);
      
      console.log('=== FILTER DEBUG ===');
      console.log('Total items:', items.length);
      console.log('Items with isNew flag:', items.map(item => ({ id: item.id, type: item.type, isNew: item.isNew })));
      console.log('Filtered new items:', newItems.length);
      console.log('Deleted items:', deletedItems.length);
      
      console.log('=== SAVE ALL DEBUG ===');
      console.log('All items:', items);
      console.log('New items to save:', newItems);
      console.log('Deleted items to remove:', deletedItems);
      console.log('Tasks:', tasks);
      console.log('Receptions:', receptions);
      console.log('Meetings:', meetings);
      
      if (newItems.length === 0 && deletedItems.length === 0) {
        setLoading(false);
        messageApi.info('Сақлаш учун янги маълумотлар йўқ');
        return;
      }

      const response = await saveDailyPlan(date, newItems, deletedItems);
      console.log('Save response:', response);

      if (response.success) {
        const totalChanges = newItems.length + deletedItems.length;
        messageApi.success(`${totalChanges} та ўзгариш муваффақиятли сақланди`);
        
        // O'chirilgan item'larni tozalash
        setDeletedItems([]);
        
        // Local state'ni yangilash - vaqtinchalik ID'larni server ID'ga almashtirish
        const updatedItems = items.map(item => {
          if (typeof item.id === 'number') {
            return {
              ...item,
              id: `saved_${item.id}`,
              isNew: false
            };
          }
          return item;
        });
        
        setItems(updatedItems);
        
        // Backend'dan yangi ma'lumotlarni qayta yuklash
        console.log('Reloading data from backend...');
        await loadDailyPlan();
        
        // Modal'ni yopish (2-3 soniya kutib)
        setTimeout(() => {
          onClose();
        }, 1500);
        
      } else {
        messageApi.error(response.message || 'Сақлашда хатолик юз берди');
      }
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
      messageApi.error('Сақлашда хатолик юз берди');
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for each form
  const handleTaskAdd = (newTask) => {
    setTasks(prev => [...prev, { ...newTask, id: Date.now() }]);
  };

  const handleTaskRemove = (taskId) => {
    console.log('🗑️ Removing task:', taskId);
    
    // Agar backend'dan kelgan item bo'lsa (string ID), deletion tracking
    if (typeof taskId === 'string') {
      setDeletedItems(prev => [...prev, { id: taskId, type: 'task' }]);
    }
    
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setItems(prev => prev.filter(item => item.id !== taskId));
  };

  // Reception handlers
  const handleReceptionAdd = () => {
    if (employees.length === 0) {
      showMessage?.warning('Ходимлар юкланмаган. Илтимос, бир оз кутинг.');
      return;
    }
    setShowReceptionModal(true);
  };

  // handleReceptionModalClose - o'chirildi, handleReceptionModalSave ishlatiladi

  const handleReceptionRemove = (receptionId) => {
    console.log('🗑️ Removing reception:', receptionId);
    
    // Agar backend'dan kelgan item bo'lsa (string ID), deletion tracking
    if (typeof receptionId === 'string') {
      setDeletedItems(prev => [...prev, { id: receptionId, type: 'reception' }]);
    }
    
    setReceptions(prev => prev.filter(reception => reception.id !== receptionId));
    setItems(prev => prev.filter(item => item.id !== receptionId));
  };

  // Meeting handlers
  const handleMeetingAdd = () => {
    if (employees.length === 0) {
      showMessage?.warning('Ходимлар юкланмаган. Илтимос, бир оз кутинг.');
      return;
    }
    setEditingMeeting(null);
    setShowMeetingModal(true);
  };

  const handleMeetingEdit = (meeting) => {
    setEditingMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleMeetingRemove = (meetingId) => {
    console.log('🗑️ Removing meeting:', meetingId);
    
    // Agar backend'dan kelgan item bo'lsa (string ID), deletion tracking
    if (typeof meetingId === 'string') {
      setDeletedItems(prev => [...prev, { id: meetingId, type: 'meeting' }]);
    }
    
    setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    setItems(prev => prev.filter(item => item.id !== meetingId));
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
        <div>
          {/* Task qo'shish tugmasi */}
          <Button 
            type="dashed" 
            onClick={() => setShowTaskModal(true)}
            block
            size="large"
            style={{ marginBottom: 16 }}
          >
            Вазифа қўшиш
          </Button>
          
          {/* Tasks list */}
          {tasks.length > 0 && (
            <div>
              {tasks.map(task => (
                <div key={task.id} style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: 12, 
                  marginBottom: 8,
                  borderRadius: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{task.title}</strong>
                      <div>{task.time} | {task.priority}</div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <Button 
                        size="small" 
                        danger 
                        onClick={() => handleTaskRemove(task.id)}
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
    },
    {
      key: 'reception',
      label: `Қабуллар (${receptions.length})`,
      children: (
        <div>
          {/* Reception qo'shish tugmasи */}
          <Button 
            type="dashed" 
            onClick={handleReceptionAdd}
            block
            size="large"
            style={{ marginBottom: 16 }}
            loading={employeesLoading}
            disabled={employeesLoading}
          >
            {employeesLoading ? 'Ходимлар юкланмоқда...' : 'Қабулга қўшиш'}
          </Button>
          
          {/* Employees info */}
          {!employeesLoading && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: 16,
              padding: '8px 12px',
              backgroundColor: '#f6f8fa',
              borderRadius: 4
            }}>
              Мавжуд ходимлар: {employees.length} та
            </div>
          )}
          
          {/* Receptions list */}
          {receptions.length > 0 && (
            <div>
              {receptions.map(reception => (
                <div key={reception.id} style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: 12, 
                  marginBottom: 8,
                  borderRadius: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{reception.name}</strong>
                      <div>{reception.time} | {reception.position}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {reception.department}
                      </div>
                    </div>
                    <div>
                      <Button 
                        size="small" 
                        danger 
                        onClick={() => handleReceptionRemove(reception.id)}
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
            loading={employeesLoading}
            disabled={employeesLoading}
          >
            {employeesLoading ? 'Ходимлар юкланмоқда...' : 'Мажлис қўшиш'}
          </Button>
          
          {/* Employees info */}
          {!employeesLoading && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: 16,
              padding: '8px 12px',
              backgroundColor: '#f6f8fa',
              borderRadius: 4
            }}>
              Мавжуд ходимлар: {employees.length} та
            </div>
          )}
          
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
      
      {/* AddMeetingModal - employees yuklangandan keyin ko'rsatish */}
      {showMeetingModal && employees.length > 0 && (
        <AddMeetingModal
          visible={showMeetingModal}
          onClose={() => setShowMeetingModal(false)} // ODDIY CLOSE
          onSave={handleMeetingModalSave} // TO'G'RI SAVE CALLBACK
          employees={employees}
          initialData={editingMeeting}
          preSelectedEmployees={[]}
          defaultDate={date}
        />
      )}

      {/* AddReceptionModal - reception modal */}
      {showReceptionModal && employees.length > 0 && (
        <AddReceptionModal
          visible={showReceptionModal}
          onClose={() => setShowReceptionModal(false)} // Sodda close
          onSave={handleReceptionModalSave} // Faqat save callback
          employees={employees}
          preSelectedEmployees={[]}
          defaultDate={date}
        />
      )}

      {/* DailyPlanModal.jsx da modal chaqirish */}
      {showTaskModal && (
        <TaskModal
          visible={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSave={handleTaskModalSave}
          defaultDate={date}
        />
      )}
    </>
  );
};

export default DailyPlanModal;