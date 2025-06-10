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
      console.error("Мажлисларни юклашда хатолик:", error);
      message.error("Мажлисларни юклашда хатолик юз берди");
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
      title: "Мажлисни ўчириш",
      content: "Ушбу мажлисни ўчиришни хоҳлайсизми?",
      okText: "Ҳа",
      cancelText: "Йўқ",
      async onOk() {
        try {
          await deleteMeeting(id);
          messageApi.success("Мажлис муваффақиятли ўчирилди");
          fetchMeetings();
        } catch (error) {
          console.error("Мажлисни ўчиришда хатолик:", error);
          messageApi.error("Мажлисни ўчиришда хатолик юз берди");
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
                <Tooltip title="Кўриш" key="view">
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
