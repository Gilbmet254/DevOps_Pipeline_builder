import React from 'react';

const LABELS = { github: 'GitHub Actions', gitlab: 'GitLab CI', jenkins: 'Jenkins (self-hosted est.)' };

export default function CostPanel({ result, loading }) {
  if (loading) return <div className="panel-empty">Estimating cost...</div>;
  if (!result) {
    return (
      <div className="panel-empty">
        <p>No cost estimate yet.</p>
        <p className="hint">Click "Estimate Cost" above to see a projected monthly cost (assuming 30 runs/month).</p>
      </div>
    );
  }

  return (
    <div className="cost-panel">
      <p className="hint">Estimates are directional approximations based on public pricing, not exact bills.</p>
      {Object.entries(result).map(([platform, data]) => (
        <div key={platform} className="cost-card">
          <div className="cost-card-header">
            <strong>{LABELS[platform] || platform}</strong>
            <span className="cost-total">${data.costPerMonth.toFixed(2)}/mo</span>
          </div>
          <div className="cost-meta">
            {data.totalMinutesPerRun} min/run · ${data.costPerRun.toFixed(4)}/run · {data.runsPerMonth} runs/mo
          </div>
          <table className="cost-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Job</th>
                <th>Est. minutes</th>
                <th>Cost/run</th>
              </tr>
            </thead>
            <tbody>
              {data.jobBreakdown.map((j, i) => (
                <tr key={i}>
                  <td>{j.stage}</td>
                  <td>{j.job}</td>
                  <td>{j.estimatedMinutesPerRun}</td>
                  <td>${j.costPerRun.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
