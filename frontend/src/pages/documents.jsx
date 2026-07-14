import { useEffect, useState } from "react";
import { getDocuments, uploadDocument } from "../services/api";

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [ocrResults, setOcrResults] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const loadDocuments = () => {
    getDocuments()
      .then((res) => setDocuments(res.data || []))
      .catch((err) => console.error("Failed to load documents", err));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const formatSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const buildSummary = (payload) => {
    const extracted = payload?.extracted || {};
    return [
      `Status: ${payload?.message || "processed"}`,
      `Name: ${extracted.name || "N/A"}`,
      `Email: ${extracted.email || "N/A"}`,
      `Phone: ${extracted.phone_number || "N/A"}`,
      `Skills: ${Array.isArray(extracted.skills) ? extracted.skills.join(", ") : "N/A"}`,
      `Degree: ${extracted.degree || "N/A"}`,
    ].join("\n");
  };

  const addFiles = async (incomingFiles) => {
    const selected = Array.from(incomingFiles || []).filter((file) => file && file.size > 0);
    if (!selected.length) return;

    setIsUploading(true);

    const entries = selected.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
    }));

    setFiles((prev) => [...prev, ...entries]);

    for (const entry of entries) {
      const formData = new FormData();
      formData.append("file", entry.file);

      try {
        const res = await uploadDocument(formData);
        setOcrResults((prev) => ({
          ...prev,
          [entry.id]: buildSummary(res.data),
        }));
        loadDocuments();
      } catch (err) {
        setOcrResults((prev) => ({
          ...prev,
          [entry.id]: `Upload failed: ${err.response?.data?.error || err.message}`,
        }));
      }
    }

    setIsUploading(false);
  };

  const handleInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setOcrResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Upload Documents & OCR Results</h2>

      <div style={{ border: "2px dashed #cbd5e1", borderRadius: 18, padding: 28, background: "#fff", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
        <h3 style={{ margin: "0 0 6px" }}>Drag & drop files here</h3>
        <p style={{ color: "#64748b" }}>Supports PDF, JPG, JPEG, and PNG files.</p>

        <label style={{ display: "inline-block", background: "#2563eb", color: "#fff", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
          Choose Files
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleInputChange} style={{ display: "none" }} />
        </label>

        {isUploading && <div style={{ marginTop: 10, color: "#2563eb", fontWeight: 600 }}>Uploading and processing...</div>}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Saved Documents from Database</h3>
        {documents.length === 0 ? (
          <div style={{ color: "#64748b" }}>No documents found in the database yet.</div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{doc.file_path.split(/[\\/]/).pop()}</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                Type: {doc.document_type} • Uploaded: {doc.upload_date || "N/A"}
              </div>
            </div>
          ))
        )}
      </div>

      {files.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Uploaded Files</h3>
          {files.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{item.file.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{formatSize(item.file.size)}</div>
              </div>
              <button style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }} onClick={() => removeFile(item.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 16, padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>OCR Results</h3>
        {Object.keys(ocrResults).length === 0 ? (
          <div style={{ color: "#64748b" }}>Upload a document to see OCR output here.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {files.map((item) => (
              <div key={item.id} style={{ background: "#f8fafc", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.file.name}</div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "Consolas, monospace", fontSize: 13, color: "#334155" }}>{ocrResults[item.id] || "Processing..."}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;