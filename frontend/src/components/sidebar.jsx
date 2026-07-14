import React, { useState } from "react";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    id: "employees",
    label: "Employees",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 19a4 4 0 0 0-8 0" />
        <circle cx="12" cy="8" r="3.5" />
        <path d="M19 19a3 3 0 0 0-2-2.8" />
        <path d="M5 19a3 3 0 0 1 2-2.8" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Documents",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </svg>
    ),
  },
  {
    id: "ocr-results",
    label: "OCR Results",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4h8l4 4v12H6z" />
        <path d="M14 4v4h4" />
        <path d="M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

function Sidebar() {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandIcon}>ERP</div>
        <div>
          <div style={styles.brandTitle}>Northstar ERP</div>
          <div style={styles.brandSubtitle}>Operations Hub</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveItem(item.id)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.activeNavItem : {}),
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.footerCard}>
          <div style={styles.statusDot} />
          <div>
            <div style={styles.footerTitle}>System Status</div>
            <div style={styles.footerText}>All services online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 280,
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    color: "#f8fafc",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "0.04em",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navItem: {
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "12px 14px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    fontSize: 14,
    fontWeight: 600,
  },
  activeNavItem: {
    background: "rgba(59, 130, 246, 0.18)",
    color: "#fff",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    paddingTop: "20px",
  },
  footerCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)",
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: 700,
  },
  footerText: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 2,
  },
};

export default Sidebar;