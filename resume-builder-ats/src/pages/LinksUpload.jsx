import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function LinksUpload() {
  const navigate = useNavigate();

  const [github, setGithub] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [linkedinFile, setLinkedinFile] = useState(null);
  const [previousResumeFile, setPreviousResumeFile] = useState(null);
  const [error, setError] = useState("");

  const linkedinInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const validate = () => {
    if (!github.trim() || !github.includes("github.com")) {
      return "Please enter a valid GitHub URL.";
    }

    if (!linkedinFile) {
      return "Please upload your LinkedIn Profile PDF (Export your LinkedIn profile as PDF).";
    }

    if (!jobDesc.trim()) {
      return "Job description is required.";
    }

    if (jobDesc.trim().length < 20) {
      return "Job description must be at least 20 characters.";
    }

    return "";
  };

  const handleBuildResume = () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    // Clear error
    setError("");

    // Store jobDesc for ATS scoring on Success page
    sessionStorage.setItem("jobDesc", jobDesc);

    // Navigate to loading page with state
    navigate("/loading", { 
      state: { 
        github, 
        jobDesc,
        linkedinFile, 
        previousResumeFile 
      } 
    });
  };

  return (
    <div className="page">
      <div className="upload-card">
        <h2>Build Your ATS Resume</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
          Provide your profiles and job details to get started.
        </p>

        <div className="input-group">
          <label>GitHub Profile *</label>
          <input
            type="text"
            placeholder="https://github.com/yourusername"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>LinkedIn Profile (PDF Export) *</label>
          <div 
            onClick={() => linkedinInputRef.current.click()}
            style={{
              border: "1px dashed rgba(255,255,255,0.2)",
              padding: "12px",
              borderRadius: "10px",
              cursor: "pointer",
              background: "rgba(255,255,255,0.05)",
              textAlign: "center",
              fontSize: "14px",
              color: linkedinFile ? "#22c55e" : "#94a3b8"
            }}
          >
            {linkedinFile ? `📄 ${linkedinFile.name}` : "📂 Click to upload LinkedIn PDF"}
          </div>
          <input
            type="file"
            accept=".pdf"
            ref={linkedinInputRef}
            style={{ display: "none" }}
            onChange={(e) => setLinkedinFile(e.target.files[0])}
          />
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Go to your LinkedIn profile &rarr; More &rarr; Save to PDF
          </p>
        </div>

        <div className="input-group">
          <label>Previous Resume (Optional)</label>
          <div 
            onClick={() => resumeInputRef.current.click()}
            style={{
              border: "1px dashed rgba(255,255,255,0.2)",
              padding: "12px",
              borderRadius: "10px",
              cursor: "pointer",
              background: "rgba(255,255,255,0.05)",
              textAlign: "center",
              fontSize: "14px",
              color: previousResumeFile ? "#22c55e" : "#94a3b8"
            }}
          >
            {previousResumeFile ? `📄 ${previousResumeFile.name}` : "📂 Upload existing resume"}
          </div>
          <input
            type="file"
            accept=".pdf"
            ref={resumeInputRef}
            style={{ display: "none" }}
            onChange={(e) => setPreviousResumeFile(e.target.files[0])}
          />
        </div>

        <div className="input-group" style={{ marginTop: "20px" }}>
          <label>Target Job Description *</label>
          <textarea
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            style={{ minHeight: "120px" }}
          />
        </div>

        {error && (
          <p style={{ color: "#f87171", marginBottom: "15px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <button className="btn-primary" onClick={handleBuildResume} style={{ width: "100%", marginTop: "10px" }}>
          Generate ATS Resume 🚀
        </button>
      </div>
    </div>
  );
}

export default LinksUpload;
