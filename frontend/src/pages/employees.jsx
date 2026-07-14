import { useEffect, useState } from "react";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from "../services/api";

const emptyForm = {
  employee_code: "",
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  joining_date: "",
};

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadEmployees = () => {
    getEmployees()
      .then((res) => setEmployees(res.data || []))
      .catch((err) => console.error("Failed to load employees", err));
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateEmployee(editingId, form);
      } else {
        await createEmployee(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      loadEmployees();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setForm({
      employee_code: employee.employee_code || "",
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      joining_date: employee.joining_date || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      loadEmployees();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Employees</h2>

      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Employee Code" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <input style={{ background: "#fff", border: "1px solid #d1d5db", color: "#0f172a", borderRadius: 10, padding: "10px 12px" }} placeholder="Joining Date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
        </div>
        <button type="submit" style={{ marginTop: 12 }}>{editingId ? "Update Employee" : "Add Employee"}</button>
      </form>

      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)" }}>
        {employees.length === 0 ? (
          <p style={{ color: "#64748b" }}>No employees found in the database.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", padding: 8 }}>Email</th>
                <th style={{ textAlign: "left", padding: 8 }}>Department</th>
                <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td style={{ padding: 8 }}>{employee.name}</td>
                  <td style={{ padding: 8 }}>{employee.email}</td>
                  <td style={{ padding: 8 }}>{employee.department}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => handleEdit(employee)}>Edit</button>{" "}
                    <button onClick={() => handleDelete(employee.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default EmployeesPage;