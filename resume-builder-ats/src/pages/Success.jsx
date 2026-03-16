import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function Success() {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [atsData, setAtsData] = useState(null);

  useEffect(() => {
    let savedResume = localStorage.getItem("generatedResume") || localStorage.getItem("importedResumeText");
    const savedAts = localStorage.getItem("atsAnalysis");
    
    if (savedResume) {
      // 🧼 Sanitize: Remove LLM-hallucinated tags that clutter the output
      const cleanResume = savedResume
        .replace(/<center>\s*/gi, "")
        .replace(/\s*<\/center>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<div>/gi, "")
        .replace(/<\/div>/gi, "")
        .trim();
      setResume(cleanResume);
    }

    if (savedAts) {
      try {
        setAtsData(JSON.parse(savedAts));
      } catch (e) {
        console.error("Failed to parse ATS data");
      }
    }
  }, []);

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = "Resume";
    window.print();
    document.title = originalTitle;
  };
  const handleDownloadMD = () => {
    const blob = new Blob([resume], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!resume) {
    return (
      <div className="page">
        <div className="upload-card" style={{ textAlign: 'center' }}>
          <h2>No Resume Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Please generate or import a resume first.
          </p>
          <button className="btn-primary" onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  const atsScore = atsData?.score || 0;
  const scoreColor = atsScore >= 80 ? "#22c55e" : atsScore >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="page" style={{ alignItems: "flex-start", paddingTop: "100px" }}>
      <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* ── Dashboard Header (hidden in print) ── */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Resume Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>AI-Powered ATS Analysis and Final Preview</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-secondary" onClick={handleDownloadMD} style={{ padding: '10px 20px' }}>
              MD
            </button>
            <button className="btn-primary" onClick={handleDownloadPDF} style={{ background: "var(--primary)", boxShadow: '0 4px 15px rgba(0, 210, 255, 0.2)' }}>
              Download PDF
            </button>
          </div>
        </div>

        {/* ── ATS Score + Insights (hidden in print) ── */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '40px' }}>
          {/* Score Card */}
          <div style={{ background: "var(--bg-card)", backdropFilter: 'blur(20px)', padding: "40px", borderRadius: "24px", border: "1px solid var(--glass-border)", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 20px' }}>
               <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${atsScore}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
               </svg>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <span style={{ fontSize: '40px', fontWeight: '800', color: scoreColor }}>{atsScore}%</span>
               </div>
            </div>
            <h3 style={{ fontSize: '14px', letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>ATS Match Score</h3>
            <div style={{ padding: "6px 16px", borderRadius: "30px", background: `${scoreColor}20`, color: scoreColor, fontSize: "12px", fontWeight: "700", alignSelf: 'center', border: `1px solid ${scoreColor}40` }}>
                {atsData?.matchLevel || "ANALYZING"}
            </div>
          </div>

          {/* Insights Card */}
          <div style={{ background: "var(--bg-card)", backdropFilter: 'blur(20px)', padding: "40px", borderRadius: "24px", border: "1px solid var(--glass-border)" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "24px", fontWeight: '600' }}>AI Optimization Insights</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                <div>
                    <h4 style={{ fontSize: "11px", color: "#22c55e", marginBottom: "12px", textTransform: "uppercase", letterSpacing: '1px' }}>Core Strengths</h4>
                    <ul style={{ fontSize: "14px", color: "#cbd5e1", paddingLeft: "0", listStyle: 'none' }}>
                        {(atsData?.strengths || ["Semantic alignment detected", "Strong keyword density"]).map((s, i) => (
                          <li key={i} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#22c55e' }}>✓</span> {s}
                          </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 style={{ fontSize: "11px", color: "#f87171", marginBottom: "12px", textTransform: "uppercase", letterSpacing: '1px' }}>Critical Gaps</h4>
                    <ul style={{ fontSize: "14px", color: "#cbd5e1", paddingLeft: "0", listStyle: 'none' }}>
                         {(atsData?.missingKeywords || ["No major gaps found", "Ready for submission"]).slice(0, 3).map((k, i) => (
                           <li key={i} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#f87171' }}>!</span> {k}
                           </li>
                         ))}
                    </ul>
                </div>
            </div>

            <div style={{ marginTop: '30px', padding: '16px', borderRadius: '12px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Want more personalized advice?</span>
              <button className="btn-link" onClick={() => navigate("/chatbot")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
                Talk to Career Coach →
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs (hidden in print) ── */}
        <div className="no-print" style={{ display: "flex", justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
          <div className="tabs" style={{ display: "flex", gap: "8px" }}>
            <button className={`btn-secondary ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab("preview")} style={{ padding: "10px 24px", fontSize: "14px", background: activeTab === 'preview' ? 'var(--primary)' : 'var(--glass-bg)', color: activeTab === 'preview' ? '#020617' : 'white', borderColor: activeTab === 'preview' ? 'var(--primary)' : 'var(--glass-border)' }}>
              Live Preview
            </button>
            <button className={`btn-secondary ${activeTab === 'markdown' ? 'active' : ''}`} onClick={() => setActiveTab("markdown")} style={{ padding: "10px 24px", fontSize: "14px", background: activeTab === 'markdown' ? 'var(--primary)' : 'var(--glass-bg)', color: activeTab === 'markdown' ? '#020617' : 'white', borderColor: activeTab === 'markdown' ? 'var(--primary)' : 'var(--glass-border)' }}>
              Source (Markdown)
            </button>
          </div>
        </div>

        <div className="resume-container" style={{ background: "white", padding: "80px", borderRadius: "16px", color: "#1e293b", minHeight: "1000px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5)", overflow: 'hidden' }}>
          {activeTab === "preview" ? (
            <div className="resume-md-content">
              <ReactMarkdown>{resume}</ReactMarkdown>
            </div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", color: "#64748b", fontStyle: "italic", fontSize: '14px' }}>{resume}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default Success;
