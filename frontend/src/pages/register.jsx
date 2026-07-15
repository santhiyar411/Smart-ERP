import React, { useState } from "react";
import { registerUser } from "../services/api";

function RegisterPage({ onSwitchToLogin }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [department, setDepartment] = useState("");
    const [role, setRole] = useState("Employee");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fullName || !email || !password) {
            setError("Full name, email, and password are required.");
            return;
        }
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await registerUser({
                full_name: fullName,
                email,
                employee_id: employeeId || null,
                password,
                department: department || null,
                role,
            });
            setSuccess("Account registered successfully! Redirecting...");
            setTimeout(() => {
                onSwitchToLogin();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logoBadge}>ERP</div>
                    <h2 style={styles.title}>Create Workspace Account</h2>
                    <p style={styles.subtitle}>Register as an employee or coordinator</p>
                </div>

                {error && <div style={styles.errorAlert}>{error}</div>}
                {success && <div style={styles.successAlert}>{success}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input
                                type="text"
                                placeholder="e.g. John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Employee ID</label>
                            <input
                                type="text"
                                placeholder="e.g. EMP1024"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Corporate Email</label>
                        <input
                            type="email"
                            placeholder="e.g. employee@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Department</label>
                            <input
                                type="text"
                                placeholder="e.g. Engineering"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={styles.select}
                            >
                                <option value="Employee">Employee</option>
                                <option value="HR">HR Coordinator</option>
                                <option value="Admin">Administrator</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={styles.submitButton}>
                        {loading ? "Registering..." : "Create Account"}
                    </button>
                </form>

                <div style={styles.footer}>
                    <span>Already have an account? </span>
                    <button onClick={onSwitchToLogin} style={styles.switchButton}>
                        Sign In here
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        background: "radial-gradient(ellipse at top, #0f172a, #020617)",
        fontFamily: "Inter, system-ui, sans-serif",
    },
    card: {
        width: "100%",
        maxWidth: "500px",
        background: "rgba(15, 23, 42, 0.65)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        padding: "36px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
        color: "#f8fafc",
    },
    header: {
        textAlign: "center",
        marginBottom: "26px",
    },
    logoBadge: {
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
        fontWeight: 800,
        fontSize: "20px",
        boxShadow: "0 8px 16px rgba(59, 130, 246, 0.25)",
    },
    title: {
        fontSize: "22px",
        fontWeight: 700,
        margin: "0 0 6px",
        letterSpacing: "-0.02em",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: "14px",
        margin: 0,
    },
    errorAlert: {
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "10px",
        padding: "10px 12px",
        color: "#fca5a5",
        fontSize: "14px",
        marginBottom: "20px",
        textAlign: "center",
    },
    successAlert: {
        background: "rgba(34, 197, 94, 0.15)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        borderRadius: "10px",
        padding: "10px 12px",
        color: "#86efac",
        fontSize: "14px",
        marginBottom: "20px",
        textAlign: "center",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    inputRow: {
        display: "flex",
        gap: "16px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flex: 1,
    },
    label: {
        fontSize: "11px",
        fontWeight: 600,
        color: "#cbd5e1",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    input: {
        background: "rgba(30, 41, 59, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "10px",
        padding: "11px 13px",
        fontSize: "14px",
        color: "#fff",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
    },
    select: {
        background: "rgba(30, 41, 59, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "10px",
        padding: "11px 13px",
        fontSize: "14px",
        color: "#fff",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
    },
    submitButton: {
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px",
        fontSize: "15px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
        marginTop: "8px",
    },
    footer: {
        textAlign: "center",
        marginTop: "20px",
        fontSize: "14px",
        color: "#94a3b8",
    },
    switchButton: {
        background: "transparent",
        border: "none",
        color: "#3b82f6",
        fontWeight: 600,
        cursor: "pointer",
        padding: 0,
        textDecoration: "underline",
    },
};

export default RegisterPage;
