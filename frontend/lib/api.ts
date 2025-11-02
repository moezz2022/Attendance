import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// 🧑‍💼 جلب بيانات المستخدم
export const fetchUser = async () => {
  const res = await api.get("/user");
  return res.data;
};

// 📊 جلب بيانات الإحصائيات للوحة التحكم
export const fetchDashboardStats = async () => {
  const res = await api.get("/dashboard/stats");
  return res.data;
};

// 📊 جلب بيانات الإحصائيات للقسم
export const fetchDepartmentStats = async () => {
    const res = await api.get("/departments/stats");
    return res.data;
};
