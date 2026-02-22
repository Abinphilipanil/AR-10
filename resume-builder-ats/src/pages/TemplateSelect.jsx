import { templates } from "../data/templates";
import { useNavigate } from "react-router-dom";

function TemplateSelect() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="card">
        <div className="template-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <img
                src={template.preview}
                alt="Template Preview"
                className="template-image"
              />

              <div className="template-buttons">
                <button
                  className="btn-outline"
                  onClick={() => window.open(template.file)}
                >
                  Preview
                </button>

                <button
                  className="btn-primary"
                  onClick={() => navigate("/upload")}
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TemplateSelect;
