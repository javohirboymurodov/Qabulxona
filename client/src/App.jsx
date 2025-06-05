import React, { useState, useEffect } from "react";
import { Layout, message, Button, Tooltip, App as AntApp } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import EmployeeList from "./components/EmployeeList";
import Navbar from "./components/Navbar";
import MeetingManager from "./components/MeetingManager";
import AddMeetingModal from "./components/AddMeetingModal";
import AddEmployeeModal from "./components/AddEmployeeModal";
import ManagerSchedule from "./components/ManagerSchedule";
import HomePage from "./components/HomePage";
import BossReception from "./components/BossReception";
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
import { ConfigProvider } from "antd";
import uzUZ from "antd/locale/uz_UZ";

const { Content } = Layout;

function App() {
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
      console.error("Ma'lumotlarni yuklashda xato:", error);
      message.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    }
  };

  const handleAddEmployee = async (values) => {
    try {
      await createEmployee(values);
      await fetchData();
      message.success("Xodim muvaffaqiyatli qo'shildi");
      setShowEmployeeModal(false);
    } catch (error) {
      message.error("Xodim qo'shishda xatolik yuz berdi");
    }
  };

  const handleEditEmployee = async (values) => {
    try {
      await updateEmployee(editingEmployee._id, values);
      await fetchData();
      message.success("Xodim ma'lumotlari yangilandi");
      setShowEmployeeModal(false);
      setEditingEmployee(null);
    } catch (error) {
      message.error("Xodim ma'lumotlarini yangilashda xatolik yuz berdi");
    }
  };

  const handleAddBossReception = async (selectedIds) => {
    setSelectedEmployeeIds(selectedIds);
  };

  const handleAddMeeting = (selectedIds) => {
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
      message.success("Majlis muvaffaqiyatli qo'shildi");
      setShowMeetingModal(false);
      setPreSelectedEmployeesForMeeting([]);
    } catch (error) {
      message.error("Majlis qo'shishda xatolik yuz berdi");
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await deleteEmployee(id);
      await fetchData();
      message.success("Xodim o'chirildi");
      if (selectedEmployee?._id === id) {
        setSelectedEmployee(null);
      }
    } catch (error) {
      message.error("Xodimni o'chirishda xatolik yuz berdi");
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      await deleteMeeting(id);
      await fetchData();
      message.success("Majlis o'chirildi");
    } catch (error) {
      message.error("Majlisni o'chirishda xatolik yuz berdi");
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
            fetchData={fetchData}
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
                  bottom: 24,
                  right: 24,
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
        return <ManagerSchedule />;
      default:
        return <HomePage employees={employees} meetings={meetings} />;
    }
  };

  return (
    <ConfigProvider locale={uzUZ}>
      <AntApp>
        <Layout style={{ minHeight: "100vh" }}>
          <Navbar activeView={activeView} onViewChange={setActiveView} />
          <Content style={{ padding: "88px 24px 24px", background: "#f0f2f5" }}>
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
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
