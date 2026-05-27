import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// Attach token from localStorage (caregiver)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("caregiverToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
