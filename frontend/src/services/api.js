import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("erp_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");

// Health check and dashboards
export const healthCheck = () => api.get("/health");
export const getDashboardSummary = () => api.get("/dashboard");
export const getDepartmentStats = () => api.get("/dashboard/departments");
export const getDashboardAnalytics = () => api.get("/dashboard/analytics");

// Employee CRUD
export const getEmployees = () => api.get("/employees");
export const createEmployee = (data) => api.post("/employees", data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

// Project CRUD and Assignment
export const getProjects = () => api.get("/projects");
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const assignEmployeeToProject = (projectId, employeeId) =>
  api.post(`/projects/${projectId}/employees`, { employee_id: employeeId });
export const removeEmployeeFromProject = (projectId, employeeId) =>
  api.delete(`/projects/${projectId}/employees/${employeeId}`);

// Requirements
export const getProjectRequirements = (projectId) => api.get(`/projects/${projectId}/requirements`);
export const createProjectRequirement = (projectId, data) => api.post(`/projects/${projectId}/requirements`, data);
export const deleteProjectRequirement = (projectId, reqId) => api.delete(`/projects/${projectId}/requirements/${reqId}`);

// OCR and Documents
export const getDocuments = () => api.get("/documents");
export const uploadDocument = (formData) =>
  api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Recommendations
export const getProjectRecommendations = (projectId) => api.get(`/recommendations/project/${projectId}`);
export const getEmployeeRecommendations = (employeeId) => api.get(`/recommendations/employee/${employeeId}`);

export default api;