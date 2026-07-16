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
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = () => {
    setRefreshing(true);
    Promise.all([getDashboardSummary(), getDepartmentStats()])
      .then(([summaryRes, deptRes]) => {
        setSummary(summaryRes.data || {});
        setDepartments(deptRes.data || []);
      })
      .catch((err) => console.error("Dashboard load failed", err))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>AI-Integrated Enterprise Portal</div>
          <h2 style={styles.title}>System Analytics Dashboard</h2>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh Stats"}
        </button>
      </header>

      {/* Stats Cards */}
      <div style={styles.grid}>
        <div style={styles.statCard("#3b82f6")}>
          <div style={styles.cardHeader}>
            <div style={styles.statLabel}>Total Employees</div>
            <div style={styles.iconContainer("rgba(59, 130, 246, 0.15)")}>👥</div>
          </div>
          <div style={styles.statValue}>{summary.total_employees}</div>
          <div style={styles.statSub}>Dynamic records in PostgreSQL</div>
        </div>

        <div style={styles.statCard("#10b981")}>
          <div style={styles.cardHeader}>
            <div style={styles.statLabel}>Active Projects</div>
            <div style={styles.iconContainer("rgba(16, 185, 129, 0.15)")}>💼</div>
          </div>
          <div style={styles.statValue}>{summary.active_projects}</div>
          <div style={styles.statSub}>Currently in execution</div>
        </div>

        <div style={styles.statCard("#a855f7")}>
          <div style={styles.cardHeader}>
            <div style={styles.statLabel}>Uploaded Resumes</div>
            <div style={styles.iconContainer("rgba(168, 85, 247, 0.15)")}>📄</div>
          </div>
          <div style={styles.statValue}>{summary.documents_uploaded}</div>
          <div style={styles.statSub}>Verified file storage instances</div>
        </div>

        <div style={styles.statCard("#f59e0b")}>
          <div style={styles.cardHeader}>
            <div style={styles.statLabel}>Pending OCR</div>
            <div style={styles.iconContainer("rgba(245, 158, 11, 0.15)")}>⏳</div>
          </div>
          <div style={styles.statValue}>{summary.pending_ocr}</div>
          <div style={styles.statSub}>Scanned queued documents</div>
        </div>
      </div>

      {/* Department Distribution Section */}
      <div style={styles.chartSec}>
        <div style={styles.secHeader}>
          <h3 style={styles.secTitle}>Department Headcounts</h3>
          <span style={styles.secSubtitle}>Active employee resource groups</span>
        </div>

        {departments.length === 0 ? (
          <div style={styles.emptyState}>No employee department mappings found in database.</div>
        ) : (
          <div style={styles.deptGrid}>
            {departments.map((item) => (
              <div key={item.label} style={styles.deptCard}>
                <div style={styles.deptInfo}>
                  <span style={styles.deptLabel}>{item.label || "General"}</span>
                  <span style={styles.deptCount}>{item.value} count</span>
                </div>
                <div style={styles.scoreBarBg}>
                  <div style={styles.scoreBarFill(item.value, departments)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  eyebrow: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: "755",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    color: "#0f172a",
  },
  refreshButton: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "650",
    color: "#1e293b",
    cursor: "pointer",
    fontSize: "13.5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.015)",
    transition: "background 0.2s",
    outline: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  statCard: (accent) => ({
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.03)",
    borderLeft: `5px solid ${accent}`,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }),
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: "650",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  iconContainer: (bg) => ({
    background: bg,
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  }),
  statValue: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#0f172a",
  },
  statSub: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  chartSec: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.03)",
  },
  secHeader: {
    marginBottom: "20px",
  },
  secTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "750",
    color: "#0f172a",
  },
  secSubtitle: {
    fontSize: "12px",
    color: "#64748b",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    padding: "30px 0",
  },
  deptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  deptCard: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  deptInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  deptLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  deptCount: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
  },
  scoreBarBg: {
    background: "#e2e8f0",
    height: "6px",
    borderRadius: "3px",
    overflow: "hidden",
  },
  scoreBarFill: (count, list) => {
    const counts = list.map((i) => i.value);
    const maxVal = Math.max(...counts, 1);
    const pct = int((count / maxVal) * 100);
    return {
      background: "#3b82f6",
      width: `${pct}%`,
      height: "100%",
      borderRadius: "3px",
    };
  },
};

// Helper since raw `int` filter behaves differently in react rendering sandbox
const int = (val) => Math.floor(Number(val)) || 0;

export default DashboardPage;