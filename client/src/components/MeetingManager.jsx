import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Typography,
  Space,
  Button,
  Tag,
  Tooltip,
  Empty,
  Modal,
  message,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import AddMeetingModal from "./AddMeetingModal";
import ViewMeetingModal from "./ViewMeetingModal";
import { getMeetings, deleteMeeting } from "../services/api";
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MeetingManager = ({ employees = [] }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await getMeetings();
      setMeetings(response.data);
    } catch (error) {
      console.error("Majlislarni yuklashda xatolik:", error);
      message.error("Majlislarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setEditModalVisible(true);
  };

  const handleDeleteMeeting = (id) => {
    modal.confirm({
      title: "Majlisni o'chirish",
      content: "Ushbu majlisni o'chirishni xohlaysizmi?",
      okText: "Ha",
      cancelText: "Yo'q",
      async onOk() {
        try {
          await deleteMeeting(id);
          messageApi.success("Majlis muvaffaqiyatli o'chirildi");
          fetchMeetings();
        } catch (error) {
          console.error("Majlisni o'chirishda xatolik:", error);
          messageApi.error("Majlisni o'chirishda xatolik yuz berdi");
        }
      },
    });
  };

  const handleViewMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setViewModalVisible(true);
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Режалаштирилган Мажлислар</span>
          </Space>
        }
      >
        <List
          loading={loading}
          dataSource={meetings}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Режалаштирилган мажлислар мавжуд эмас"
              />
            ),
          }}
          renderItem={(meeting) => (
            <List.Item
              key={meeting._id}
              actions={[
                <Tooltip title="Ko'rish" key="view">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewMeeting(meeting)}
                  />
                </Tooltip>,
                <Tooltip title="Тахрирлаш" key="edit">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditMeeting(meeting)}
                  />
                </Tooltip>,
                <Tooltip title="Ўчириш" key="delete">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteMeeting(meeting._id)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                title={meeting.name}
                description={
                  <Space direction="vertical" size="small">                    <Space>
                      <Tag icon={<CalendarOutlined />} color="blue">
                        {dayjs(meeting.date).format('DD.MM.YYYY')}
                      </Tag>
                      <Tag icon={<ClockCircleOutlined />} color="cyan">
                        {meeting.time}
                      </Tag>
                    </Space>
                    <Space align="start">
                      <TeamOutlined style={{ marginTop: 4 }} />
                      <Text type="secondary">
                        {meeting.participants.length} киши
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>      <AddMeetingModal
        visible={editModalVisible}
        onClose={(refresh) => {
          setEditModalVisible(false);
          setEditingMeeting(null);
          if (refresh) {
            fetchMeetings();
          }
        }}
        initialData={editingMeeting}
        employees={employees}
      />

      <ViewMeetingModal
        visible={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedMeeting(null);
        }}
        meeting={selectedMeeting}
      />
    </>
  );
};

export default MeetingManager;
