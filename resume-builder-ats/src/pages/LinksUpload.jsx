import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LinksUpload() {
  const navigate = useNavigate();

  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!linkedin.trim() || !linkedin.includes("linkedin.com")) {
      return "Please enter a valid LinkedIn URL.";
    }

    if (!github.trim() || !github.includes("github.com")) {
      return "Please enter a valid GitHub URL.";
    }

    if (!jobDesc.trim()) {
      return "Job description is required.";
    }

    if (jobDesc.trim().length < 20) {
      return "Job description must be at least 20 characters.";
    }

    // Must contain at least one alphabet character
    const hasLetter = /[a-zA-Z]/.test(jobDesc);

    if (!hasLetter) {
      return "Job description must include valid text (not only numbers or symbols).";
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

    // Mark resume as built (for protected routes)
    localStorage.setItem("resumeBuilt", "true");

    // Navigate to loading page
    navigate("/loading");
  };

  return (
    <div className="page">
      <div className="upload-card">
        <h2>Build Resume</h2>

        <div className="input-group">
          <label>LinkedIn Profile *</label>
          <input
            type="text"
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
        </div>

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
          <label>Job Description *</label>
          <textarea
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {error && (
          <p style={{ color: "#f87171", marginBottom: "15px" }}>
            {error}
          </p>
        )}

        <button className="btn-primary" onClick={handleBuildResume}>
          Build Resume
        </button>
      </div>
    </div>
  );
}

export default LinksUpload;
