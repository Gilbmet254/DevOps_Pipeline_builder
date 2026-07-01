const yaml = require('js-yaml');

/**
 * Convert a unified pipeline definition into a GitHub Actions workflow.
 * Unified schema (see backend/lib/schema.md):
 * {
 *   name, triggers: [], variables: {}, stages: [
 *     { id, name, jobs: [
 *       { id, name, runsOn, needs: [jobId], steps: [
 *         { type: 'checkout'|'run'|'cache'|'artifact-upload'|'artifact-download'|'docker-build'|'deploy',
 *           name, command, image, path, key, env }
 *       ] }
 *     ] }
 *   ]
 * }
 *
 * Stages are converted into GitHub `needs` chains: every job in stage N
 * automatically needs every job in stage N-1, in addition to any explicit
 * `needs` the user set within a stage.
 */
function stepToGithub(step) {
  switch (step.type) {
    case 'checkout':
      return { name: step.name || 'Checkout code', uses: 'actions/checkout@v4' };
    case 'run':
      return { name: step.name || 'Run command', run: step.command || 'echo "no command set"' };
    case 'cache':
      return {
        name: step.name || 'Cache dependencies',
        uses: 'actions/cache@v4',
        with: { path: step.path || '~/.cache', key: step.key || '${{ runner.os }}-cache' },
      };
    case 'artifact-upload':
      return {
        name: step.name || 'Upload artifact',
        uses: 'actions/upload-artifact@v4',
        with: { name: step.artifactName || 'build-output', path: step.path || 'dist' },
      };
    case 'artifact-download':
      return {
        name: step.name || 'Download artifact',
        uses: 'actions/download-artifact@v4',
        with: { name: step.artifactName || 'build-output', path: step.path || 'dist' },
      };
    case 'docker-build':
      return {
        name: step.name || 'Build Docker image',
        run: `docker build -t ${step.image || 'app:latest'} .`,
      };
    case 'deploy':
      return {
        name: step.name || 'Deploy',
        run: step.command || 'echo "Add your deploy command here"',
      };
    default:
      return { name: step.name || 'Custom step', run: step.command || 'echo "noop"' };
  }
}

function generateGithubActions(pipeline) {
  const jobs = {};
  const stageJobIds = pipeline.stages.map((stage) => stage.jobs.map((j) => j.id));

  pipeline.stages.forEach((stage, stageIdx) => {
    const previousStageJobIds = stageIdx > 0 ? stageJobIds[stageIdx - 1] : [];

    stage.jobs.forEach((job) => {
      const needs = Array.from(new Set([...(job.needs || []), ...previousStageJobIds]));
      jobs[job.id] = {
        name: `${stage.name} / ${job.name}`,
        'runs-on': job.runsOn || 'ubuntu-latest',
        ...(needs.length ? { needs } : {}),
        steps: (job.steps || []).map(stepToGithub),
      };
    });
  });

  const workflow = {
    name: pipeline.name || 'Generated Pipeline',
    on: buildTriggers(pipeline.triggers),
    ...(pipeline.variables && Object.keys(pipeline.variables).length
      ? { env: pipeline.variables }
      : {}),
    jobs,
  };

  return yaml.dump(workflow, { lineWidth: 120, noRefs: true });
}

function buildTriggers(triggers = ['push']) {
  const on = {};
  if (triggers.includes('push')) on.push = { branches: ['main'] };
  if (triggers.includes('pull_request')) on.pull_request = { branches: ['main'] };
  if (triggers.includes('schedule')) on.schedule = [{ cron: '0 0 * * *' }];
  if (triggers.includes('manual')) on.workflow_dispatch = {};
  if (Object.keys(on).length === 0) on.push = { branches: ['main'] };
  return on;
}

module.exports = { generateGithubActions };
