import axios from 'axios';
import dayjs from 'dayjs';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
// Login endpoint
export const login = async (credentials) => {
  try {
    
    const response = await api.post('/auth/login', credentials);
    
    return response.data;
  } catch (error) {
    console.error('API login error:', error); // Debug
    throw error;
  }
};

export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/check');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Employee endpoints
export const getEmployees = async () => {
  try {
    const response = await api.get('/employees');
    return response.data;
  } catch (error) {
    console.error('Get employees error:', error);
    throw error.response?.data || error;
  }
};

export const addEmployee = async (employeeData) => {
  try {
    const response = await api.post('/employees', employeeData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Add employee error:', error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await api.put(`/employees/${id}`, employeeData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Update employee error:', error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete employee error:', error);
    throw error;
  }
};

export const createEmployee = addEmployee; // Alias

// Employee status update (yangi endpoint)
export const updateEmployeeStatus = async (employeeId, status) => {
  try {
    const response = await api.put(`/employees/${employeeId}/status`, { 
      status: status 
    });
    return response.data;
  } catch (error) {
    console.error('Update employee status error:', error);
    throw error.response?.data || error;
  }
};

// Meeting endpoints
export const getMeetings = async () => {
  try {
    const response = await api.get('/meetings');
    return response.data;
  } catch (error) {
    console.error('Get meetings error:', error);
    throw error;
  }
};

export const addMeeting = async (meetingData) => {
  try {
    const response = await api.post('/meetings', meetingData);
    return response.data;
  } catch (error) {
    console.error('Add meeting error:', error);
    throw error;
  }
};

export const updateMeeting = async (id, meetingData) => {
  try {
    const response = await api.put(`/meetings/${id}`, meetingData);
    return response.data;
  } catch (error) {
    console.error('Update meeting error:', error);
    throw error;
  }
};

export const deleteMeeting = async (id) => {
  try {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete meeting error:', error);
    throw error;
  }
};

export const createMeeting = addMeeting; // Alias

// Reception History endpoints (Backend API'ga mos)
export const addToReception = async (data) => {
  try {
    if (!data.employeeId) {
      throw new Error('Employee ID is required');
    }

    const response = await api.post('/reception-history/add', {
      employeeId: data.employeeId,
      name: data.name,
      position: data.position,
      department: data.department,
      phone: data.phone || '',
      status: data.status || 'waiting',
      task: data.task
    });
    
    return response.data;
  } catch (error) {
    console.error('Add to reception error:', error);
    throw error.response?.data || error;
  }
};

// Bugungi qabullarni olish (yangi endpoint)
export const getTodayReception = async (date = null) => {
  try {
    if (date) {
      // Agar sana berilsa - date endpoint ishlatamiz
      const response = await api.get(`/reception-history/date/${date}`);
      return response.data;
    } else {
      // Agar sana berilmasa - today endpoint ishlatamiz
      const response = await api.get('/reception-history/today');
      return response.data;
    }
  } catch (error) {
    console.error('Get today reception error:', error);
    throw error.response?.data || error;
  }
};

// Sana bo'yicha qabullarni olish
export const getReceptionHistoryByDate = async (date) => {
  try {
    const response = await api.get(`/reception-history/date/${date}`);
    return response.data;
  } catch (error) {
    console.error('Get reception history by date error:', error);
    throw error.response?.data || error;
  }
};

// Qabul holatini yangilash - to'g'irlangan versiya
export const updateReceptionStatus = async (employeeId, data, date = null) => {
  try {
    // Employee ID to'g'ri ekanligini tekshiramiz
    if (!employeeId || typeof employeeId === 'object') {
      console.error('Invalid employeeId:', employeeId);
      throw new Error('Employee ID noto\'g\'ri formatda');
    }

    const targetDate = date || dayjs().format('YYYY-MM-DD');
    
    console.log('Update reception status:', {
      employeeId,
      targetDate,
      data
    }); // Debug uchun

    const response = await api.put(`/reception-history/${targetDate}/employee/${employeeId}/status`, data);
    return response.data;
  } catch (error) {
    console.error('Update reception status error:', error);
    throw error.response?.data || error;
  }
};

// Sana oralig'i bo'yicha qabullarni olish
export const getReceptionHistoryRange = async (startDate, endDate) => {
  try {
    const response = await api.get(`/reception-history/range/${startDate}/${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Get reception history range error:', error);
    throw error.response?.data || error;
  }
};

// Qabul statistikasini olish
export const getReceptionStats = async (startDate, endDate) => {
  try {
    const response = await api.get(`/reception-history/stats?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Get reception stats error:', error);
    throw error.response?.data || error;
  }
};

// Aliases
export const getReceptionByDateRange = getReceptionHistoryRange;

// Schedule endpoints (Reception history bilan bir xil)
export const createSchedule = addToReception;
export const getScheduleByDate = getTodayReception;
export const getSchedules = getReceptionHistoryRange;
export const updateSchedule = updateReceptionStatus;
export const deleteSchedule = async (id) => {
  // Vaqtincha dummy function
  return { success: true, message: 'Deleted' };
};

// Admin endpoints
export const getAdmins = async () => {
  try {
    const response = await api.get('/admins');
    return response.data;
  } catch (error) {
    console.error('Get admins error:', error);
    throw error.response?.data || error;
  }
};

export const createAdmin = async (adminData) => {
  try {
    const response = await api.post('/admins', adminData);
    return response.data;
  } catch (error) {
    console.error('Create admin error:', error);
    throw error.response?.data || error;
  }
};

export const updateAdmin = async (id, adminData) => {
  try {
    const response = await api.put(`/admins/${id}`, adminData);
    return response.data;
  } catch (error) {
    console.error('Update admin error:', error);
    throw error.response?.data || error;
  }
};

export const deleteAdmin = async (id) => {
  try {
    const response = await api.delete(`/admins/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete admin error:', error);
    throw error.response?.data || error;
  }
};

// Task status yangilash uchun yangi funksiya
export const updateTaskStatus = async (receptionId, data) => {
  try {
    const response = await api.put(`/reception-history/task/${receptionId}/status`, data);
    return response.data;
  } catch (error) {
    console.error('Update task status error:', error);
    throw error.response?.data || error;
  }
};

export default api;