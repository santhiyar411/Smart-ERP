import React, { useState, useEffect } from "react";
import { getDashboardAnalytics } from "../services/api";

function AnalyticsPage() {
    const [data, setData] = useState({
        top_skills: [],
        skill_distribution: {},
        utilization_rate: 0,
        demanded_tech: [],
        recommended_stats: {},
        heatmap: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardAnalytics()
            .then((res) => {
                setData(res.data || {});
            })
            .catch((err) => {
                console.error("Failed to load analytics data", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div style={styles.loading}>Generating real-time analytics...</div>;
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <div style={styles.eyebrow}>AI-Driven Insights</div>
                    <h2 style={styles.title}>Company Skill Analytics</h2>
                </div>
            </header>

            <div style={styles.statsBar}>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Employee Utilization Rate</div>
                    <div style={styles.statValue}>{data.utilization_rate}%</div>
                    <div style={styles.progressBarBg}>
                        <div style={styles.progressBarFill(data.utilization_rate)} />
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Top Skill in Company</div>
                    <div style={styles.statValue}>
                        {data.top_skills[0]?.skill_name || "N/A"}
                    </div>
                    <div style={styles.statSubtext}>Based on proficiency distribution</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statLabel}>Demanded Requirements</div>
                    <div style={styles.statValue}>
                        {data.demanded_tech[0]?.required_skill || "N/A"}
                    </div>
                    <div style={styles.statSubtext}>Most frequent project requirement</div>
                </div>
            </div>

            <div style={styles.mainGrid}>
                {/* Top Skills Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Top Registered Skills</h3>
                    <div style={styles.list}>
                        {data.top_skills.map((skill, index) => (
                            <div key={index} style={styles.skillRow}>
                                <div style={styles.skillHeader}>
                                    <span style={styles.skillName}>{skill.skill_name}</span>
                                    <span style={styles.skillCount}>{skill.total_count} employees</span>
                                </div>
                                <div style={styles.skillBarBg}>
                                    <div style={styles.skillBarFill(skill.avg_score || 3)} />
                                </div>
                                <div style={styles.skillMeta}>Average Proficiency: {(skill.avg_score || 3).toFixed(1)}/5.0</div>
                            </div>
                        ))}
                        {data.top_skills.length === 0 && <div style={styles.empty}>No skill stats recorded yet.</div>}
                    </div>
                </div>

                {/* Demand vs Resource Matching */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Technology Demand Trends</h3>
                    <p style={styles.description}>Highly prioritized project requirements in active pipelines</p>
                    <div style={styles.list}>
                        {data.demanded_tech.map((tech, index) => (
                            <div key={index} style={styles.demandRow}>
                                <div style={styles.demandDot} />
                                <div style={styles.demandInfo}>
                                    <div style={styles.demandName}>{tech.required_skill}</div>
                                    <div style={styles.demandMeta}>
                                        Priority Demand: {tech.count} project(s)
                                    </div>
                                </div>
                                <div style={styles.demandPill(tech.priority || "Medium")}>
                                    {tech.priority || "Medium"}
                                </div>
                            </div>
                        ))}
                        {data.demanded_tech.length === 0 && <div style={styles.empty}>No active technology demands setup.</div>}
                    </div>
                </div>
            </div>

            <div style={styles.heatmapCard}>
                <h3 style={styles.cardTitle}>Employee Skill Heatmap</h3>
                <p style={styles.description}>Proficiency mapping across department teams</p>
                <div style={styles.heatmapGrid}>
                    {data.heatmap.map((item, index) => (
                        <div key={index} style={styles.heatmapCell(item.avg_proficiency || 0)}>
                            <div style={styles.cellLabel}>{item.department}</div>
                            <div style={styles.cellVal}>{item.skill_name}</div>
                            <div style={styles.cellScore}>{(item.avg_proficiency || 0).toFixed(1)} Pfc</div>
                        </div>
                    ))}
                    {data.heatmap.length === 0 && <div style={styles.empty}>No employee skill mappings registered yet.</div>}
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
    loading: {
        padding: "60px",
        textAlign: "center",
        color: "#1e293b",
        fontWeight: 600,
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
    statsBar: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
    },
    statCard: {
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 4px 18px rgba(15, 23, 42, 0.05)",
    },
    statLabel: {
        fontSize: "13px",
        color: "#64748b",
        fontWeight: "600",
    },
    statValue: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#0f172a",
        margin: "8px 0",
    },
    statSubtext: {
        fontSize: "12px",
        color: "#94a3b8",
    },
    progressBarBg: {
        background: "#f1f5f9",
        borderRadius: "4px",
        height: "8px",
        width: "100%",
        marginTop: "8px",
        overflow: "hidden",
    },
    progressBarFill: (percent) => ({
        background: "#2563eb",
        height: "100%",
        width: `${percent}%`,
        borderRadius: "4px",
    }),
    mainGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "20px",
        marginBottom: "24px",
    },
    card: {
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    },
    cardTitle: {
        margin: "0 0 12px 0",
        fontSize: "18px",
        fontWeight: "750",
        color: "#0f172a",
    },
    description: {
        margin: "0 0 20px 0",
        fontSize: "13px",
        color: "#64748b",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    skillRow: {
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: "12px",
    },
    skillHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
    },
    skillName: {
        fontWeight: "700",
        color: "#1e293b",
    },
    skillCount: {
        fontSize: "13px",
        color: "#64748b",
    },
    skillBarBg: {
        background: "#f1f5f9",
        borderRadius: "3px",
        height: "6px",
        width: "100%",
        marginBottom: "6px",
    },
    skillBarFill: (score) => ({
        background: "#3b82f6",
        height: "100%",
        width: `${(score / 5) * 100}%`,
        borderRadius: "3px",
    }),
    skillMeta: {
        fontSize: "11px",
        color: "#94a3b8",
    },
    demandRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
    },
    demandDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#f59e0b",
    },
    demandInfo: {
        flex: 1,
    },
    demandName: {
        fontWeight: "700",
        color: "#0f172a",
        fontSize: "14px",
    },
    demandMeta: {
        fontSize: "12px",
        color: "#64748b",
    },
    demandPill: (priority) => ({
        fontSize: "11px",
        fontWeight: "700",
        textTransform: "uppercase",
        padding: "4px 8px",
        borderRadius: "20px",
        background: priority === "High" ? "#fee2e2" : priority === "Medium" ? "#fef3c7" : "#dcfce7",
        color: priority === "High" ? "#991b1b" : priority === "Medium" ? "#92400e" : "#166534",
    }),
    heatmapCard: {
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
    },
    heatmapGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "14px",
        marginTop: "16px",
    },
    heatmapCell: (score) => {
        // Generate background color dynamic on score (from 0 to 5)
        const opacity = score / 5;
        const bg = `rgba(37, 99, 235, ${Math.max(opacity, 0.08)})`;
        const color = score >= 3.5 ? "#fff" : "#1e293b";
        const border = score >= 3.5 ? "none" : "1px solid #e2e8f0";
        return {
            background: bg,
            padding: "16px",
            borderRadius: "12px",
            color: color,
            border: border,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
        };
    },
    cellLabel: {
        fontSize: "12px",
        opacity: 0.8,
        fontWeight: "600",
    },
    cellVal: {
        fontSize: "16px",
        fontWeight: "750",
    },
    cellScore: {
        alignSelf: "flex-end",
        fontSize: "11px",
        fontWeight: "700",
        background: "rgba(0,0,0,0.1)",
        padding: "2px 6px",
        borderRadius: "20px",
    },
    empty: {
        color: "#64748b",
        fontSize: "14px",
        textAlign: "center",
        padding: "20px 0",
    },
};

export default AnalyticsPage;
