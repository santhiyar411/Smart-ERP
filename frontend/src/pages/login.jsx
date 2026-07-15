import React, { useState } from "react";
import { loginUser } from "../services/api";

function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await loginUser({ email, password });
            const { token, user } = res.data;
            localStorage.setItem("erp_token", token);
            localStorage.setItem("erp_user", JSON.stringify(user));
            onLoginSuccess(token, user);
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Please check credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logoBadge}>ERP</div>
                    <h2 style={styles.title}>ERP Northstar</h2>
                    <p style={styles.subtitle}>Sign in to your corporate workspace</p>
                </div>

                {error && <div style={styles.errorAlert}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
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

                    <button type="submit" disabled={loading} style={styles.submitButton}>
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                <div style={styles.footer}>
                    <span>Don't have an account? </span>
                    <button onClick={onSwitchToRegister} style={styles.switchButton}>
                        Register here
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
        maxWidth: "420px",
        background: "rgba(15, 23, 42, 0.65)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
        color: "#f8fafc",
    },
    header: {
        textAlign: "center",
        marginBottom: "32px",
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
        fontSize: "24px",
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
        padding: "12px 14px",
        color: "#fca5a5",
        fontSize: "14px",
        marginBottom: "24px",
        textAlign: "center",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "12px",
        fontWeight: 600,
        color: "#cbd5e1",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    input: {
        background: "rgba(30, 41, 59, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "10px",
        padding: "12px 14px",
        fontSize: "14px",
        color: "#fff",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
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
        transition: "transform 0.1s, box-shadow 0.2s",
    },
    footer: {
        textAlign: "center",
        marginTop: "24px",
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

export default LoginPage;
