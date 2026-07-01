import React from 'react';
import { STEP_TYPES } from './Sidebar.jsx';

function iconFor(type) {
  return STEP_TYPES.find((s) => s.type === type)?.icon || '⚙️';
}

export default function Canvas({
  pipeline,
  selection,
  setSelection,
  addStage,
  addJob,
  dropStep,
  updateJob,
  updateStage,
  deleteStep,
  deleteJob,
  deleteStage,
  moveStep,
}) {
  return (
    <main className="canvas">
      <div className="canvas-stages">
        {pipeline.stages.map((stage, stageIdx) => (
          <div key={stage.id} className="stage-column">
            <div className="stage-header">
              <span className="stage-index">{stageIdx + 1}</span>
              <input
                className="stage-name-input"
                value={stage.name}
                onChange={(e) => updateStage(stage.id, { name: e.target.value })}
              />
              <button className="btn-icon" title="Delete stage" onClick={() => deleteStage(stage.id)}>
                🗑
              </button>
            </div>

            <div className="jobs-list">
              {stage.jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <input
                      className="job-name-input"
                      value={job.name}
                      onChange={(e) => updateJob(stage.id, job.id, { name: e.target.value })}
                    />
                    <select
                      className="job-runner-select"
                      value={job.runsOn}
                      onChange={(e) => updateJob(stage.id, job.id, { runsOn: e.target.value })}
                    >
                      <option value="ubuntu-latest">ubuntu-latest</option>
                      <option value="ubuntu-latest-4-cores">ubuntu-latest-4-cores</option>
                      <option value="windows-latest">windows-latest</option>
                      <option value="macos-latest">macos-latest</option>
                    </select>
                    <button className="btn-icon" title="Delete job" onClick={() => deleteJob(stage.id, job.id)}>
                      🗑
                    </button>
                  </div>

                  <div
                    className="step-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const stepType = e.dataTransfer.getData('text/step-type');
                      if (stepType) dropStep(stage.id, job.id, stepType);
                    }}
                  >
                    {job.steps.length === 0 && <div className="dropzone-empty">Drop steps here</div>}
                    {job.steps.map((step, stepIdx) => {
                      const isSelected =
                        selection &&
                        selection.stageId === stage.id &&
                        selection.jobId === job.id &&
                        selection.stepId === step.id;
                      return (
                        <div
                          key={step.id}
                          className={`step-node ${isSelected ? 'step-node-selected' : ''}`}
                          onClick={() => setSelection({ stageId: stage.id, jobId: job.id, stepId: step.id })}
                        >
                          <span className="step-icon">{iconFor(step.type)}</span>
                          <span className="step-label">{step.name || step.type}</span>
                          <div className="step-controls">
                            <button
                              className="btn-icon-tiny"
                              title="Move up"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(stage.id, job.id, step.id, -1);
                              }}
                              disabled={stepIdx === 0}
                            >
                              ↑
                            </button>
                            <button
                              className="btn-icon-tiny"
                              title="Move down"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(stage.id, job.id, step.id, 1);
                              }}
                              disabled={stepIdx === job.steps.length - 1}
                            >
                              ↓
                            </button>
                            <button
                              className="btn-icon-tiny"
                              title="Delete step"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep(stage.id, job.id, step.id);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button className="btn-add-job" onClick={() => addJob(stage.id)}>
                + Add Job
              </button>
            </div>
          </div>
        ))}

        <button className="btn-add-stage" onClick={addStage}>
          + Add Stage
        </button>
      </div>
    </main>
  );
}
