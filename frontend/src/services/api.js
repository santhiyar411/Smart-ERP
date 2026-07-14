import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
});

export const healthCheck = () => api.get("/health");
export const getDashboardSummary = () => api.get("/dashboard");
export const getDepartmentStats = () => api.get("/dashboard/departments");

export const getEmployees = () => api.get("/employees");
export const createEmployee = (data) => api.post("/employees", data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

export const getProjects = () => api.get("/projects");
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const assignEmployeeToProject = (projectId, employeeId) =>
  api.post(`/projects/${projectId}/employees`, { employee_id: employeeId });

export const getDocuments = () => api.get("/documents");
export const uploadDocument = (formData) =>
  api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export default api;