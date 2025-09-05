import React, { useState, useEffect, useCallback, memo } from "react";
import {Row,Col,Card,Space,Tag,Typography,Button,message,List,Avatar,Checkbox,App,} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  PhoneOutlined,
  BankOutlined,
} from "@ant-design/icons";
import {addToReception, getTodayReception, updateReceptionStatus,
} from "../services/api";
import SearchableEmployeeList from "./Employees/SearchableEmployeeList";
import AddMeetingModal from "./Meetings/AddMeetingModal";
import TaskAssignmentModal from "./Reseption/TaskAssignmentModal";
import AddReceptionModal from './Reseption/AddReceptionModal'; // <-- To'g'ri path
import dayjs from "dayjs";

const { Title, Text } = Typography;

const HomePage = ({ employees = [], meetings = [], fetchData, showMessage }) => {
  // showMessage prop'idan foydalanish
  const messageApi = showMessage || message;
  

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [todayReception, setTodayReception] = useState([]);
  const [receptionModalVisible, setReceptionModalVisible] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [receptionDataLoaded, setReceptionDataLoaded] = useState(false); // Ikki marta yuklashni oldini olish

  // Bugungi qabullarni olish - useCallback bilan memoize
  const fetchTodayReception = useCallback(async () => {
    if (receptionDataLoaded) return; // Agar allaqachon yuklangan bo'lsa, qayta yuklamaslik
    
    try {
      setReceptionDataLoaded(true);
      // Backend'dagi today endpoint ishlatamiz
      const response = await getTodayReception();
      if (response.success && response.data) {
        const employees = response.data.employees || [];
        // Employees arrayini timeUpdated yoki createdAt bo'yicha kamayuvchi tartibda saralamiz
        const sortedEmployees = employees.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timeUpdated);
          const dateB = new Date(b.createdAt || b.timeUpdated);
          return dateB - dateA; // Kamayuvchi tartib (oxirgi qo'shilgan birinchi)
        });
        setTodayReception(sortedEmployees);
      }
    } catch (error) {
      console.error("Bugungi qabullarni olishda xato:", error);
      setTodayReception([]);
      setReceptionDataLoaded(false); // Xato bo'lsa, qayta urinish uchun false qilish
    }
  }, [receptionDataLoaded]);

  // Component mount bo'lganda faqat bir marta yuklash
  useEffect(() => {
    fetchTodayReception();
  }, [fetchTodayReception]);
  // Left Panel - Employee List Component
  const EmployeeListPanel = memo(() => {
    const [localMessageApi, contextHolder] = message.useMessage();
    const [filteredEmployees, setFilteredEmployees] = useState(employees || []);

    React.useEffect(() => {
      setFilteredEmployees(employees || []);
    }, [employees]);

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
        <Card
          styles={{
            body: {
              height: "calc(100vh - 150px)",
              padding: 0,
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <div style={{ padding: "24px 24px 0" }}>
            <Title level={4} style={{ marginBottom: "16px" }}>
              <TeamOutlined /> Ходимлар рўйхати
            </Title>

            <div style={{ marginBottom: "16px" }}>
              <SearchableEmployeeList
                employeeOptions={employees || []}
                onChange={setFilteredEmployees}
                placeholder="Ходимларни қидириш"
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 24px",
            }}
          >
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
                              setSelectedEmployees((prev) => [
                                ...prev,
                                employee._id,
                              ]);
                            } else {
                              setSelectedEmployees((prev) =>
                                prev.filter((id) => id !== employee._id)
                              );
                            }
                          }}
                        />
                        <Text strong>{employee.fullName || employee.name}</Text>
                        <Tag color="blue">{employee.position}</Tag>
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
          </div>

          {selectedEmployees.length > 0 && (
            <div
              style={{
                padding: "16px 24px",
                background: "white",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Space style={{ width: "100%", justifyContent: "center" }}>
                <Button
                  type="primary"
                  icon={<UserOutlined />}
                  onClick={() => {
                    // Rahbar qabuliga - modaldan foydalanish
                    if (selectedEmployees.length === 0) {
                      localMessageApi.warning({
                        content: "Илтимос, ходимларни танланг",
                        duration: 3,
                      });
                      return;
                    }
                    setReceptionModalVisible(true); // Modal ochish
                  }}
                >
                  Раҳбар қабулига ({selectedEmployees.length})
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  onClick={handleAddToMeeting}
                >
                  Мажлисга Қўшиш ({selectedEmployees.length})
                </Button>
              </Space>
            </div>
          )}
        </Card>
      </>
    );
  });

  // Middle Panel - Bugungi Boss Reception
  const TodayBossReceptionPanel = memo(() => {
    const handleStatusUpdate = useCallback(async (employee, status) => {
      try {
        const employeeId = employee.employeeId?._id ||
          employee.employeeId ||
          employee._id ||
          employee.id;

        if (!employeeId) {
          throw new Error('Employee ID topilmadi');
        }

        if (status === "present") {

          setSelectedEmployee(employee);
          setShowTaskModal(true);
          return;
        }

        if (status === "absent") {
          // Kelmadi tugmasi bosilsa status yangilanadi
          await updateReceptionStatus(employeeId, { status });
          messageApi.success('Ходим ҳолати "Келмади" га ўзгартирилди');

          // Reception data'ni qayta yuklash uchun flag'ni false qilish
          setReceptionDataLoaded(false);
          await fetchTodayReception(); // Listni yangilaymiz


          if (fetchData) {
            await fetchData();
          }
        }
      } catch (error) {
        console.error("Status update error:", error);
        messageApi.error("Ходим ҳолатини янгилашда хатолик юз берди");
      }
    }, [messageApi, fetchData, fetchTodayReception]);

    const getStatusTag = (status) => {
      switch (status) {
        case "present":
          return <Tag color="success">Келди</Tag>;
        case "absent":
          return <Tag color="error">Келмади</Tag>;
        case "waiting":
          return <Tag color="processing">Кутилмоқда</Tag>;
        default:
          return <Tag color="default">Номаълум</Tag>;
      }
    };

    const waitingCount = todayReception.filter(
      (emp) => emp.status === "waiting"
    ).length;
    const presentCount = todayReception.filter(
      (emp) => emp.status === "present"
    ).length;
    const absentCount = todayReception.filter(
      (emp) => emp.status === "absent"
    ).length;

    return (
      <Card
        title={
          <Space direction="vertical" style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>
              <UserOutlined /> Бугунги Раҳбар Қабули
            </Title>
            <Space wrap>
              <Tag color="processing">Кутилмоқда: {waitingCount}</Tag>
              <Tag color="success">Келди: {presentCount}</Tag>
              <Tag color="error">Келмади: {absentCount}</Tag>
            </Space>
          </Space>
        }
        style={{ height: "calc(100vh - 150px)" }}
        styles={{
          body: {
            overflowY: "auto",
            height: "calc(100% - 100px)",
          },
        }}
      >
        <List
          dataSource={todayReception}
          locale={{ emptyText: "Бугун қабулга келган ходимлар йўқ" }}
          renderItem={(employee) => (
            <List.Item
              key={employee.employeeId}
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
                border: "1px solid #f0f0f0",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={40}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: "#1890ff",
                    }}
                  />
                }
                title={
                  <Space wrap>
                    <Text strong>{employee.name}</Text>
                    <Tag color="blue" size="small">
                      {employee.position}
                    </Tag>
                    {getStatusTag(employee.status)}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      <BankOutlined /> {employee.department}
                    </Text>
                    {employee.phone && (
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        <PhoneOutlined /> {employee.phone}
                      </Text>
                    )}
                    {employee.task && (
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Топшириқ: {employee.task.description}
                      </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      Қўшилди: {dayjs(employee.timeUpdated).format("HH:mm")}
                    </Text>
                  </Space>
                }
              />
              {employee.status === "waiting" && (
                <Space size="small">
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleStatusUpdate(employee, "present")}
                    style={{
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a",
                    }}
                  >
                    Келди
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    onClick={() => handleStatusUpdate(employee, "absent")}
                  >
                    Келмади
                  </Button>
                </Space>
              )}
            </List.Item>
          )}
        />
      </Card>
    );
  });

  // Right Panel - Scheduled Meetings Component
  const ScheduledMeetingsPanel = memo(() => {
    const now = dayjs();

    const upcomingMeetings = (meetings || [])
      .filter((meeting) => {
        const meetingDateTime = dayjs(meeting.date);
        return (
          meetingDateTime.isValid() &&
          (meetingDateTime.isAfter(now, "day") ||
            meetingDateTime.isSame(now, "day"))
        );
      })
      .sort((a, b) => {
        const dateTimeA = dayjs(a.date);
        const dateTimeB = dayjs(b.date);
        return dateTimeA.valueOf() - dateTimeB.valueOf();
      });

    return (
      <Card
        title={
          <Title level={4}>
            <CalendarOutlined /> Режалаштирилган Мажлислар
          </Title>
        }
        styles={{
          body: {
            height: "calc(100vh - 150px)",
            overflowY: "auto",
          },
        }}
      >
        <List
          dataSource={upcomingMeetings}
          locale={{ emptyText: "Режалаштирилган мажлислар йўқ" }}
          renderItem={(meeting) => {
            const meetingDate = dayjs(meeting.date);
            const isToday = meetingDate.isSame(now, "day");

            return (
              <Card.Grid style={{ width: "100%" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>{meeting.name}</Text>
                  <Space>
                    <Tag
                      icon={<CalendarOutlined />}
                      color={isToday ? "green" : "blue"}
                    >
                      {dayjs(meeting.date).format("DD.MM.YYYY")}
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />} color="cyan">
                      {meeting.time}
                    </Tag>
                  </Space>
                  <Space>
                    <TeamOutlined />
                    <Text type="secondary">
                      {meeting.participants?.length || 0} киши
                    </Text>
                  </Space>
                </Space>
              </Card.Grid>
            );
          }}
        />
      </Card>
    );
  });

  const getEmployeeId = (emp) =>
    typeof emp.employeeId === 'object'
      ? emp.employeeId._id
      : emp.employeeId || emp._id || emp.id;
  const handleTaskSave = useCallback(async (taskData) => {
    try {

      // Employee ID to'g'ri olish
      const empId = getEmployeeId(selectedEmployee);

      if (!empId) {
        throw new Error('Employee ID topilmadi');
      }

      await updateReceptionStatus(empId, {
        status: 'present',
        task: taskData
      });

      messageApi.success('Топшириқ муваффақиятли берилди');
      setShowTaskModal(false);
      setSelectedEmployee(null);

      // Reception data'ni qayta yuklash uchun flag'ni false qilish
      setReceptionDataLoaded(false);
      await fetchTodayReception(); // Listni yangilaymiz
      if (fetchData) {
        await fetchData();
      }

    } catch (error) {
      console.error('Task save error:', error);
      messageApi.error('Топшириқ беришда хатолик юз берди');
    }
  }, [selectedEmployee, messageApi, fetchData, fetchTodayReception]);

  const handleReceptionModalClose = useCallback(async (success) => {
    setReceptionModalVisible(false);
    if (success) {
      // Reception data'ni qayta yuklash uchun flag'ni false qilish
      setReceptionDataLoaded(false);
      await fetchTodayReception(); // Bugungi qabulni yangilash
      if (fetchData) {
        await fetchData(); // Umumiy ma'lumotlarni yangilash
      }
      setSelectedEmployees([]); // Tanlovni tozalash
    }
  }, [fetchData, fetchTodayReception]);

  // HomePage'da modal ochish joyida
  const openReceptionModal = () => {
    console.log('=== HomePage: Opening Reception Modal ===');
    console.log('defaultDate passed to modal:', undefined); // HomePage da defaultDate yo'q
    console.log('onSave callback exists:', !!handleReceptionSave); // Agar callback bor bo'lsa
    setShowReceptionModal(true);
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <EmployeeListPanel />
        </Col>
        <Col span={8}>
          <TodayBossReceptionPanel />
        </Col>
        <Col span={8}>
          <ScheduledMeetingsPanel />
        </Col>
      </Row>

      {/* contextHolder ni ham olib tashlang */}

      <AddMeetingModal
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
            content: "Мажлис муваффақиятли қўшилди",
            duration: 3,
          });
        }}
        preSelectedEmployees={selectedEmployees}
        employees={employees || []}
      />

      <TaskAssignmentModal
        visible={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedEmployee(null);
        }}
        onSave={handleTaskSave}
        employeeName={selectedEmployee?.name}
      />

      <AddReceptionModal
        visible={receptionModalVisible}
        onClose={handleReceptionModalClose}
        onSave={(receptionData) => {
          messageApi.success({
            content: `${receptionData.employee.fullName || receptionData.employee.name} рахбар қабулига муваффақиятли қўшилди`,
            duration: 3,
          });
        }}
        employees={employees || []}
        preSelectedEmployees={selectedEmployees.map(id => 
          employees.find(emp => emp._id === id)
        ).filter(Boolean)}
      />
    </>
  );
};

export default memo(HomePage);