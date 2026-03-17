import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function LinksUpload() {
  const navigate = useNavigate();
  const location = useLocation();

  const [github, setGithub] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [linkedinFile, setLinkedinFile] = useState(null);
  const [previousResumeFile, setPreviousResumeFile] = useState(null);
  const [format, setFormat] = useState(location.state?.format || "Professional");
  const [error, setError] = useState("");

  const linkedinInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const validate = () => {
    if (!github.trim() || !github.includes("github.com")) {
      return "Please enter a valid GitHub URL.";
    }
    if (!linkedinFile) {
      return "LinkedIn PDF is required to build your professional profile.";
    }
    if (!jobDesc.trim()) {
      return "Job description is required for ATS optimization.";
    }
    return "";
  };

  const handleBuildResume = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    sessionStorage.setItem("jobDesc", jobDesc);
    navigate("/loading", { 
      state: { github, jobDesc, linkedinFile, previousResumeFile, format } 
    });
  };

  return (
    <div className="page" style={{ paddingTop: '100px' }}>
      <div className="upload-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Build Your ATS Resume
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            Share your professional profiles to craft a tailored masterpiece.
          </p>
        </div>

        <div className="input-group">
          <label>🌐 GitHub Profile</label>
          <input
            type="text"
            placeholder="https://github.com/yourusername"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>📄 LinkedIn Profile (PDF)</label>
            <div 
              onClick={() => linkedinInputRef.current.click()}
              style={{
                border: "2px dashed rgba(0, 210, 255, 0.2)",
                padding: "20px 10px",
                borderRadius: "12px",
                cursor: "pointer",
                background: linkedinFile ? "rgba(34, 197, 94, 0.05)" : "rgba(255,255,255,0.02)",
                textAlign: "center",
                fontSize: "13px",
                color: linkedinFile ? "#4ade80" : "var(--text-muted)",
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.5)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.2)'}
            >
              {linkedinFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{linkedinFile.name}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>📤</span>
                  <span>Upload PDF</span>
                </div>
              )}
            </div>
            <input type="file" accept=".pdf" ref={linkedinInputRef} style={{ display: "none" }} onChange={(e) => setLinkedinFile(e.target.files[0])} />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>📝 Existing Resume (Optional)</label>
            <div 
              onClick={() => resumeInputRef.current.click()}
              style={{
                border: "2px dashed rgba(255,255,255,0.1)",
                padding: "20px 10px",
                borderRadius: "12px",
                cursor: "pointer",
                background: previousResumeFile ? "rgba(59, 130, 246, 0.05)" : "rgba(255,255,255,0.02)",
                textAlign: "center",
                fontSize: "13px",
                color: previousResumeFile ? "#60a5fa" : "var(--text-muted)",
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            >
              {previousResumeFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{previousResumeFile.name}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>📑</span>
                  <span>Upload PDF</span>
                </div>
              )}
            </div>
            <input type="file" accept=".pdf" ref={resumeInputRef} style={{ display: "none" }} onChange={(e) => setPreviousResumeFile(e.target.files[0])} />
          </div>
        </div>

        <div className="input-group">
          <label>🎨 Select Style</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "white",
              outline: 'none'
            }}
          >
            <option value="Professional">Professional (Modern & Balanced)</option>
            <option value="Minimalist">Minimalist (Clean & Elegant)</option>
            <option value="Executive">Executive (Leadership & Results)</option>
            <option value="Academic">Academic (Detailed & Research-based)</option>
            <option value="Creative">Creative (Vibrant & Unique)</option>
          </select>
        </div>

        <div className="input-group">
          <label>🎯 Target Job Description</label>
          <textarea
            placeholder="Paste the job description you're targeting..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            style={{ minHeight: "140px", resize: 'vertical' }}
          />
        </div>

        {error && (
          <div style={{ color: "#ef4444", marginBottom: "20px", fontSize: "14px", display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleBuildResume} style={{ width: "100%", height: '54px', fontSize: '1.1rem', marginTop: "10px" }}>
          Generate Resume 🚀
        </button>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '16px' }}>
          Secure, encrypted, and real-time AI processing.
        </p>
      </div>
    </div>
  );
}

export default LinksUpload;
