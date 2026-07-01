import React from 'react';

const FIELD_DEFS = {
  checkout: [],
  run: [{ key: 'command', label: 'Shell command', type: 'textarea', placeholder: 'npm run build' }],
  cache: [
    { key: 'path', label: 'Path to cache', type: 'text', placeholder: 'node_modules' },
    { key: 'key', label: 'Cache key', type: 'text', placeholder: 'npm-cache-key' },
  ],
  'artifact-upload': [
    { key: 'artifactName', label: 'Artifact name', type: 'text', placeholder: 'build-output' },
    { key: 'path', label: 'Path', type: 'text', placeholder: 'dist' },
  ],
  'artifact-download': [
    { key: 'artifactName', label: 'Artifact name', type: 'text', placeholder: 'build-output' },
    { key: 'path', label: 'Path', type: 'text', placeholder: 'dist' },
  ],
  'docker-build': [{ key: 'image', label: 'Image tag', type: 'text', placeholder: 'myapp:latest' }],
  deploy: [{ key: 'command', label: 'Deploy command', type: 'textarea', placeholder: './scripts/deploy.sh production' }],
};

export default function ConfigPanel({ step, onChange }) {
  const fields = FIELD_DEFS[step.type] || [];

  return (
    <div className="config-panel">
      <h3>Step Configuration</h3>
      <label className="field-label">
        Step name
        <input value={step.name || ''} onChange={(e) => onChange({ name: e.target.value })} />
      </label>

      {fields.length === 0 && <p className="hint">This step type has no additional configuration.</p>}

      {fields.map((f) => (
        <label key={f.key} className="field-label">
          {f.label}
          {f.type === 'textarea' ? (
            <textarea
              rows={3}
              placeholder={f.placeholder}
              value={step[f.key] || ''}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
            />
          ) : (
            <input
              placeholder={f.placeholder}
              value={step[f.key] || ''}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}
