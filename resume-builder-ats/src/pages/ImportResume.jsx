import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function ImportResume() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file.name);
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Upload failed");

      localStorage.setItem("importedResumeText", data.rawText || "");
      localStorage.setItem("resumeBuilt", "true");

      navigate("/success");
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <div className="upload-card" style={{ textAlign: "center" }}>
        <h2>Import Existing Resume</h2>
        <p style={{ color: "#94a3b8", marginBottom: "28px", fontSize: "14px" }}>
          Upload your PDF resume to parse & enhance it with AI
        </p>

        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button
          className="btn-primary"
          onClick={handleSelectFile}
          disabled={uploading}
          style={{ width: "100%" }}
        >
          {uploading ? "Uploading..." : "📂 Select PDF Resume"}
        </button>

        {selectedFile && (
          <p style={{ marginTop: "16px", color: "#94a3b8", fontSize: "13px" }}>
            📄 {selectedFile}
          </p>
        )}

        {uploading && (
          <div>
            <div className="loader" style={{ marginTop: "24px" }}></div>
            <p style={{ color: "#64748b", fontSize: "12px", marginTop: "12px" }}>
              Parsing resume with AI...
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: "#f87171", marginTop: "16px", fontSize: "13px" }}>
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default ImportResume;
