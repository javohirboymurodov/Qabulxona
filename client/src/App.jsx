import React, { useState, useEffect } from "react";
import { Layout, ConfigProvider, Button, Tooltip, App as AntApp, Spin, message } from "antd";
import uzUZ from "antd/locale/uz_UZ";
import { UserAddOutlined } from "@ant-design/icons";
import EmployeeList from "./components/Employees/EmployeeList";
import Navbar from "./components/Navbar";
import MeetingManager from "./components/Meetings/MeetingManager";
import AddMeetingModal from "./components/Meetings/AddMeetingModal";
import AddEmployeeModal from "./components/Employees/AddEmployeeModal";
import BossWorkSchedule from "./components/BossWorkSchedule"; // 
import HomePage from "./components/HomePage";
import BossReception from "./components/Reseption/BossReception";
import AppFooter from "./components/Footer";
import LoginPage from "./components/Login";
import AdminManager from "./components/Admins/AdminManager";
import { Routes, Route, Navigate } from "react-router-dom";

import {
  getEmployees,
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  checkAuth,
  login,
} from "./services/api";

const { Content } = Layout;

function App() {
  // Auth states - App level da
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on app start
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem("token");
      const savedAdmin = localStorage.getItem("admin");

      if (!token || !savedAdmin) {
        setLoading(false);
        return;
      }

      // Verify token with server
      const response = await checkAuth();
      if (response.success) {
        setIsAuthenticated(true);
        setAdmin(JSON.parse(savedAdmin));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      const response = await login(credentials);

      if (response.success) {
        const token = response.data?.token || response.token;
        const adminData = response.data?.admin || response.admin;

        localStorage.setItem("token", token);
        localStorage.setItem("admin", JSON.stringify(adminData));

        setIsAuthenticated(true);
        setAdmin(adminData);

        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || "Логин ёки парол нотўғри";
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      setIsAuthenticated(false);
      setAdmin(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <ConfigProvider locale={uzUZ}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "#f0f2f5",
          }}
        >
          <Spin size="large" />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={uzUZ}>
      <AntApp>
        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage onLogin={handleLogin} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AppContent 
                  admin={admin} 
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
}

// AppContent component - alohida ajratilgan
const AppContent = ({ admin, onLogout }) => {
  const { message } = AntApp.useApp();

  // Global message function
  const showMessage = {
    success: (content) => message.success(content),
    error: (content) => message.error(content),
    warning: (content) => message.warning(content),
    info: (content) => message.info(content),
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
  const [preSelectedEmployeesForMeeting, setPreSelectedEmployeesForMeeting] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const employeesResponse = await getEmployees();
      const employeesData = employeesResponse?.data || employeesResponse;
      setEmployees(Array.isArray(employeesData) ? employeesData : []);

      const meetingsResponse = await getMeetings();
      const meetingsData = meetingsResponse?.data || meetingsResponse;
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
    } catch (error) {
      console.error("Маълумотларни юклашда хато:", error);
      showMessage.error("Маълумотларни янгилашда хатолик юз берди");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (values) => {
    try {
      await createEmployee(values);
      await fetchData();
      showMessage.success("Ходим муваффақиятли қўшилди");
      setShowEmployeeModal(false);
    } catch (error) {
      showMessage.error("Ходимни қўшишда хатолик юз берди");
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
            fetchData={fetchData}
            onViewChange={setActiveView}
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
            fetchData={fetchData}
          />
        );
      case "boss-schedule":
        return <BossWorkSchedule showMessage={showMessage} />; {/* fetchData prop ni olib tashladim */}
      case "reception-history":
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
      case "admins":
        return admin?.role === 'super_admin' ? (
          <AdminManager currentAdmin={admin} showMessage={showMessage} />
        ) : (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <h3>Бу бўлимга кириш ҳуқуғингиз йўқ</h3>
          </div>
        );
      default:
        return (
          <HomePage
            employees={employees}
            meetings={meetings}
            onAddToBossReception={handleAddBossReception}
            onAddMeeting={handleAddMeeting}
            fetchData={fetchData}
            onViewChange={setActiveView}
          />
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f0f2f5",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={onLogout}
        admin={admin}
      />
      <Content
        style={{
          padding: "88px 24px 24px",
          background: "#f0f2f5",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {renderView()}

        {/* Add Meeting Modal */}
        {showMeetingModal && (
          <AntApp>
          <AddMeetingModal
            onClose={() => {
              setShowMeetingModal(false);
              setEditingMeeting(null);
              setPreSelectedEmployeesForMeeting([]);
            }}
            onSave={editingMeeting ? handleEditEmployee : handleAddNewMeeting}
            employees={employees}
            initialValues={editingMeeting}
            preSelectedEmployees={preSelectedEmployeesForMeeting}
          />
          </AntApp>
        )}

        {/* Add Employee Modal */}
        {showEmployeeModal && (
          <AddEmployeeModal
            onClose={() => {
              setShowEmployeeModal(false);
              setEditingEmployee(null);
            }}
            onSave={editingEmployee ? handleEditEmployee : handleAddEmployee}
            initialValues={editingEmployee}
          />
        )}
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default App;