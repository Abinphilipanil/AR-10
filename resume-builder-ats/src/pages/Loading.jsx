import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("resumeBuilt", "true"); 
      navigate("/success");
    }, 2500); 

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page">
      <div className="upload-card">
        <h2>Generating Your Resume...</h2>
        <div className="loader"></div>
      </div>
    </div>
  );
}

export default Loading;
