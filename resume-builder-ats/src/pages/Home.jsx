import { useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";
import SvgFrame from "../components/SvgFrame";
import FlashlightBackground from "../components/FlashlightBackground";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      <FlashlightBackground />
      <div className="hero-section">
        <SvgFrame />
        <h1>AI Resume Builder</h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px', color: 'rgba(255,255,255,0.7)', fontWeight: '300' }}>
          Craft professional, ATS-optimized resumes in seconds with our advanced neural engine and real-time profile integration.
        </p>

        <div className="home-buttons">
          <button className="btn-primary" onClick={() => navigate("/templates")}>
            Get Started
          </button>

          <button className="btn-secondary" onClick={() => navigate("/import")}>
            Import Resume
          </button>
        </div>
      </div>

      {/* ✅ Chatbot always available on Home */}
      <Chatbot />
    </div>
  );
}

export default Home;