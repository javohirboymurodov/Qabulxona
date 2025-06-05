import axios from 'axios';
import { message } from 'antd';

// Axios instance yaratish
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const errorMessage = error.response?.data?.message || 'Serverda xatolik yuz berdi';
    message.error(errorMessage);
    return Promise.reject(error);
  }
);

// Xodimlar uchun API endpointlar
export const getEmployees = () => api.get('/employees');
export const createEmployee = (employeeData) => {
  // FormData uchun maxsus config
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };
  return api.post('/employees', employeeData, config);
};
export const updateEmployee = (id, employee) => {
  // Agar employee FormData bo'lsa, multipart/form-data ishlatamiz
  const config = {
    headers: {
      'Content-Type': employee instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  };
  return api.put(`/employees/${id}`, employee, config);
};
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const updateEmployeeStatus = (id, status) => api.put(`/employees/${id}/status`, { status });

// Majlislar uchun API endpointlar
export const getMeetings = () => api.get('/meetings');
export const createMeeting = (meeting) => api.post('/meetings', meeting);
export const updateMeeting = (id, meeting) => api.put(`/meetings/${id}`, meeting);
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`);

// Ish grafigi uchun API endpointlar
export const getSchedule = () => api.get('/schedule');
export const getScheduleByDate = (date) => api.get(`/schedule/${date}`);
export const createSchedule = (date, data) => api.post(`/schedule/${date}`, data);
export const updateSchedule = (date, data) => api.put(`/schedule/${date}`, data);
export const getSchedulesByDateRange = (startDate, endDate) => 
  api.get(`/schedule/range/${startDate}/${endDate}`);
export const addTask = (dateStr, taskData) => api.post(`/schedule/${dateStr}/tasks`, taskData);
export const updateTask = (dateStr, taskId, taskData) => 
  api.put(`/schedule/${dateStr}/tasks/${taskId}`, taskData);
export const deleteTask = (dateStr, taskId) => api.delete(`/schedule/${dateStr}/tasks/${taskId}`);


// Qabulxona tarixi uchun API endpointlar
export const getReceptionHistory = (startDate, endDate) => {
  const params = { startDate, endDate };
  return api.get('/reception-history', { params });
};

export const getReceptionHistoryRange = (startDate, endDate) => {
  const params = { startDate, endDate };
  return api.get('/reception-history', { params });
};
export const archiveDailyReception = () => api.post('/reception-history/archive');
export const getReceptionHistoryByDate = (date) => api.get(`/reception-history/date/${date}`);
export const checkAndArchiveReceptions = () => api.post('/reception-history/check-and-archive');
export const getHistoryByDate = (date) => api.get(`/reception-history/${date}`);
export const getReceptionStats = (startDate, endDate) => {
  const params = { startDate, endDate };
  return api.get('/reception-history/stats', { params });
};
export const getArchiveStatus = () => api.get('/reception-history/archive/status');
export const archiveCurrentReception = () => api.post('/reception-history/archive-day');
export const forceArchiveReception = () => api.post('/reception-history/archive/force');