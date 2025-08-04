import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Form, Input, TimePicker, Card, Space, Divider, List, Avatar, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Birlashtirilgan modal komponenti
const DailyPlanModal = ({ date, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('view');
  const [dailyPlan, setDailyPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // Vazifalar uchun state
  const [tasks, setTasks] = useState([]);
  const [taskForm] = Form.useForm();

  // Qabullar uchun state
  const [receptions, setReceptions] = useState([]);
  const [receptionForm] = Form.useForm();

  // Majlislar uchun state
  const [meetings, setMeetings] = useState([]);
  const [meetingForm] = Form.useForm();

  // Kunlik rejani yuklash
  const loadDailyPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/daily-plan/${date}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyPlan(data.data);
        // Ma'lumotlarni kategoriyalarga ajratish
        const taskItems = data.data.items?.filter(item => item.type === 'task') || [];
        const receptionItems = data.data.items?.filter(item => item.type === 'reception') || [];
        const meetingItems = data.data.items?.filter(item => item.type === 'meeting') || [];
        
        setTasks(taskItems);
        setReceptions(receptionItems);
        setMeetings(meetingItems);
      }
    } catch (error) {
      console.error('Kunlik rejani yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && date) {
      loadDailyPlan();
    }
  }, [isOpen, date]);

  // Yangi vazifa qo'shish
  const addNewTask = () => {
    taskForm.validateFields().then(values => {
      const newTask = {
        id: Date.now(),
        title: values.taskTitle,
        description: values.taskDescription,
        startTime: values.taskTime[0].format('HH:mm'),
        endTime: values.taskTime[1].format('HH:mm'),
        type: 'task'
      };
      setTasks([...tasks, newTask]);
      taskForm.resetFields();
    });
  };

  // Yangi qabul qo'shish
  const addNewReception = () => {
    receptionForm.validateFields().then(values => {
      const newReception = {
        id: Date.now(),
        name: values.receptionName,
        position: values.receptionPosition,
        department: values.receptionDepartment,
        purpose: values.receptionPurpose,
        time: values.receptionTime.format('HH:mm'),
        type: 'reception'
      };
      setReceptions([...receptions, newReception]);
      receptionForm.resetFields();
    });
  };

  // Yangi majlis qo'shish
  const addNewMeeting = () => {
    meetingForm.validateFields().then(values => {
      const newMeeting = {
        id: Date.now(),
        title: values.meetingTitle,
        description: values.meetingDescription,
        location: values.meetingLocation,
        time: values.meetingTime.format('HH:mm'),
        participants: values.meetingParticipants,
        type: 'meeting'
      };
      setMeetings([...meetings, newMeeting]);
      meetingForm.resetFields();
    });
  };

  // O'chirish funksiyalari
  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const removeReception = (id) => {
    setReceptions(receptions.filter(reception => reception.id !== id));
  };

  const removeMeeting = (id) => {
    setMeetings(meetings.filter(meeting => meeting.id !== id));
  };

  // Saqlash funksiyasi
  const saveAllPlans = async () => {
    try {
      setLoading(true);
      const allItems = [...tasks, ...receptions, ...meetings];
      
      const response = await fetch('/api/daily-plan/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          items: allItems
        })
      });

      if (response.ok) {
        // Muvaffaqiyat xabari
        console.log('Kunlik reja muvaffaqiyatli saqlandi');
        loadDailyPlan();
      }
    } catch (error) {
      console.error('Saqlashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kunlik reja ko'rinishi
  const DailyPlanView = () => {
    const allItems = [...tasks, ...receptions, ...meetings]
      .sort((a, b) => {
        const timeA = (a.startTime || a.time).replace(':', '');
        const timeB = (b.startTime || b.time).replace(':', '');
        return timeA - timeB;
      });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4>Kunlik ish rejasi - {dayjs(date).format('DD.MM.YYYY')}</h4>
          <Button type="primary" onClick={saveAllPlans} loading={loading}>
            Barchasini saqlash
          </Button>
        </div>
        
        {allItems.length > 0 ? (
          <List
            dataSource={allItems}
            renderItem={(item) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.type === 'task' && <CalendarOutlined style={{ color: '#1890ff' }} />}
                        {item.type === 'reception' && <UserOutlined style={{ color: '#52c41a' }} />}
                        {item.type === 'meeting' && <TeamOutlined style={{ color: '#faad14' }} />}
                        
                        <strong>{item.startTime || item.time}</strong>
                        {item.endTime && <span> - {item.endTime}</span>}
                        <Tag color={item.type === 'task' ? 'blue' : item.type === 'reception' ? 'green' : 'orange'}>
                          {item.type === 'task' ? 'Vazifa' : item.type === 'reception' ? 'Qabul' : 'Majlis'}
                        </Tag>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong>{item.title || item.name}</strong>
                      </div>
                      {(item.description || item.purpose) && (
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {item.description || item.purpose}
                        </div>
                      )}
                      {item.position && (
                        <div style={{ color: '#999', fontSize: '11px' }}>
                          {item.position} - {item.department}
                        </div>
                      )}
                      {item.location && (
                        <div style={{ color: '#999', fontSize: '11px' }}>
                          Joyi: {item.location}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            Bu kun uchun hozircha rejalar yo'q
          </div>
        )}
      </div>
    );
  };

  // Vazifalar formasi
  const TaskForm = () => (
    <div>
      <h4>Vazifalar rejasi</h4>
      <Form form={taskForm} layout="vertical">
        <Form.Item name="taskTitle" label="Vazifa nomi" rules={[{ required: true }]}>
          <Input placeholder="Vazifa nomini kiriting" />
        </Form.Item>
        <Form.Item name="taskTime" label="Vaqt oralig'i" rules={[{ required: true }]}>
          <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="taskDescription" label="Tavsif">
          <Input.TextArea rows={3} placeholder="Vazifa tavsifini kiriting" />
        </Form.Item>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addNewTask} block>
          Yangi vazifa qo'shish
        </Button>
      </Form>

      <Divider />

      <div>
        <h5>Qo'shilgan vazifalar ({tasks.length})</h5>
        {tasks.map((task) => (
          <Card key={task.id} size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{task.startTime} - {task.endTime}</strong>
                <div>{task.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{task.description}</div>
              </div>
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeTask(task.id)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // Qabullar formasi
  const ReceptionForm = () => (
    <div>
      <h4>Rahbar qabuli</h4>
      <Form form={receptionForm} layout="vertical">
        <Form.Item name="receptionName" label="F.I.Sh" rules={[{ required: true }]}>
          <Input placeholder="To'liq ism kiriting" />
        </Form.Item>
        <Form.Item name="receptionPosition" label="Lavozimi" rules={[{ required: true }]}>
          <Input placeholder="Lavozimini kiriting" />
        </Form.Item>
        <Form.Item name="receptionDepartment" label="Bo'limi">
          <Input placeholder="Bo'limini kiriting" />
        </Form.Item>
        <Form.Item name="receptionTime" label="Qabul vaqti" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="receptionPurpose" label="Qabul maqsadi">
          <Input.TextArea rows={3} placeholder="Qabul maqsadini kiriting" />
        </Form.Item>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addNewReception} block>
          Qabulga qo'shish
        </Button>
      </Form>

      <Divider />

      <div>
        <h5>Qabulga yozilganlar ({receptions.length})</h5>
        {receptions.map((reception) => (
          <Card key={reception.id} size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <strong>{reception.time}</strong>
                  <span>{reception.name}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {reception.position} - {reception.department}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{reception.purpose}</div>
              </div>
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeReception(reception.id)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // Majlislar formasi
  const MeetingForm = () => (
    <div>
      <h4>Majlislar rejasi</h4>
      <Form form={meetingForm} layout="vertical">
        <Form.Item name="meetingTitle" label="Majlis nomi" rules={[{ required: true }]}>
          <Input placeholder="Majlis nomini kiriting" />
        </Form.Item>
        <Form.Item name="meetingTime" label="Boshlanish vaqti" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="meetingLocation" label="O'tkaziladigan joy">
          <Input placeholder="Majlis joyini kiriting" />
        </Form.Item>
        <Form.Item name="meetingParticipants" label="Ishtirokchilar">
          <Input placeholder="Ishtirokchilar ro'yxati" />
        </Form.Item>
        <Form.Item name="meetingDescription" label="Tavsif">
          <Input.TextArea rows={3} placeholder="Majlis tavsifini kiriting" />
        </Form.Item>
        <Button type="dashed" icon={<PlusOutlined />} onClick={addNewMeeting} block>
          Yangi majlis qo'shish
        </Button>
      </Form>

      <Divider />

      <div>
        <h5>Rejalashtirilgan majlislar ({meetings.length})</h5>
        {meetings.map((meeting) => (
          <Card key={meeting.id} size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined />
                  <strong>{meeting.time}</strong>
                  <span>{meeting.title}</span>
                </div>
                {meeting.location && (
                  <div style={{ fontSize: '12px', color: '#666' }}>Joyi: {meeting.location}</div>
                )}
                {meeting.participants && (
                  <div style={{ fontSize: '12px', color: '#666' }}>Ishtirokchilar: {meeting.participants}</div>
                )}
                <div style={{ fontSize: '12px', color: '#666' }}>{meeting.description}</div>
              </div>
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeMeeting(meeting.id)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Modal 
      open={isOpen} 
      onCancel={onClose} 
      width={1000}
      title={`${dayjs(date).format('DD.MM.YYYY')} - Rahbar kunlik ish rejasi`}
      footer={null}
      style={{ top: 20 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'view',
            label: `Ko'rish (${tasks.length + receptions.length + meetings.length})`,
            children: <DailyPlanView />
          },
          {
            key: 'task',
            label: `Vazifalar (${tasks.length})`,
            children: <TaskForm />
          },
          {
            key: 'reception',
            label: `Qabullar (${receptions.length})`,
            children: <ReceptionForm />
          },
          {
            key: 'meeting',
            label: `Majlislar (${meetings.length})`,
            children: <MeetingForm />
          }
        ]}
      />
    </Modal>
  );
};

export default DailyPlanModal;