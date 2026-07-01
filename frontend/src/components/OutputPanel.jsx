import React, { useState } from 'react';

const PLATFORMS = [
  { key: 'githubActions', label: 'GitHub Actions', filename: '.github/workflows/pipeline.yml' },
  { key: 'gitlabci', label: 'GitLab CI', filename: '.gitlab-ci.yml' },
  { key: 'jenkinsfile', label: 'Jenkins', filename: 'Jenkinsfile' },
];

export default function OutputPanel({ generated, loading }) {
  const [platform, setPlatform] = useState('githubActions');

  if (loading) return <div className="panel-empty">Generating...</div>;
  if (!generated) {
    return (
      <div className="panel-empty">
        <p>No output yet.</p>
        <p className="hint">Click "Generate YAML" above to convert your pipeline into platform-specific configs.</p>
      </div>
    );
  }

  const active = PLATFORMS.find((p) => p.key === platform);
  const content = generated[platform] || '';

  const copy = () => navigator.clipboard.writeText(content);
  const download = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = active.filename.split('/').pop();
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="output-panel">
      <div className="platform-tabs">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            className={`platform-tab ${platform === p.key ? 'platform-tab-active' : ''}`}
            onClick={() => setPlatform(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="output-toolbar">
        <span className="output-filename">{active.filename}</span>
        <div>
          <button className="btn-small" onClick={copy}>Copy</button>
          <button className="btn-small" onClick={download}>Download</button>
        </div>
      </div>
      <pre className="code-block">{content}</pre>
    </div>
  );
}
