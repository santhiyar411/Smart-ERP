import React, { useEffect, useState } from "react";
import "./App.css";

import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import DashboardPage from "./pages/dashboard";
import EmployeesPage from "./pages/employees";
import ProjectsPage from "./pages/projects";
import DocumentsPage from "./pages/documents";
import OCRResultsPage from "./pages/ocr";
import AnalyticsPage from "./pages/analytics";
import RecommendationsPage from "./pages/recommendations";
import ProfilePage from "./pages/profile";

import { healthCheck, getMe } from "./services/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("erp_token") || null);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login"); // login, register, or dashboard tabs
  const [activeTab, setActiveTab] = useState("dashboard");

  const [backendState, setBackendState] = useState({
    ok: false,
    message: "Verifying ERP services...",
  });

  // Verify backend health
  useEffect(() => {
    healthCheck()
      .then(() => {
        setBackendState({ ok: true, message: "Server Connected (PostgreSQL)" });
      })
      .catch(() => {
        setBackendState({ ok: false, message: "ERP Gateway Offline" });
      });
  }, []);

  // Fetch current user details on mount or token change
  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => {
          const u = res.data?.user;
          setUser(u);
          localStorage.setItem("erp_user", JSON.stringify(u));
          setCurrentPage("dashboard-shell");
        })
        .catch((err) => {
          console.error("Token validation failed", err);
          handleLogout();
        });
    } else {
      setCurrentPage("login");
      setUser(null);
    }
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentPage("dashboard-shell");
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setToken(null);
    setUser(null);
    setCurrentPage("login");
  };

  // Define tab navigation based on role access
  const allTabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
      component: <DashboardPage />,
      roles: ["Admin", "HR", "Employee"],
    },
    {
      id: "employees",
      label: "Employees",
      icon: "👥",
      component: <EmployeesPage />,
      roles: ["Admin", "HR"],
    },
    {
      id: "projects",
      label: "Projects",
      icon: "💼",
      component: <ProjectsPage />,
      roles: ["Admin", "HR"],
    },
    {
      id: "documents",
      label: "Document Upload",
      icon: "📤",
      component: <DocumentsPage />,
      roles: ["Admin", "HR", "Employee"],
    },
    {
      id: "ocr-results",
      label: "OCR Results",
      icon: "📝",
      component: <OCRResultsPage />,
      roles: ["Admin", "HR"],
    },
    {
      id: "analytics",
      label: "Skill Analytics",
      icon: "📈",
      component: <AnalyticsPage />,
      roles: ["Admin", "HR"],
    },
    {
      id: "recommendations",
      label: "AI Matching Recommendations",
      icon: "🤖",
      component: <RecommendationsPage />,
      roles: ["Admin", "HR", "Employee"],
    },
    {
      id: "profile",
      label: "My Profile",
      icon: "👤",
      component: <ProfilePage />,
      roles: ["Admin", "HR", "Employee"],
    },
  ];

  // Filter tabs for the authenticated user
  const userRole = user?.role || "Employee";
  const visibleTabs = allTabs.filter((tab) => tab.roles.includes(userRole));

  // Determine current active component
  const activeComponent =
    visibleTabs.find((tab) => tab.id === activeTab)?.component || <DashboardPage />;

  if (currentPage === "login") {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentPage("register")}
      />
    );
  }

  if (currentPage === "register") {
    return <RegisterPage onSwitchToLogin={() => setCurrentPage("login")} />;
  }

  return (
    <div className="app-shell" style={styles.appShell}>
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={styles.sidebar}>
        <div className="brand-block" style={styles.brandBlock}>
          <div className="brand-badge" style={styles.brandBadge}>ER</div>
          <div>
            <h1 style={styles.brandTitle}>Northstar ERP</h1>
            <p style={styles.brandSubtitle}>AI Software Suite</p>
          </div>
        </div>

        <div style={styles.serverStatusCard(backendState.ok)}>
          <div style={styles.statusDot(backendState.ok)} />
          <span style={styles.statusText}>{backendState.message}</span>
        </div>

        <nav className="nav-list" style={styles.navList}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              style={{
                ...styles.navButton,
                ...(activeTab === tab.id ? styles.activeNavButton : {}),
              }}
            >
              <span style={styles.navIcon}>{tab.icon}</span>
              <span style={styles.navLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Card Footing */}
        {user && (
          <div style={styles.userFooting}>
            <div style={styles.userAvatar}>
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userFullName}>{user.full_name}</div>
              <div style={styles.userRole}>{user.role} — {user.department || "Dev"}</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
              🚪
            </button>
          </div>
        )}
      </aside>

      {/* Main panel execution */}
      <main className="main-panel" style={styles.mainPanel}>
        <header className="topbar" style={styles.topbar}>
          <div>
            <p className="eyebrow" style={styles.eyebrow}>
              {userRole.toUpperCase()} PORTAL
            </p>
            <h2 style={styles.tabHeading}>
              {allTabs.find((t) => t.id === activeTab)?.label || "Workspace"}
            </h2>
          </div>

          <div style={styles.topbarProfile}>
            <span style={styles.topbarRoleBadge}>{userRole}</span>
          </div>
        </header>

        <section className="content-card" style={styles.contentCard}>
          {activeComponent}
        </section>
      </main>
    </div>
  );
}

const styles = {
  appShell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  sidebar: {
    width: "280px",
    background: "linear-gradient(180deg, #09132e 0%, #030712 100%)",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
    color: "#f1f5f9",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  brandBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "15px",
  },
  brandTitle: {
    fontSize: "15px",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
  },
  brandSubtitle: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: "2px 0 0 0",
  },
  serverStatusCard: (ok) => ({
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }),
  statusDot: (ok) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: ok ? "#10b981" : "#ef4444",
    boxShadow: ok ? "0 0 0 4px rgba(16, 185, 129, 0.25)" : "0 0 0 4px rgba(239, 68, 68, 0.25)",
  }),
  statusText: {
    fontSize: "11.5px",
    fontWeight: "500",
    color: "#cbd5e1",
  },
  navList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "12px",
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "13.5px",
    fontWeight: "600",
    width: "100%",
    transition: "color 0.2s, background-color 0.2s",
  },
  activeNavButton: {
    background: "rgba(59, 130, 246, 0.16)",
    color: "#fff",
  },
  navIcon: {
    fontSize: "16px",
  },
  navLabel: {
    flex: 1,
  },
  userFooting: {
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#3b82f6",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "750",
    fontSize: "13px",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userFullName: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: {
    fontSize: "10.5px",
    color: "#94a3b8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoutBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
  },
  mainPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "#f1f5f9",
  },
  topbar: {
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  eyebrow: {
    margin: "0 0 2px 0",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
  },
  tabHeading: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "750",
    color: "#0f172a",
  },
  topbarProfile: {
    display: "flex",
    alignItems: "center",
  },
  topbarRoleBadge: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "20px",
    color: "#1e3a8a",
    fontSize: "11px",
    padding: "4px 10px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  contentCard: {
    flex: 1,
    overflowY: "auto",
  },
};

export default App;
