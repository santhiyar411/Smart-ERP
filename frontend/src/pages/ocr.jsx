import React, { useState, useEffect } from "react";
import { getDocuments } from "../services/api";

function OCRResultsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadDocuments = () => {
        getDocuments()
            .then((res) => {
                setDocuments(res.data || []);
            })
            .catch((err) => {
                console.error("Failed to load OCR documents", err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const filteredDocs = documents.filter((doc) => {
        const term = searchQuery.toLowerCase();
        return (
            (doc.file_path || "").toLowerCase().includes(term) ||
            (doc.document_type || "").toLowerCase().includes(term) ||
            (doc.extracted_text || "").toLowerCase().includes(term)
        );
    });

    const getFileName = (path) => {
        if (!path) return "Unknown Document";
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    };

    if (loading) {
        return <div style={styles.loading}>Retrieving OCR database records...</div>;
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <div style={styles.eyebrow}>Document Intelligence</div>
                    <h2 style={styles.title}>OCR Text Extraction Records</h2>
                </div>
            </header>

            <div style={styles.toolbar}>
                <input
                    type="text"
                    placeholder="Search extracted text, file names, or types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <div style={styles.grid}>
                {filteredDocs.map((doc) => (
                    <div key={doc.id || doc.document_id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div>
                                <h3 style={styles.cardTitle}>{getFileName(doc.file_path)}</h3>
                                <div style={styles.cardMeta}>
                                    <span>Uploaded: {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : "N/A"}</span>
                                    <span style={styles.divider}>•</span>
                                    <span>Type: {doc.document_type}</span>
                                </div>
                            </div>
                            <div style={styles.avatar}>OCR</div>
                        </div>

                        <div style={styles.textContainer}>
                            <h4 style={styles.textHeading}>Extracted Text Output</h4>
                            <div style={styles.preWrapper}>
                                <pre style={styles.preContent}>{doc.extracted_text || "No text parsed in this file."}</pre>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredDocs.length === 0 && (
                    <div style={styles.emptyState}>No OCR logs matching search query found.</div>
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
    loading: {
        padding: "65px",
        textAlign: "center",
        color: "#1e293b",
        fontWeight: "600",
    },
    header: {
        marginBottom: "24px",
    },
    eyebrow: {
        color: "#64748b",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: "750",
    },
    title: {
        margin: 0,
        fontSize: "28px",
        color: "#0f172a",
    },
    toolbar: {
        marginBottom: "20px",
    },
    searchInput: {
        width: "100%",
        maxWidth: "500px",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        color: "#0f172a",
        outline: "none",
    },
    grid: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    card: {
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "16px",
        marginBottom: "16px",
    },
    cardTitle: {
        margin: 0,
        fontSize: "17px",
        fontWeight: "750",
        color: "#0f172a",
    },
    cardMeta: {
        fontSize: "12px",
        color: "#64748b",
        marginTop: "4px",
        display: "flex",
        gap: "8px",
    },
    divider: {
        color: "#cbd5e1",
    },
    avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "12px",
    },
    textContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    textHeading: {
        margin: 0,
        fontSize: "12px",
        fontWeight: "600",
        color: "#94a3b8",
        textTransform: "uppercase",
    },
    preWrapper: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "16px",
        maxHeight: "220px",
        overflowY: "auto",
    },
    preContent: {
        margin: 0,
        whiteSpace: "pre-wrap",
        fontFamily: "Fira Code, Consolas, Monaco, monospace",
        fontSize: "12.5px",
        color: "#334155",
        lineHeight: "1.6",
    },
    emptyState: {
        padding: "36px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "14px",
        background: "#fff",
        borderRadius: "16px",
    },
};

export default OCRResultsPage;
