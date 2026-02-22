import { useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="home-content">
        <h1>AI Resume Builder</h1>
        <p>Create ATS-Friendly Professional Resumes</p>

        <div className="home-buttons">
          <button className="btn-primary" onClick={() => navigate("/templates")}>
            Create Resume
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