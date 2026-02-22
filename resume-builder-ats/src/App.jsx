import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home";
import TemplateSelect from "./pages/TemplateSelect";
import LinksUpload from "./pages/LinksUpload";
import ImportResume from "./pages/ImportResume";
import Loading from "./pages/Loading";
import Success from "./pages/Success";
import ATSCheck from "./pages/ATSCheck";
import ATSResult from "./pages/ATSResult";
import Chatbot from "./pages/Chatbot";
import ProtectedRoute from "./pages/ProtectedRoute";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav?.type === "reload") navigate("/");
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/templates" element={<TemplateSelect />} />
      <Route path="/upload" element={<LinksUpload />} />
      <Route path="/import" element={<ImportResume />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/success" element={<Success />} />

      <Route
        path="/ats-check"
        element={
          <ProtectedRoute>
            <ATSCheck />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ats-result"
        element={
          <ProtectedRoute>
            <ATSResult />
          </ProtectedRoute>
        }
      />

      {/* Optional */}
      <Route path="/chatbot" element={<Chatbot />} />
    </Routes>
  );
}

export default App;