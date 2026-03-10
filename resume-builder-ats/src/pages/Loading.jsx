import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Loading() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Preparing uploads...");
  const [errorMsg, setErrorMsg] = useState("");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const processFlow = async () => {
      try {
        const { github, jobDesc, linkedinFile, previousResumeFile } = location.state || {};

        if (!github || !jobDesc) {
          setErrorMsg("Missing inputs. Please go back and fill in required fields.");
          return;
        }

        let parsedLinkedinData = null;
        let parsedPreviousResumeText = "";

        // 1. Upload & Parse LinkedIn PDF
        if (linkedinFile) {
          setStatus("Parsing LinkedIn Profile PDF...");
          const linkedInFormData = new FormData();
          linkedInFormData.append("file", linkedinFile);

          const linkedinRes = await fetch("/api/linkedin-pdf/parse-pdf", {
            method: "POST",
            body: linkedInFormData,
          });

          const linkedinJson = await linkedinRes.json();
          if (!linkedinRes.ok) throw new Error(linkedinJson?.error || "LinkedIn parsing failed");
          parsedLinkedinData = linkedinJson.data;
          console.log("LinkedIn data parsed:", parsedLinkedinData);
        }

        // 2. Upload & Parse Optional Previous Resume
        if (previousResumeFile) {
          setStatus("Extracting details from your existing resume...");
          const resumeFormData = new FormData();
          resumeFormData.append("resume", previousResumeFile);

          const resumeRes = await fetch("/api/resume/upload", {
            method: "POST",
            body: resumeFormData,
          });

          const resumeJson = await resumeRes.json();
          if (!resumeRes.ok) throw new Error(resumeJson?.error || "Resume parsing failed");
          parsedPreviousResumeText = resumeJson.rawText;
          console.log("Previous resume extracted.");
        }

        // 3. Final Build step
        setStatus("AI is crafting your tailored ATS resume...");
        const buildResponse = await fetch("/api/builder/build-from-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            github, 
            jobDesc, 
            linkedinPdfData: parsedLinkedinData,
            previousResumeText: parsedPreviousResumeText
          }),
        });

        const buildData = await buildResponse.json();

        if (!buildResponse.ok) {
          throw new Error(buildData?.error || `Server error ${buildResponse.status}`);
        }

        if (isMounted.current) {
          setStatus("Success! Saving results...");

          // Store metadata in localStorage
          localStorage.setItem("resumeBuilt", "true");
          localStorage.setItem("generatedResume", buildData.resume);
          localStorage.setItem("atsAnalysis", JSON.stringify(buildData.atsAnalysis || null));
          localStorage.setItem("linkedinFetched", String(buildData.linkedinFetched || !!parsedLinkedinData));
          localStorage.setItem("githubFetched", String(buildData.githubFetched));
          localStorage.setItem("resumeDbId", buildData.dbId || "");

          navigate("/success");
        }
      } catch (err) {
        console.error("Pipeline failed:", err);
        if (isMounted.current) {
          setErrorMsg(err?.message || "Something went wrong. Please try again.");
        }
      }
    };

    processFlow();

    return () => {
      isMounted.current = false;
    };
  }, [navigate, location.state]);

  if (errorMsg) {
    return (
      <div className="page">
        <div className="upload-card" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#f87171", marginBottom: "16px" }}>⚠️ Error</h2>
          <p style={{ color: "#cbd5e1", marginBottom: "24px" }}>{errorMsg}</p>
          <button className="btn-primary" onClick={() => navigate("/upload")}>
            Go Back & Fix
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="upload-card" style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: "12px" }}>Generating Your Profile...</h2>
        <p style={{ color: "#94a3b8", marginBottom: "28px", fontSize: "14px", minHeight: "20px" }}>
          {status}
        </p>
        <div className="loader"></div>
        <p style={{ color: "#64748b", fontSize: "12px", marginTop: "24px" }}>
          Step-by-step: PDF analysis, GitHub sync, and Gemini Resume Crafting.
        </p>
      </div>
    </div>
  );
}

export default Loading;
