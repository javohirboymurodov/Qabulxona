import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Space,
  Popconfirm,
  Tag,
  Typography,
  App
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewMeetingModal from './ViewMeetingModal';
import SearchableMeetingList from './SearchableMeetingList';
import { updateMeeting, createMeeting } from '../../services/api'; // API funksiyalarini import qilamiz

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MeetingManager = ({ meetings = [], employees = [], onDeleteMeeting, fetchData }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [form] = Form.useForm();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredMeetings, setFilteredMeetings] = React.useState(meetings);

  React.useEffect(() => {
    setFilteredMeetings(meetings);
  }, [meetings]);

  // Modal ochilganda form ni to'g'ri set qilish
  useEffect(() => {
    if (modalVisible && editingMeeting) {
      const formValues = {
        name: editingMeeting.name || '',
        description: editingMeeting.description || '',
        date: editingMeeting.date ? dayjs(editingMeeting.date) : dayjs(),
        time: editingMeeting.time ? dayjs(editingMeeting.time, 'HH:mm') : dayjs('09:00', 'HH:mm'),
        location: editingMeeting.location || '',
        participants: editingMeeting.participants ? 
          editingMeeting.participants.map(p => p._id || p) : []
      };
      
      console.log('Setting form values:', formValues);
      console.log('Editing meeting:', editingMeeting);
      
      // Form ni to'g'ri set qilish
      setTimeout(() => {
        form.setFieldsValue(formValues);
      }, 100);
      
    } else if (modalVisible && !editingMeeting) {
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        time: dayjs('09:00', 'HH:mm')
      });
    }
  }, [modalVisible, editingMeeting, form]);

  const safeMeetings = Array.isArray(meetings) ? meetings : [];
  
  const sortedMeetings = safeMeetings.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleAddMeeting = () => {
    setEditingMeeting(null);
    setModalVisible(true);
  };

  const handleEditMeeting = (record) => {
    console.log('Editing meeting:', record);
    setEditingMeeting(record);
    setModalVisible(true);
  };

  const handleViewMeeting = (record) => {
    console.log('Viewing meeting:', record);
    setViewingMeeting(record);
    setViewModalVisible(true);
  };

  const handleViewModalClose = () => {
    setViewModalVisible(false);
    setViewingMeeting(null);
  };

  const handleDeleteMeeting = async (id) => {
    try {
      if (onDeleteMeeting) {
        await onDeleteMeeting(id);
      }
    } catch (error) {
      console.error('Delete meeting error:', error);
      message.error('Мажлисни ўчиришда хатолик');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const meetingData = {
        name: values.name,
        description: values.description,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        location: values.location,
        participants: values.participants || []
      };

      console.log('Saving meeting data:', meetingData);

      if (editingMeeting) {
        // Update meeting - to'g'ridan-to'g'ri API chaqiramiz
        console.log('Updating meeting ID:', editingMeeting._id);
        const response = await updateMeeting(editingMeeting._id, meetingData);
        console.log('Update response:', response);
        message.success('Мажлис муваффақиятли янгиланди');
      } else {
        // Create new meeting
        const response = await createMeeting(meetingData);
        console.log('Create response:', response);
        message.success('Мажлис муваффақиятли қўшилди');
      }

      handleModalCancel();
      
      // Ma'lumotlarni yangilash
      if (fetchData) {
        await fetchData();
      }
    } catch (error) {
      console.error('Save meeting error:', error);
      message.error('Мажлисни сақлашда хатолик: ' + (error.message || 'Номаълум хато'));
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingMeeting(null);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Номи',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Сана',
      dataIndex: 'date',
      key: 'date',
      render: (text) => text ? dayjs(text).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'Вақт',
      dataIndex: 'time',
      key: 'time',
      render: (text) => text || '09:00'
    },
    {
      title: 'Жой',
      dataIndex: 'location',
      key: 'location',
      render: (text) => text || '-'
    },
    {
      title: 'Иштирокчилар',
      dataIndex: 'participants',
      key: 'participants',
      render: (participants) => {
        if (!participants || participants.length === 0) {
          return <Tag>Иштирокчилар йўқ</Tag>;
        }
        return (
          <Space wrap>
            {participants.slice(0, 2).map((participant, index) => (
              <Tag key={participant._id || index} color="blue">
                {participant.name || participant.fullName || participant}
              </Tag>
            ))}
            {participants.length > 2 && (
              <Tag key="more">+{participants.length - 2} та</Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Амаллар',
      key: 'actions',
      render: (_, record) => {
        const meetingDate = dayjs(record.date);
        const today = dayjs();
        const isPastMeeting = meetingDate.isBefore(today, 'day');

        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewMeeting(record)}
            ></Button>
            {!isPastMeeting && (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditMeeting(record)}
                ></Button>
                <Popconfirm
                  title="Ушбу мажлисни ўчирмоқчимисиз?"
                  onConfirm={() => handleDeleteMeeting(record._id)}
                  okText="Ҳа"
                  cancelText="Йўқ"
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  ></Button>
                </Popconfirm>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={3} style={{ margin: 0 }}>
              Мажлислар
            </Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMeeting}
          >
            Янги мажлис
          </Button>
        }
      >
        <SearchableMeetingList
            meetingOptions={meetings}
            onChange={setFilteredMeetings}
            placeholder="Мажлисларни қидириш"
          />
        <Table
          columns={columns}
          dataSource={filteredMeetings}
          loading={loading}
          rowKey={(record) => record._id || record.id}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredMeetings.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Жами ${total} та мажлис`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }
          }}
          locale={{
            emptyText: "Мажлислар топилмади"
          }}
        />
      </Card>

      {/* Edit/Add Modal  */}
      <Modal
        title={editingMeeting ? 'Мажлисни таҳрирлаш' : 'Янги мажлис қўшиш'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
        destroyOnHidden={true}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            name="name"
            label="Мажлис номи"
            rules={[{ required: true, message: 'Мажлис номини киритинг' }]}
          >
            <Input placeholder="Мажлис номини киритинг" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Тафсилот"
          >
            <TextArea
              rows={3}
              placeholder="Мажлис ҳақида тафсилот"
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="Сана"
            rules={[{ required: true, message: 'Санани танланг' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder="Санани танланг"
            />
          </Form.Item>

          <Form.Item
            name="time"
            label="Вақт"
            rules={[{ required: true, message: 'Вақтни танланг' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              placeholder="Вақтни танланг"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Жой"
          >
            <Input placeholder="Мажлис ўтказиладиган жой" />
          </Form.Item>

          <Form.Item
            name="participants"
            label="Иштирокчилар"
          >
            <Select
              mode="multiple"
              placeholder="Иштирокчиларни танланг"
              style={{ width: '100%' }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {employees.map(employee => (
                <Option 
                  key={employee._id} 
                  value={employee._id}
                >
                  {employee.fullName || employee.name} - {employee.position}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <ViewMeetingModal
        visible={viewModalVisible}
        onClose={handleViewModalClose}
        meeting={viewingMeeting}
      />
    </div>
  );
};

export default MeetingManager;