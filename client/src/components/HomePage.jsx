import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Tag,
  Typography,
  Button,
  message,
  List,
  Avatar,
  Empty,
  Checkbox,
  Input,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  PhoneOutlined,
  BankOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { updateEmployeeStatus } from "../services/api";
import SearchableEmployeeList from "./SearchableEmployeeList";
import AddMeetingModal from "./AddMeetingModal";

const { Title, Text } = Typography;

const HomePage = ({
  employees = [],
  meetings = [],
  onAddMeeting,
  onAddToBossReception,
  fetchData,
}) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);

  console.log("HomePage - All employees:", employees);
  // Left Panel - Employee List Component
  const EmployeeListPanel = () => {
    const [localMessageApi, contextHolder] = message.useMessage();
    const [filteredEmployees, setFilteredEmployees] = useState(employees);

    React.useEffect(() => {
      setFilteredEmployees(employees);
    }, [employees]);

    const handleAddToBossReception = async () => {
      try {
        if (selectedEmployees.length === 0) {
          localMessageApi.warning({
            content: "Iltimos, xodimlarni tanlang",
            duration: 3,
          });
          return;
        }

        // Filter out employees who are already in waiting status
        const employeesToAdd = [];
        const alreadyInReception = [];

        selectedEmployees.forEach((id) => {
          const employee = employees.find((emp) => emp._id === id);
          if (employee && employee.status === "waiting") {
            alreadyInReception.push(employee.name);
          } else {
            employeesToAdd.push(id);
          }
        });

        // Show warning for employees already in reception
        if (alreadyInReception.length > 0) {
          localMessageApi.warning({
            content: `Қўйидаги ходимлар аллақачон раҳбар қабулда: ${alreadyInReception.join(
              ", "
            )}`,
            duration: 5,
          });

          if (employeesToAdd.length === 0) {
            return;
          }
        }

        // Update status sequentially for remaining employees
        for (const id of employeesToAdd) {
          await updateEmployeeStatus(id, "waiting");
        }

        localMessageApi.success({
          content: `${employeesToAdd.length} та ходим раҳбар қабулга йўналтирилди`,
          duration: 3,
        });

        if (onAddToBossReception) {
          await onAddToBossReception(employeesToAdd);
        }

        setSelectedEmployees([]);
        await fetchData();
      } catch (error) {
        localMessageApi.error({
          content: "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring",
          duration: 3,
        });
        console.error("Error adding to boss reception:", error);
      }
    };
    const handleAddToMeeting = () => {
      if (selectedEmployees.length === 0) {
        localMessageApi.warning({
          content: "Илтимос, ходимларни танланг",
          duration: 3,
        });
        return;
      }
      setMeetingModalVisible(true);
    };

    return (
      <>
        {contextHolder}
        <Card style={{ height: "calc(100vh - 150px)", overflowY: "auto" }}>
          {" "}
          <Space direction="vertical" style={{ width: "100%" }}>
            {" "}
            <Title level={4}>
              <TeamOutlined /> Ходимлар рўйхати
            </Title>
            
            <SearchableEmployeeList
              employeeOptions={employees}
              onChange={setFilteredEmployees}
              placeholder="Ходимларни қидириш"
            />

            <List
              dataSource={filteredEmployees}
              renderItem={(employee) => (
                <List.Item key={employee._id} style={{ padding: "12px" }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                      />
                    }
                    title={
                      <Space>
                        <Checkbox
                          checked={selectedEmployees.includes(employee._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees((prev) => [...prev, employee._id]);
                            } else {
                              setSelectedEmployees((prev) =>
                                prev.filter((id) => id !== employee._id)
                              );
                            }
                          }}
                        />
                        <Text strong>{employee.name}</Text>
                        <Tag color="blue">{employee.position}</Tag>
                        {/* {employee.status === "waiting" && (
                          <Tag color="processing">Rahbar qabulida</Tag>
                        )}
                        {employee.status === "present" && (
                          <Tag color="success">Keldi</Tag>
                        )}
                        {employee.status === "absent" && (
                          <Tag color="error">Kelmadi</Tag>
                        )} */}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">
                          <BankOutlined /> {employee.department}
                        </Text>
                        <Text type="secondary">
                          <PhoneOutlined /> {employee.phone}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            {selectedEmployees.length > 0 && (
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "white",
                  padding: "16px 0",
                  borderTop: "1px solid #f0f0f0",
                  width: "100%",
                }}
              >
                <Space style={{ width: "100%", justifyContent: "center" }}>
                  <Button
                    type="primary"
                    icon={<UserOutlined />}
                    onClick={handleAddToBossReception}
                  >
                    Раҳбар қабулига ({selectedEmployees.length})
                  </Button>
                  <Button
                    icon={<CalendarOutlined />}
                    onClick={() => {
                      if (selectedEmployees.length === 0) {
                        localMessageApi.warning({
                          content: "Илтимос, ходимларни танланг",
                          duration: 3,
                        });
                        return;
                      }
                      setMeetingModalVisible(true);
                    }}
                  >
                    Мажлисга Қўшиш ({selectedEmployees.length})
                  </Button>
                </Space>
              </div>
            )}
          </Space>
        </Card>
      </>
    );
  };

  // Middle Panel - Boss Reception Component
  const BossReceptionPanel = () => {
    const [messageApi, contextHolder] = message.useMessage();

    const handleStatusUpdate = async (employeeId, newStatus) => {
      try {
        await updateEmployeeStatus(employeeId, newStatus);
        await fetchData();
        messageApi.success({
          content: `Xodim holati "${
            newStatus === "present" ? "Келди" : "Келмади"
          }" га ўзгартирилди`,
          duration: 3,
        });
      } catch (error) {
        messageApi.error({
          content: "Xodim holatini yangilashda xatolik yuz berdi",
          duration: 3,
        });
      }
    };

    const getStatusTag = (status) => {
      switch (status) {
        case "present":
          return <Tag color="success">Келди</Tag>;
        case "absent":
          return <Tag color="error">Келмади</Tag>;
        case "waiting":
          return <Tag color="processing">Кутилмоқда</Tag>;
        default:
          return null;
      }
    };

    // Sort employees by status: waiting first, then present, then absent
    const sortedEmployees = [...employees]
      .filter((emp) => ["waiting", "present", "absent"].includes(emp.status))
      .sort((a, b) => {
        const statusOrder = { waiting: 0, present: 1, absent: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

    const waitingCount = sortedEmployees.filter(
      (emp) => emp.status === "waiting"
    ).length;
    const presentCount = sortedEmployees.filter(
      (emp) => emp.status === "present"
    ).length;
    const absentCount = sortedEmployees.filter(
      (emp) => emp.status === "absent"
    ).length;

    return (
      <>
        {contextHolder}
        <Card
          title={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Title level={4} >
                <UserOutlined /> Раҳбар Қабули
              </Title>
              <Space wrap>
                <Tag color="processing">Кутилмоқда: {waitingCount}</Tag>
                <Tag color="success">Келди: {presentCount}</Tag>
                <Tag color="error">Келмади: {absentCount}</Tag>
              </Space>
            </Space>
          }
          style={{ height: "calc(100vh - 150px)", overflowY: "auto" }}
        >
          <List
            dataSource={sortedEmployees}
            locale={{ emptyText: "Кутилayotgan ходимлар йўқ" }}
            renderItem={(employee) => (
              <List.Item
                key={employee._id}
                style={{
                  backgroundColor:
                    employee.status === "waiting"
                      ? "#fff"
                      : employee.status === "present"
                      ? "#f6ffed"
                      : employee.status === "absent"
                      ? "#fff1f0"
                      : undefined,
                  padding: "12px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  }                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Text strong>{employee.name}</Text>
                      <Tag color="blue">{employee.position}</Tag>
                      {getStatusTag(employee.status)}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ marginTop: '4px' }}>
                      <Text type="secondary">
                        <BankOutlined /> {employee.department}
                      </Text>
                      <Text type="secondary">
                        <PhoneOutlined /> {employee.phone}
                      </Text>
                    </Space>
                  }
                />
                {employee.status === "waiting" && (
                  <Space>
                    <Button
                      type="primary"
                      onClick={() =>
                        handleStatusUpdate(employee._id, "present")
                      }
                      style={{
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                      }}
                    >
                      Келди
                    </Button>
                    <Button
                      type="primary"
                      danger
                      onClick={() => handleStatusUpdate(employee._id, "absent")}
                    >
                      Келмади
                    </Button>
                  </Space>
                )}
              </List.Item>
            )}
          />
        </Card>
      </>
    );
  };

  // Right Panel - Scheduled Meetings Component
  const ScheduledMeetingsPanel = () => (
    <Card
      title={
        <Title level={4}>
          <CalendarOutlined /> Режалаштирилган Мажлислар
        </Title>
      }
      style={{ height: "calc(100vh - 150px)", overflowY: "auto" }}
    >
      <List
        dataSource={meetings}
        locale={{ emptyText: "Режалаштирилган мажлислар йўқ" }}
        renderItem={(meeting) => (
          <Card.Grid style={{ width: "100%" }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>{meeting.name}</Text>
              <Space>
                <Tag icon={<CalendarOutlined />} color="blue">
                  {meeting.date}
                </Tag>
                <Tag icon={<ClockCircleOutlined />} color="cyan">
                  {meeting.time}
                </Tag>
              </Space>
              <Space>
                <TeamOutlined />
                <Text type="secondary">
                  {meeting.participants.length} киши:{" "}
                  {meeting.participants.map((p) => p.name).join(", ")}
                </Text>
              </Space>
            </Space>
          </Card.Grid>
        )}
      />
    </Card>
  );

  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <EmployeeListPanel />
        </Col>
        <Col span={8}>
          <BossReceptionPanel />
        </Col>
        <Col span={8}>
          <ScheduledMeetingsPanel />
        </Col>
      </Row>{" "}
      {contextHolder}      <AddMeetingModal
        visible={meetingModalVisible}
        onClose={(success) => {
          setMeetingModalVisible(false);
          if (success) {
            fetchData();
            setSelectedEmployees([]);
          }
        }}
        onSuccess={() => {
          messageApi.success({
            content: "Majlis muvaffaqiyatli qo'shildi",
            duration: 3,
          });
        }}
        preSelectedEmployees={selectedEmployees}
        employees={employees}
      />
    </>
  );
};

export default HomePage;
