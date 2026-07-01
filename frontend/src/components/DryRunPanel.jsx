import React from 'react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DryRunPanel({ result, loading }) {
  if (loading) return <div className="panel-empty">Running dry-run simulation...</div>;
  if (!result) {
    return (
      <div className="panel-empty">
        <p>No dry-run yet.</p>
        <p className="hint">Click "Dry Run" above to simulate the pipeline without deploying anything.</p>
      </div>
    );
  }

  return (
    <div className="dryrun-panel">
      <div className={`status-badge status-${result.status}`}>
        {result.status === 'success' ? '✅ Success' : '❌ Failed'} — ~{formatTime(result.totalDurationSeconds)} total
      </div>

      {result.warnings.length > 0 && (
        <div className="warnings-box">
          <strong>Warnings ({result.warnings.length})</strong>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="log-viewer">
        {result.log.map((entry, i) => (
          <div key={i} className={`log-line log-${entry.level}`}>
            <span className="log-time">{formatTime(entry.t)}</span>
            <span className="log-message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
