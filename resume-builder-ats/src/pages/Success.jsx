import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function Success() {
  const navigate = useNavigate();

  const [resume, setResume] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [atsData, setAtsData] = useState(null);

  useEffect(() => {
    const savedResume = localStorage.getItem("generatedResume") || localStorage.getItem("importedResumeText");
    const savedAts = localStorage.getItem("atsAnalysis");
    
    if (savedResume) setResume(savedResume);
    if (savedAts) {
      try {
        setAtsData(JSON.parse(savedAts));
      } catch (e) {
        console.error("Failed to parse ATS data from storage");
      }
    }
  }, []);

  if (!resume) {
    return (
      <div className="page">
        <div className="upload-card">
          <h2>No Resume Found</h2>
          <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
            Please go back and generate or import a resume first.
          </p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const atsScore = atsData?.score || 0;
  const scoreColor = atsScore >= 80 ? "#22c55e" : atsScore >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="page" style={{ alignItems: "flex-start", paddingTop: "40px" }}>
      <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700 }}>Analysis Dashboard</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary" onClick={() => navigate("/")}>
              🏠 Back Home
            </button>
          </div>
        </div>

        {/* AI ATS Analysis Summary */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "16px", marginBottom: "30px", display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", minWidth: "120px" }}>
            <div style={{ fontSize: "52px", fontWeight: 800, color: scoreColor }}>{atsScore}%</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>ATS SCORE</div>
            <div style={{ marginTop: "10px", padding: "4px 12px", borderRadius: "20px", background: scoreColor, color: "#fff", fontSize: "11px", fontWeight: 700 }}>
                {atsData?.matchLevel || "ANALYZING"}
            </div>
          </div>
          
          <div style={{ flex: 2, minWidth: "300px" }}>
            <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>AI Optimization Insights</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <h4 style={{ fontSize: "12px", color: "#22c55e", marginBottom: "8px", textTransform: "uppercase" }}>Core Strengths</h4>
                    <ul style={{ fontSize: "13px", color: "#cbd5e1", paddingLeft: "15px" }}>
                        {(atsData?.strengths || ["Semantic alignment detected"]).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 style={{ fontSize: "12px", color: "#f87171", marginBottom: "8px", textTransform: "uppercase" }}>Targeted Gaps</h4>
                    <ul style={{ fontSize: "13px", color: "#cbd5e1", paddingLeft: "15px" }}>
                         {(atsData?.missingKeywords || ["No major gaps found"]).slice(0, 3).map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                </div>
            </div>

            <button 
              className="btn-link" 
              onClick={() => navigate("/chatbot")}
              style={{ background: "none", border: "none", color: "#6366f1", padding: 0, marginTop: "20px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
            >
              🚀 Use Career Coach to resolve these gaps →
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "15px" }}>
          <button 
            className={activeTab === "preview" ? "btn-primary" : "btn-secondary"} 
            onClick={() => setActiveTab("preview")}
            style={{ padding: "8px 20px", fontSize: "14px" }}
          >
            📄 Preview
          </button>
          <button 
            className={activeTab === "markdown" ? "btn-primary" : "btn-secondary"} 
            onClick={() => setActiveTab("markdown")}
            style={{ padding: "8px 20px", fontSize: "14px" }}
          >
             Raw Markdown
          </button>
        </div>

        <div style={{ background: "white", padding: "60px", borderRadius: "12px", color: "#1a202c", minHeight: "800px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
          {activeTab === "preview" ? (
            <div className="resume-md-content">
              <ReactMarkdown>{resume}</ReactMarkdown>
            </div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", color: "#334155", fontStyle: "italic" }}>{resume}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default Success;
