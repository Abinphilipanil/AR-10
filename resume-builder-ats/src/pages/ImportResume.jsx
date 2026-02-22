import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function ImportResume() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelectFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file.name);
      navigate("/loading");
    }
  };

  return (
    <div className="page">
      <div className="upload-card">
        <h2>Import Resume</h2>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button className="btn-primary" onClick={handleSelectFile}>
          Select Resume File
        </button>

        {selectedFile && (
          <p style={{ marginTop: "20px", color: "#cbd5e1" }}>
            Selected: {selectedFile}
          </p>
        )}
      </div>
    </div>
  );
}

export default ImportResume;
