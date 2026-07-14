import { useEffect, useState } from "react";
import { getDashboardSummary, getDepartmentStats } from "../services/api";

function DashboardPage() {
  const [summary, setSummary] = useState({
    total_employees: 0,
    active_projects: 0,
    documents_uploaded: 0,
    pending_ocr: 0,
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getDepartmentStats()])
      .then(([summaryRes, deptRes]) => {
        setSummary(summaryRes.data || {});
        setDepartments(deptRes.data || []);
      })
      .catch((err) => console.error("Dashboard load failed", err));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 18 }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>Employees</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.total_employees}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 18 }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>Active Projects</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.active_projects}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 18 }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>Documents</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.documents_uploaded}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 18 }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>Pending OCR</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.pending_ocr}</div>
        </div>
      </div>

      <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, padding: 18 }}>
        <h3>Department Distribution</h3>
        {departments.length === 0 ? (
          <p style={{ color: "#64748b" }}>No department data yet.</p>
        ) : (
          <ul>
            {departments.map((item) => (
              <li key={item.label}>
                {item.label}: {item.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;