import React, { useState, useEffect } from "react";
import { getProjects, getEmployees, getProjectRecommendations, getEmployeeRecommendations, assignRecommendedProject } from "../services/api";

function RecommendationsPage() {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

    const [projectRecs, setProjectRecs] = useState(null);
    const [employeeRecs, setEmployeeRecs] = useState(null);
    const [loadingProject, setLoadingProject] = useState(false);
    const [loadingEmployee, setLoadingEmployee] = useState(false);

    const loadData = () => {
        getProjects()
            .then((res) => {
                setProjects(res.data || []);
                if (res.data && res.data.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(res.data[0].project_id);
                }
            })
            .catch((err) => console.error("Failed to load projects", err));

        getEmployees()
            .then((res) => {
                setEmployees(res.data || []);
                if (res.data && res.data.length > 0 && !selectedEmployeeId) {
                    setSelectedEmployeeId(res.data[0].id || res.data[0].employee_id);
                }
            })
            .catch((err) => console.error("Failed to load employees", err));
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            setLoadingProject(true);
            getProjectRecommendations(selectedProjectId)
                .then((res) => {
                    setProjectRecs(res.data || null);
                })
                .catch((err) => console.error("Failed to load recommendations", err))
                .finally(() => setLoadingProject(false));
        } else {
            setProjectRecs(null);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        if (selectedEmployeeId) {
            setLoadingEmployee(true);
            getEmployeeRecommendations(selectedEmployeeId)
                .then((res) => {
                    setEmployeeRecs(res.data || null);
                })
                .catch((err) => console.error("Failed to load recommendations", err))
                .finally(() => setLoadingEmployee(false));
        } else {
            setEmployeeRecs(null);
        }
    }, [selectedEmployeeId]);

    const handleAssign = (projectTitle) => {
        if (!selectedEmployeeId) {
            alert("Please select an employee first.");
            return;
        }
        assignRecommendedProject(selectedEmployeeId, projectTitle)
            .then((res) => {
                alert(res.data.message || `Successfully assigned employee to project: ${projectTitle}`);
                // Refresh data
                loadData();
                if (selectedEmployeeId) {
                    setLoadingEmployee(true);
                    getEmployeeRecommendations(selectedEmployeeId)
                        .then((res2) => {
                            setEmployeeRecs(res2.data || null);
                        })
                        .catch((err) => console.error(err))
                        .finally(() => setLoadingEmployee(false));
                }
            })
            .catch((err) => {
                console.error("Assignment failed", err);
                alert(err.response?.data?.error || "Failed to assign employee to project.");
            });
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.eyebrow}>AI Recommendation Engine</div>
                <h2 style={styles.title}>Intelligent Project Matching</h2>
            </header>

            <div style={styles.tabGrid}>
                {/* RECOMMEND EMPLOYEES FOR PROJECT */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Find Candidates for Project</h3>
                    <p style={styles.desc}>Select an active project to calculate skill coverage and matching engineers.</p>

                    <div style={styles.selectGroup}>
                        <label style={styles.label}>Select Project:</label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            style={styles.select}
                        >
                            <option value="">-- Choose Project --</option>
                            {projects.map((p) => (
                                <option key={p.project_id} value={p.project_id}>
                                    {p.project_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loadingProject && <div style={styles.loading}>Calculating skill matching profiles...</div>}

                    {!loadingProject && projectRecs && (
                        <div style={styles.results}>
                            <div style={styles.reqSummary}>
                                <strong>Required Skills:</strong>{" "}
                                {projectRecs.required_skills?.length > 0 ? (
                                    projectRecs.required_skills.map((skill, index) => (
                                        <span key={index} style={styles.reqPill}>
                                            {skill.skill_name} ({skill.priority_level})
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ color: "#94a3b8" }}>No specific skills required. Add project requirements first.</span>
                                )}
                            </div>

                            <h4 style={styles.sectionHeader}>Recommended Engineers</h4>
                            <div style={styles.list}>
                                {projectRecs.recommendations?.map((rec, index) => (
                                    <div key={index} style={styles.recItem}>
                                        <div style={styles.recHeader}>
                                            <div>
                                                <div style={styles.recName}>{rec.name}</div>
                                                <div style={styles.recEmail}>{rec.email} — {rec.department}</div>
                                            </div>
                                            <div style={styles.scoreBadge(rec.match_percentage)}>
                                                {rec.match_percentage}% Match
                                            </div>
                                        </div>

                                        <div style={styles.metadataZone}>
                                            <div style={styles.subLabel}>Matched Skills:</div>
                                            <div style={styles.matchedSkills}>
                                                {rec.matched_skills.map((s, i) => (
                                                    <span key={i} style={styles.matchPill}>{s}</span>
                                                ))}
                                                {rec.matched_skills.length === 0 && <span style={{ color: "#94a3b8" }}>None</span>}
                                            </div>

                                            <div style={styles.subLabel}>Missing Required Skills (Gap):</div>
                                            <div style={styles.missingSkills}>
                                                {rec.missing_skills.map((s, i) => (
                                                    <span key={i} style={styles.gapPill}>{s}</span>
                                                ))}
                                                {rec.missing_skills.length === 0 && <span style={{ color: "#166534", fontWeight: 650 }}>Fully Qualified!</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!projectRecs.recommendations || projectRecs.recommendations.length === 0) && (
                                    <div style={styles.empty}>No suitable matches found in database.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RECOMMEND PROJECTS FOR EMPLOYEE */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Find Projects for Employee</h3>
                    <p style={styles.desc}>Select an employee profile to match their skills with projects and analyze gaps.</p>

                    <div style={styles.selectGroup}>
                        <label style={styles.label}>Select Employee:</label>
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            style={styles.select}
                        >
                            <option value="">-- Choose Employee --</option>
                            {employees.map((emp) => (
                                <option key={emp.id || emp.employee_id} value={emp.id || emp.employee_id}>
                                    {emp.name} ({emp.department || "No Dept"})
                                </option>
                            ))}
                        </select>
                    </div>

                    {loadingEmployee && <div style={styles.loading}>Analyzing project requisitions...</div>}

                    {!loadingEmployee && employeeRecs && (
                        <div style={styles.results}>
                            <div style={styles.reqSummary}>
                                <strong>Registered Skills:</strong>{" "}
                                {employeeRecs.employee_skills?.length > 0 ? (
                                    employeeRecs.employee_skills.map((skill, index) => (
                                        <span key={index} style={styles.matchPill}>
                                            {skill.skill_name} (Proficiency: {skill.proficiency_score}/5)
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ color: "#ef4444", fontWeight: 600 }}>No skills registered. Upload standard CV text to sync.</span>
                                )}
                            </div>

                            <h4 style={styles.sectionHeader}>Recommended Projects</h4>
                            <div style={styles.list}>
                                {employeeRecs.recommendations?.map((rec, index) => (
                                    <div key={index} style={styles.recItem}>
                                        <div style={styles.recHeader}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={styles.recName}>{rec.project_name}</span>
                                                    <span style={styles.difficultyBadge(rec.difficulty)}>{rec.difficulty || "General"}</span>
                                                </div>
                                                <div style={styles.recDesc}>{rec.description || "No project description."}</div>
                                            </div>
                                            <div style={styles.scoreBadge(rec.match_percentage)}>
                                                {rec.match_percentage}% Match
                                            </div>
                                        </div>

                                        <div style={styles.metadataZone}>
                                            <div style={styles.subLabel}>Requirements Met:</div>
                                            <div style={styles.matchedSkills}>
                                                {rec.matched_skills.map((s, i) => (
                                                    <span key={i} style={styles.matchPill}>{s}</span>
                                                ))}
                                                {rec.matched_skills.length === 0 && <span style={{ color: "#94a3b8" }}>None</span>}
                                            </div>

                                            <div style={styles.subLabel}>Project Constraints (Missing Skills):</div>
                                            <div style={styles.missingSkills}>
                                                {rec.missing_skills.map((s, i) => (
                                                    <span key={i} style={styles.gapPill}>{s}</span>
                                                ))}
                                                {rec.missing_skills.length === 0 && <span style={{ color: "#166534", fontWeight: 650 }}>Matches All constraints!</span>}
                                            </div>

                                            <button
                                                onClick={() => handleAssign(rec.project_name)}
                                                style={styles.assignButton}
                                            >
                                                Assign Employee to Project
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!employeeRecs.recommendations || employeeRecs.recommendations.length === 0) && (
                                    <div style={styles.empty}>No suitable matching projects found.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
        marginBottom: "24px",
    },
    eyebrow: {
        color: "#64748b",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: "700",
    },
    title: {
        margin: 0,
        fontSize: "28px",
        color: "#0f172a",
    },
    tabGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
        gap: "24px",
    },
    card: {
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    },
    cardTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "750",
        color: "#0f172a",
    },
    desc: {
        color: "#64748b",
        fontSize: "13px",
        margin: "6px 0 20px 0",
    },
    selectGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: "20px",
    },
    label: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#475569",
    },
    select: {
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
    },
    loading: {
        padding: "30px",
        textAlign: "center",
        color: "#3b82f6",
        fontSize: "14px",
        fontWeight: "600",
    },
    results: {
        marginTop: "16px",
    },
    reqSummary: {
        background: "#f8fafc",
        padding: "12px 16px",
        borderRadius: "12px",
        fontSize: "13px",
        color: "#334155",
        lineHeight: "1.8",
        border: "1px solid #e2e8f0",
        marginBottom: "20px",
    },
    reqPill: {
        display: "inline-block",
        background: "#e2e8f0",
        color: "#334155",
        padding: "2px 8px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "650",
        marginRight: "6px",
    },
    sectionHeader: {
        margin: "0 0 12px 0",
        fontSize: "14px",
        fontWeight: "700",
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    recItem: {
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        background: "#fff",
        transition: "box-shadow 0.2s",
        ":hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        },
    },
    recHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
    },
    recName: {
        fontWeight: "750",
        color: "#0f172a",
        fontSize: "15px",
    },
    recEmail: {
        fontSize: "12px",
        color: "#64748b",
        marginTop: "2px",
    },
    recDesc: {
        fontSize: "12px",
        color: "#64748b",
        marginTop: "6px",
        lineHeight: "1.5"
    },
    scoreBadge: (score) => {
        let bg = "#fee2e2";
        let color = "#991b1b";
        if (score >= 70) {
            bg = "#dcfce7";
            color = "#166534";
        } else if (score >= 40) {
            bg = "#fef3c7";
            color = "#92400e";
        }
        return {
            background: bg,
            color: color,
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
        };
    },
    difficultyBadge: (difficulty) => {
        let bg = "#f1f5f9";
        let color = "#475569";
        if (difficulty === "Advanced") {
            bg = "#faf5ff";
            color = "#6b21a8";
        } else if (difficulty === "Intermediate") {
            bg = "#eff6ff";
            color = "#1e40af";
        } else if (difficulty === "Beginner") {
            bg = "#f0fdf4";
            color = "#166534";
        }
        return {
            background: bg,
            color: color,
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "600",
            textTransform: "uppercase"
        };
    },
    metadataZone: {
        borderTop: "1px dashed #f1f5f9",
        paddingTop: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    subLabel: {
        fontSize: "11px",
        color: "#94a3b8",
        fontWeight: "600",
        textTransform: "uppercase",
    },
    matchedSkills: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
    },
    missingSkills: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
    },
    matchPill: {
        background: "#e0f2fe",
        color: "#0369a1",
        padding: "2px 8px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "600",
    },
    gapPill: {
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "2px 8px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "600",
    },
    assignButton: {
        alignSelf: "flex-start",
        marginTop: "10px",
        padding: "8px 16px",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        fontSize: "12px",
        fontWeight: "650",
        cursor: "pointer",
        transition: "background 0.2s",
        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
    },
    empty: {
        color: "#94a3b8",
        fontSize: "13px",
        textAlign: "center",
        padding: "24px 0",
    },
};

export default RecommendationsPage;
