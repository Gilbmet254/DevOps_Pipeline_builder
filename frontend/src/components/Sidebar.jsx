import React from 'react';

export const STEP_TYPES = [
  { type: 'checkout', label: 'Checkout Code', icon: '📥' },
  { type: 'run', label: 'Run Command', icon: '▶️' },
  { type: 'cache', label: 'Cache', icon: '🗃️' },
  { type: 'artifact-upload', label: 'Upload Artifact', icon: '⬆️' },
  { type: 'artifact-download', label: 'Download Artifact', icon: '⬇️' },
  { type: 'docker-build', label: 'Docker Build', icon: '🐳' },
  { type: 'deploy', label: 'Deploy', icon: '🚀' },
];

const ALL_TRIGGERS = [
  { id: 'push', label: 'Push' },
  { id: 'pull_request', label: 'Pull Request' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'manual', label: 'Manual' },
];

export default function Sidebar({ pipeline, updatePipeline }) {
  const toggleTrigger = (id) => {
    updatePipeline((p) => {
      const has = p.triggers.includes(id);
      return { ...p, triggers: has ? p.triggers.filter((t) => t !== id) : [...p.triggers, id] };
    });
  };

  const addVariable = () => {
    updatePipeline((p) => ({ ...p, variables: { ...p.variables, [`VAR_${Object.keys(p.variables).length + 1}`]: 'value' } }));
  };

  const updateVariableKey = (oldKey, newKey) => {
    updatePipeline((p) => {
      const entries = Object.entries(p.variables).map(([k, v]) => (k === oldKey ? [newKey, v] : [k, v]));
      return { ...p, variables: Object.fromEntries(entries) };
    });
  };

  const updateVariableValue = (key, value) => {
    updatePipeline((p) => ({ ...p, variables: { ...p.variables, [key]: value } }));
  };

  const removeVariable = (key) => {
    updatePipeline((p) => {
      const next = { ...p.variables };
      delete next[key];
      return { ...p, variables: next };
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Pipeline Steps</h3>
        <p className="hint">Drag a step into a job below</p>
        <div className="step-palette">
          {STEP_TYPES.map((s) => (
            <div
              key={s.type}
              className="palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/step-type', s.type)}
            >
              <span className="palette-icon">{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Triggers</h3>
        <div className="trigger-list">
          {ALL_TRIGGERS.map((t) => (
            <label key={t.id} className="checkbox-row">
              <input
                type="checkbox"
                checked={pipeline.triggers.includes(t.id)}
                onChange={() => toggleTrigger(t.id)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h3>Variables</h3>
          <button className="btn-small" onClick={addVariable}>+ Add</button>
        </div>
        {Object.entries(pipeline.variables).map(([k, v]) => (
          <div key={k} className="variable-row">
            <input value={k} onChange={(e) => updateVariableKey(k, e.target.value)} className="var-key" />
            <input value={v} onChange={(e) => updateVariableValue(k, e.target.value)} className="var-value" />
            <button className="btn-icon" onClick={() => removeVariable(k)}>✕</button>
          </div>
        ))}
        {Object.keys(pipeline.variables).length === 0 && <p className="hint">No variables set</p>}
      </div>
    </aside>
  );
}
