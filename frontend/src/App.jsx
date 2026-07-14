import { useEffect, useState } from "react";
import "./App.css";
import DashboardPage from "./pages/dashboard";
import EmployeesPage from "./pages/employees";
import ProjectsPage from "./pages/projects";
import DocumentsPage from "./pages/documents";
import { healthCheck } from "./services/api";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Business overview and department metrics",
    component: <DashboardPage />,
  },
  {
    id: "employees",
    label: "Employees",
    description: "Manage employee records and HR details",
    component: <EmployeesPage />,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Track projects and assign team members",
    component: <ProjectsPage />,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Upload documents and view OCR results",
    component: <DocumentsPage />,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendState, setBackendState] = useState({
    ok: false,
    message: "Checking backend...",
  });

  useEffect(() => {
    healthCheck()
      .then(() => {
        setBackendState({
          ok: true,
          message: "Backend connected",
        });
      })
      .catch(() => {
        setBackendState({
          ok: false,
          message: "Backend offline",
        });
      });
  }, []);

  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-badge">ER</div>
          <div>
            <h1>ERP Flow</h1>
            <p>HR • Projects • Documents</p>
          </div>
        </div>

        <div className={`status-pill ${backendState.ok ? "online" : "offline"}`}>
          {backendState.message}
        </div>

        <nav className="nav-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations Portal</p>
            <h2>{currentTab.label}</h2>
            <p className="topbar-description">{currentTab.description}</p>
          </div>

          <div className={`connection-badge ${backendState.ok ? "online" : "offline"}`}>
            {backendState.ok ? "Live" : "Offline"}
          </div>
        </header>

        <section className="content-card">{currentTab.component}</section>
      </main>
    </div>
  );
}

export default App;
