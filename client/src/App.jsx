import React, { useState, useEffect } from "react";
import { Layout, ConfigProvider, Button, Tooltip, App as AntApp, message } from "antd";
import uzUZ from "antd/locale/uz_UZ";
import { UserAddOutlined } from "@ant-design/icons";
import EmployeeList from "./components/EmployeeList";
import Navbar from "./components/Navbar";
import MeetingManager from "./components/MeetingManager";
import AddMeetingModal from "./components/AddMeetingModal";
import AddEmployeeModal from "./components/AddEmployeeModal";
import ManagerSchedule from "./components/ManagerSchedule";
import HomePage from "./components/HomePage";
import BossReception from "./components/BossReception";
import AppFooter from "./components/Footer";

import {
  getEmployees,
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createEmployee,
  deleteEmployee,
  updateEmployee,
} from "./services/api";

const { Content } = Layout;

function App() {
  const [messageApi, contextHolder] = message.useMessage();

  // Global message function
  const showMessage = {
    success: (content) => messageApi.success(content),
    error: (content) => messageApi.error(content),
    warning: (content) => messageApi.warning(content),
    info: (content) => messageApi.info(content),
  };

  const [employees, setEmployees] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeView, setActiveView] = useState("home");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [preSelectedEmployeesForMeeting, setPreSelectedEmployeesForMeeting] =
    useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, meetingsRes] = await Promise.all([
        getEmployees(),
        getMeetings(),
      ]);

      console.log("App - Fetched employee data:", employeesRes.data);

      setEmployees(employeesRes.data || []);
      setMeetings(meetingsRes.data || []);
    } catch (error) {
      console.error("Маълумотларни юклашда хато:", error);
      antMessage.error("Маълумотларни янгилашда хатолик юз берди");
    }
  };

  const handleAddEmployee = async (values) => {
    try {
      await createEmployee(values);
      await fetchData();
      // Faqat бир marta xabar chiqarish
      showMessage.success('Ходим муваффақиятли қўшилди');
      setShowEmployeeModal(false);
    } catch (error) {
      showMessage.error('Ходимни қўшишда хатолик юз берди');
    }
  };

  const handleEditEmployee = async (values) => {
    try {
      await updateEmployee(editingEmployee._id, values);
      await fetchData();
      showMessage.success("Ходим маълумотлари янгиланди");
      setShowEmployeeModal(false);
      setEditingEmployee(null);
    } catch (error) {
      showMessage.error("Ходим маълумотларини янгилашда хатолик юз берди");
    }
  };

  const handleAddBossReception = async (selectedIds) => {
    setSelectedEmployeeIds(selectedIds);
  };

  const handleAddMeeting = (selectedIds) => {
    // Tanlangan xodimlar ID'larini saqlash
    setPreSelectedEmployeesForMeeting(selectedIds);
    setShowMeetingModal(true);
  };

  const handleAddNewMeeting = async (values) => {
    try {
      const meetingData = {
        ...values,
        participants: values.participants || [],
      };

      await createMeeting(meetingData);
      await fetchData();
      showMessage.success("Мажлис муваффақиятли қўшилди");
      setShowMeetingModal(false);
      setPreSelectedEmployeesForMeeting([]);
    } catch (error) {
      showMessage.error("Мажлис қўшишда хатолик юз берди");
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await deleteEmployee(id);
      await fetchData();
      showMessage.success("Ходим ўчирилди");
      if (selectedEmployee?._id === id) {
        setSelectedEmployee(null);
      }
    } catch (error) {
      showMessage.error("Ходимни ўчиришда хатолик юз берди");
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await deleteMeeting(id);
      await fetchData();
      showMessage.success("Мажлис ўчирилди");
    } catch (error) {
      showMessage.error("Мажлисни ўчиришда хатолик юз берди");
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "home":
        return (
          <HomePage
            employees={employees}
            meetings={meetings}
            onAddToBossReception={handleAddBossReception}
            onAddMeeting={handleAddMeeting}
            fetchData={fetchData} // Make sure this is passed
          />
        );
      case "employees":
        return (
          <>
            <EmployeeList
              employees={employees}
              onEdit={(employee) => {
                setEditingEmployee(employee);
                setShowEmployeeModal(true);
              }}
              onDelete={handleDeleteEmployee}
              onView={setSelectedEmployee}
              selectedEmployee={selectedEmployee}
            />
            <Tooltip title="Янги ходим қўшиш">
              <Button
                type="primary"
                shape="circle"
                icon={<UserAddOutlined />}
                size="large"
                onClick={() => setShowEmployeeModal(true)}
                style={{
                  position: "fixed",
                  bottom: 55,
                  right: 10,
                  width: 56,
                  height: 56,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
            </Tooltip>
          </>
        );
      case "meetings":
        return (
          <MeetingManager
            meetings={meetings}
            employees={employees}
            onDeleteMeeting={handleDeleteMeeting}
            onEditMeeting={(meeting) => {
              setEditingMeeting(meeting);
              setShowMeetingModal(true);
            }}
          />
        );
      case "boss-meetings":
        return (
          <BossReception
            employees={employees}
            meetings={meetings}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            setSelectedEmployee={setSelectedEmployee}
            fetchData={fetchData}
          />
        );
      case "boss-schedule":
        return <ManagerSchedule showMessage={showMessage} />;
      default:
        return <HomePage employees={employees} meetings={meetings} />;
    }
  };

  return (
    <ConfigProvider locale={uzUZ}>
      {contextHolder}
      <AntApp>
        <Layout style={{ minHeight: "100vh" }}>
          <Navbar activeView={activeView} onViewChange={setActiveView} />
          <Content style={{ padding: "88px 24px 24px", background: "#f0f2f5", minHeight: "calc(100vh - 64px)" }}>
            {renderView()}

            {/* Add Meeting Modal */}
            {showMeetingModal && (
              <AddMeetingModal
                onClose={() => {
                  setShowMeetingModal(false);
                  setEditingMeeting(null);
                  setPreSelectedEmployeesForMeeting([]);
                }}
                onSave={
                  editingMeeting ? handleEditMeeting : handleAddNewMeeting
                }
                employees={employees}
                initialValues={editingMeeting}
                preSelectedEmployees={preSelectedEmployeesForMeeting}
              />
            )}

            {/* Add Employee Modal */}
            {showEmployeeModal && (
              <AddEmployeeModal
                onClose={() => {
                  setShowEmployeeModal(false);
                  setEditingEmployee(null);
                }}
                onSave={
                  editingEmployee ? handleEditEmployee : handleAddEmployee
                }
                initialValues={editingEmployee}
              />
            )}
          </Content>
          <AppFooter />
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
