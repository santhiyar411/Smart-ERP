import { assignEmployeeToProject, createProject, deleteProject, getEmployees, getProjects, updateProject } from "../services/api";
import React, { useEffect, useMemo, useState } from "react";

const emptyForm = {
  project_name: "",
  description: "",
  status: "ACTIVE",
  start_date: "",
  end_date: "",
};

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [assignmentProjectId, setAssignmentProjectId] = useState(null);

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();
    return projects.filter((project) => {
      return (
        project.project_name?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.status?.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (project) => {
    setEditingId(project.id);
    setForm({
      project_name: project.project_name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.project_name) {
      alert("Please enter a project name.");
      return;
    }

    try {
      if (editingId) {
        await updateProject(editingId, form);
      } else {
        await createProject(form);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadProjects();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      await deleteProject(id);
      loadProjects();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const toggleEmployeeAssignment = async (projectId, employeeId) => {
    try {
      await assignEmployeeToProject(projectId, employeeId);
      loadProjects();
    } catch (err) {
      console.error("Assignment failed", err);
    }
  };

  const assignmentProject = projects.find((p) => p.id === assignmentProjectId);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Planning & Delivery</div>
          <h1 style={styles.title}>Project Management</h1>
        </div>
        <button style={styles.primaryButton} onClick={openAddForm}>
          + Add Project
        </button>
      </div>

      <div style={styles.summaryBar}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Projects</div>
          <div style={styles.summaryValue}>{projects.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Active Projects</div>
          <div style={styles.summaryValue}>
            {projects.filter((p) => p.status === "ACTIVE").length}
          </div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search by project name, status or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeadRow}>
              <th style={styles.th}>Project</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Assigned</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.projectName}>{project.project_name}</div>
                  <div style={styles.projectDesc}>{project.description}</div>
                </td>
                <td style={styles.td}>
                  <span style={styles.statusBadge(project.status)}>{project.status}</span>
                </td>
                <td style={styles.td}>{project.start_date}</td>
                <td style={styles.td}>{project.end_date}</td>
                <td style={styles.td}>{project.assigned_employee_ids?.length || 0}</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button style={styles.assignButton} onClick={() => setAssignmentProjectId(project.id)}>
                      Assign
                    </button>
                    <button style={styles.editButton} onClick={() => openEditForm(project)}>
                      Edit
                    </button>
                    <button style={styles.deleteButton} onClick={() => handleDelete(project.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && <div style={styles.emptyState}>No projects found.</div>}
      </div>

      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? "Edit Project" : "Add Project"}</h3>
              <button style={styles.closeButton} onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <input
                  name="project_name"
                  placeholder="Project Name"
                  value={form.project_name}
                  onChange={handleChange}
                  style={styles.input}
                />
                <select name="status" value={form.status} onChange={handleChange} style={styles.input}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
                <input name="start_date" type="date" value={form.start_date} onChange={handleChange} style={styles.input} />
                <input name="end_date" type="date" value={form.end_date} onChange={handleChange} style={styles.input} />
                <textarea
                  name="description"
                  placeholder="Project Description"
                  value={form.description}
                  onChange={handleChange}
                  style={{ ...styles.input, minHeight: "100px", gridColumn: "1 / -1" }}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton}>
                  {editingId ? "Save Changes" : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignmentProject && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign Employees</h3>
              <button style={styles.closeButton} onClick={() => setAssignmentProjectId(null)}>
                ×
              </button>
            </div>

            <div style={styles.assignmentHeader}>
              <strong>{assignmentProject.project_name}</strong>
              <span style={styles.assignmentHint}>Select employees to assign to this project</span>
            </div>

            <div style={styles.assignmentList}>
              {employees.map((employee) => {
                const checked = (assignmentProject.assigned_employee_ids || []).includes(employee.id);

                return (
                  <label key={employee.id} style={styles.assignmentItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEmployeeAssignment(assignmentProject.id, employee.id)}
                    />
                    <span>
                      <strong>{employee.name}</strong> — {employee.email} ({employee.department})
                    </span>
                  </label>
                );
              })}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => setAssignmentProjectId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  eyebrow: {
    color: "#64748b",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    color: "#0f172a",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  summaryBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  summaryCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "14px 16px",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    minWidth: "180px",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  summaryValue: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
    marginTop: "4px",
  },
  toolbar: {
    marginBottom: "12px",
  },
  searchInput: {
    width: "100%",
    maxWidth: "420px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #dbe2ea",
    outline: "none",
    fontSize: "14px",
  },
  tableCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeadRow: {
    background: "#f8fafc",
  },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "13px",
    color: "#475569",
    fontWeight: 700,
    borderBottom: "1px solid #eef2f7",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "12px 14px",
    fontSize: "14px",
    color: "#334155",
  },
  projectName: {
    fontWeight: 700,
    color: "#0f172a",
  },
  projectDesc: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  statusBadge: (status) => ({
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    background:
      status === "ACTIVE"
        ? "#dcfce7"
        : status === "COMPLETED"
          ? "#dbeafe"
          : "#fef3c7",
    color:
      status === "ACTIVE"
        ? "#166534"
        : status === "COMPLETED"
          ? "#1d4ed8"
          : "#92400e",
  }),
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  assignButton: {
    background: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 600,
  },
  editButton: {
    background: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 600,
  },
  deleteButton: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 600,
  },
  emptyState: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "640px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #dbe2ea",
    outline: "none",
    fontSize: "14px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
  },
  cancelButton: {
    background: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  assignmentHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  assignmentHint: {
    color: "#64748b",
    fontSize: "13px",
  },
  assignmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "320px",
    overflowY: "auto",
  },
  assignmentItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default ProjectsPage;