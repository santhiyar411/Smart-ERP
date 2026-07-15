import React, { useState, useEffect } from "react";
import { getMe, uploadDocument } from "../services/api";

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        getMe()
            .then((res) => {
                setUser(res.data?.user || null);
            })
            .catch((err) => {
                console.error("Failed to load user profile", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }
        setError("");
        setMessage("");
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await uploadDocument(formData);
            setMessage("Resume/Document uploaded and parsed successfully!");
            setFile(null);
            // Reset input element
            e.target.reset();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to upload document.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading user profile...</div>;
    }

    if (!user) {
        return (
            <div style={styles.errorContainer}>
                <h3>Profile Error</h3>
                <p>Could not fetch your profile details. Please log in again.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.profileHeader}>
                <div style={styles.avatar}>
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
                </div>
                <div style={styles.headerInfo}>
                    <h2 style={styles.username}>{user.full_name}</h2>
                    <div style={styles.roleBadge}>{user.role}</div>
                    <p style={styles.userEmail}>{user.email}</p>
                </div>
            </div>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Employment Details</h3>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Employee ID:</span>
                        <span style={styles.detailVal}>{user.employee_id || "N/A"}</span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Department:</span>
                        <span style={styles.detailVal}>{user.department || "General Administration"}</span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Assigned Role:</span>
                        <span style={styles.detailVal}>{user.role}</span>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Quick Upload Portal</h3>
                    <p style={styles.cardText}>
                        Upload your latest Resume, Certificates or corporate forms. The AI-module automatically parses details via Tesseract OCR and updates skill qualifications.
                    </p>

                    {error && <div style={styles.errorMsg}>{error}</div>}
                    {message && <div style={styles.successMsg}>{message}</div>}

                    <form onSubmit={handleUploadSubmit} style={styles.uploadForm}>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            style={styles.fileInput}
                            required
                        />
                        <button type="submit" disabled={uploading} style={styles.uploadBtn}>
                            {uploading ? "Parsing Document..." : "Upload & AI-Sync"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "24px",
        background: "#f8fafc",
        minHeight: "80vh",
    },
    loading: {
        padding: "40px",
        textAlign: "center",
        color: "#475569",
        fontSize: "16px",
    },
    errorContainer: {
        padding: "30px",
        background: "#fff",
        borderRadius: "16px",
        textAlign: "center",
        maxWidth: "400px",
        margin: "40px auto",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    },
    profileHeader: {
        display: "flex",
        alignItems: "center",
        gap: "24px",
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        color: "#fff",
        padding: "32px",
        borderRadius: "20px",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
    },
    avatar: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "36px",
        fontWeight: "700",
        boxShadow: "0 6px 16px rgba(59, 130, 246, 0.3)",
    },
    headerInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    username: {
        margin: 0,
        fontSize: "26px",
        fontWeight: "700",
    },
    roleBadge: {
        alignSelf: "flex-start",
        background: "rgba(59, 130, 246, 0.25)",
        border: "1px solid rgba(59, 130, 246, 0.4)",
        borderRadius: "20px",
        color: "#93c5fd",
        fontSize: "12px",
        padding: "4px 12px",
        fontWeight: "700",
        textTransform: "uppercase",
    },
    userEmail: {
        margin: 0,
        color: "#94a3b8",
        fontSize: "14px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
    },
    card: {
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    },
    cardTitle: {
        margin: "0 0 16px 0",
        fontSize: "18px",
        fontWeight: "700",
        color: "#0f172a",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "8px",
    },
    cardText: {
        color: "#475569",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "16px",
    },
    detailRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
        fontSize: "14px",
    },
    detailLabel: {
        color: "#64748b",
        fontWeight: "600",
    },
    detailVal: {
        color: "#0f172a",
        fontWeight: "700",
    },
    errorMsg: {
        background: "#fef2f2",
        color: "#991b1b",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "12px",
    },
    successMsg: {
        background: "#f0fdf4",
        color: "#166534",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "12px",
    },
    uploadForm: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    fileInput: {
        fontSize: "14px",
        color: "#475569",
        padding: "8px",
        border: "1px dashed #cbd5e1",
        borderRadius: "10px",
    },
    uploadBtn: {
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 14px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(37,99,235,0.15)",
    },
};

export default ProfilePage;
