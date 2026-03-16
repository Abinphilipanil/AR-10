import { templates } from "../data/templates";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function TemplateSelect() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.file.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page" style={{ paddingTop: '100px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Choose Your Template</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '30px' }}>Every template is rigorously tested for ATS compatibility.</p>
        
        <div className="search-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <input 
            type="text" 
            placeholder="Search templates (e.g. Minimalist, Creative...)" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '30px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              transition: '0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
          />
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="template-grid">
          {filteredTemplates.length > 0 ? filteredTemplates.map((template) => (
            <div key={template.id} className="template-card" style={{ padding: '24px' }}>
              <div style={{ overflow: 'hidden', borderRadius: '12px', marginBottom: '20px', height: '400px', background: 'rgba(0,0,0,0.2)' }}>
                <img
                  src={template.preview}
                  alt="Template Preview"
                  className="template-image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#fff' }}>{template.name || "Professional Template"}</h3>

              <div className="template-buttons">
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => window.open(template.file)}
                >
                  Preview
                </button>

                <button
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '12px' }}
                  onClick={() => {
                    let format = "Professional";
                    const tName = template.file.toLowerCase();
                    if (tName.includes("minimalist") || tName.includes("simple") || tName.includes("compact")) format = "Minimalist";
                    else if (tName.includes("creative") || tName.includes("colorful")) format = "Creative";
                    else if (tName.includes("elegant") || tName.includes("modern")) format = "Executive";
                    else format = "Professional";

                    navigate("/upload", { state: { format } });
                  }}
                >
                  Select & Continue
                </button>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', width: '100%', padding: '40px', color: 'var(--text-muted)' }}>
              No templates found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateSelect;
