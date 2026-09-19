import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  withCredentials: false
});

export const login = (payload) => api.post("/auth/login", payload);
export const register = (payload) => api.post("/users/register", payload);
export const requestOtp = (email) => api.post("/users/request-otp", { email });
export const registerWithOtp = (payload) => api.post("/users/register-with-otp", payload);
export const fetchCurrentUser = (email) => api.get(`/users/me`, { params: { email } });

export const getLostItems = () => api.get("/lost-items");
export const createLostItem = (formData) =>
  api.post("/lost-items", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Train Schedule endpoints
export const listTrainSchedules = (params = {}) =>
  api.get("/api/train-schedules", { params });

export const createTrainSchedule = (payload) =>
  api.post("/api/train-schedules", payload);

export const deleteTrainSchedule = (id) =>
  api.delete(`/api/train-schedules/${id}`);

export const updateTrainSchedule = (id, payload) =>
  api.put(`/api/train-schedules/${id}`, payload);

// Train Price endpoints
export const listTrainPrices = () => api.get('/api/train-prices');
export const createTrainPrice = (payload) => api.post('/api/train-prices', payload);
export const updateTrainPrice = (id, payload) => api.put(`/api/train-prices/${id}`, payload);
export const deleteTrainPrice = (id) => api.delete(`/api/train-prices/${id}`);

// Complaints & replies (train master specific extensions)
export const listComplaints = () => api.get('/complaints');
export const listComplaintReplies = (id) => api.get(`/complaints/${id}/replies`);
export const addComplaintReply = (id, payload) => api.post(`/complaints/${id}/replies`, payload);

export default api;
