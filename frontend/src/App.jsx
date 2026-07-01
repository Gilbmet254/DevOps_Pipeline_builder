import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Canvas from './components/Canvas.jsx';
import ConfigPanel from './components/ConfigPanel.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import DryRunPanel from './components/DryRunPanel.jsx';
import CostPanel from './components/CostPanel.jsx';
import TemplateLibrary from './components/TemplateLibrary.jsx';
import { api } from './api.js';

let idCounter = 0;
export function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

const EMPTY_PIPELINE = {
  name: 'My Pipeline',
  triggers: ['push'],
  variables: {},
  stages: [
    {
      id: nextId('stage'),
      name: 'Build',
      jobs: [
        {
          id: nextId('job'),
          name: 'build',
          runsOn: 'ubuntu-latest',
          needs: [],
          steps: [{ id: nextId('step'), type: 'checkout', name: 'Checkout code' }],
        },
      ],
    },
  ],
};

const TABS = ['Output', 'Dry Run', 'Cost', 'Templates'];

export default function App() {
  const [pipeline, setPipeline] = useState(EMPTY_PIPELINE);
  const [selection, setSelection] = useState(null); // { stageId, jobId, stepId }
  const [activeTab, setActiveTab] = useState('Output');

  const [generated, setGenerated] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [costResult, setCostResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updatePipeline = useCallback((updater) => {
    setPipeline((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  const addStage = () => {
    updatePipeline((p) => ({
      ...p,
      stages: [...p.stages, { id: nextId('stage'), name: `Stage ${p.stages.length + 1}`, jobs: [] }],
    }));
  };

  const addJob = (stageId) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              jobs: [
                ...s.jobs,
                { id: nextId('job'), name: `job-${s.jobs.length + 1}`, runsOn: 'ubuntu-latest', needs: [], steps: [] },
              ],
            }
          : s
      ),
    }));
  };

  const dropStep = (stageId, jobId, stepType) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) =>
        s.id !== stageId
          ? s
          : {
              ...s,
              jobs: s.jobs.map((j) =>
                j.id !== jobId
                  ? j
                  : { ...j, steps: [...j.steps, { id: nextId('step'), type: stepType, name: defaultName(stepType) }] }
              ),
            }
      ),
    }));
  };

  const updateStep = (stageId, jobId, stepId, patch) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) =>
        s.id !== stageId
          ? s
          : {
              ...s,
              jobs: s.jobs.map((j) =>
                j.id !== jobId
                  ? j
                  : { ...j, steps: j.steps.map((st) => (st.id === stepId ? { ...st, ...patch } : st)) }
              ),
            }
      ),
    }));
  };

  const updateJob = (stageId, jobId, patch) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) =>
        s.id !== stageId ? s : { ...s, jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) }
      ),
    }));
  };

  const updateStage = (stageId, patch) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)),
    }));
  };

  const deleteStep = (stageId, jobId, stepId) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) =>
        s.id !== stageId
          ? s
          : { ...s, jobs: s.jobs.map((j) => (j.id !== jobId ? j : { ...j, steps: j.steps.filter((st) => st.id !== stepId) })) }
      ),
    }));
    setSelection(null);
  };

  const deleteJob = (stageId, jobId) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) => (s.id !== stageId ? s : { ...s, jobs: s.jobs.filter((j) => j.id !== jobId) })),
    }));
  };

  const deleteStage = (stageId) => {
    updatePipeline((p) => ({ ...p, stages: p.stages.filter((s) => s.id !== stageId) }));
  };

  const moveStep = (stageId, jobId, stepId, direction) => {
    updatePipeline((p) => ({
      ...p,
      stages: p.stages.map((s) => {
        if (s.id !== stageId) return s;
        return {
          ...s,
          jobs: s.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const idx = j.steps.findIndex((st) => st.id === stepId);
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= j.steps.length) return j;
            const steps = [...j.steps];
            [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
            return { ...j, steps };
          }),
        };
      }),
    }));
  };

  const loadTemplate = (templatePipeline) => {
    setPipeline(templatePipeline);
    setSelection(null);
    setGenerated(null);
    setSimResult(null);
    setCostResult(null);
  };

  const runAction = async (action) => {
    setLoading(true);
    setError(null);
    try {
      if (action === 'generate') {
        const result = await api.generate(pipeline);
        setGenerated(result);
        setActiveTab('Output');
      } else if (action === 'simulate') {
        const result = await api.simulate(pipeline);
        setSimResult(result);
        setActiveTab('Dry Run');
      } else if (action === 'cost') {
        const result = await api.estimateCost(pipeline, 30);
        setCostResult(result);
        setActiveTab('Cost');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedStep = findStep(pipeline, selection);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <span className="logo">⛓️</span>
          <input
            className="pipeline-name-input"
            value={pipeline.name}
            onChange={(e) => updatePipeline((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="app-header-actions">
          <button className="btn" disabled={loading} onClick={() => runAction('simulate')}>
            ▶ Dry Run
          </button>
          <button className="btn" disabled={loading} onClick={() => runAction('cost')}>
            💲 Estimate Cost
          </button>
          <button className="btn btn-primary" disabled={loading} onClick={() => runAction('generate')}>
            ⚙ Generate YAML
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="app-body">
        <Sidebar pipeline={pipeline} updatePipeline={updatePipeline} />

        <Canvas
          pipeline={pipeline}
          selection={selection}
          setSelection={setSelection}
          addStage={addStage}
          addJob={addJob}
          dropStep={dropStep}
          updateJob={updateJob}
          updateStage={updateStage}
          deleteStep={deleteStep}
          deleteJob={deleteJob}
          deleteStage={deleteStage}
          moveStep={moveStep}
        />

        <div className="right-panel">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {selectedStep && activeTab !== 'Templates' && (
              <ConfigPanel
                step={selectedStep}
                onChange={(patch) => updateStep(selection.stageId, selection.jobId, selection.stepId, patch)}
              />
            )}

            {activeTab === 'Output' && !selectedStep && <OutputPanel generated={generated} loading={loading} />}
            {activeTab === 'Dry Run' && !selectedStep && <DryRunPanel result={simResult} loading={loading} />}
            {activeTab === 'Cost' && !selectedStep && <CostPanel result={costResult} loading={loading} />}
            {activeTab === 'Templates' && (
              <TemplateLibrary currentPipeline={pipeline} onLoad={loadTemplate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function defaultName(type) {
  const names = {
    checkout: 'Checkout code',
    run: 'Run command',
    cache: 'Cache dependencies',
    'artifact-upload': 'Upload artifact',
    'artifact-download': 'Download artifact',
    'docker-build': 'Build Docker image',
    deploy: 'Deploy',
  };
  return names[type] || 'Custom step';
}

function findStep(pipeline, selection) {
  if (!selection) return null;
  const stage = pipeline.stages.find((s) => s.id === selection.stageId);
  const job = stage?.jobs.find((j) => j.id === selection.jobId);
  return job?.steps.find((st) => st.id === selection.stepId) || null;
}
