const yaml = require('js-yaml');

function stepToScriptLines(step) {
  switch (step.type) {
    case 'checkout':
      // GitLab CI checks out the repo automatically; add a marker comment.
      return [`# checkout is automatic in GitLab CI`];
    case 'run':
      return [step.command || 'echo "no command set"'];
    case 'cache':
      return [`# cache handled via the job's cache: key, see cache config below`];
    case 'artifact-upload':
      return [`# artifact handled via job artifacts: paths, see artifacts config below`];
    case 'artifact-download':
      return [`# artifacts from dependent jobs are downloaded automatically`];
    case 'docker-build':
      return [`docker build -t ${step.image || 'app:latest'} .`];
    case 'deploy':
      return [step.command || 'echo "Add your deploy command here"'];
    default:
      return [step.command || 'echo "noop"'];
  }
}

function generateGitlabCI(pipeline) {
  const doc = {};

  doc.stages = pipeline.stages.map((s) => s.name);

  if (pipeline.variables && Object.keys(pipeline.variables).length) {
    doc.variables = pipeline.variables;
  }

  const triggers = pipeline.triggers || ['push'];
  const rules = [];
  if (triggers.includes('push')) rules.push({ if: '$CI_PIPELINE_SOURCE == "push"' });
  if (triggers.includes('pull_request')) rules.push({ if: '$CI_PIPELINE_SOURCE == "merge_request_event"' });
  if (triggers.includes('schedule')) rules.push({ if: '$CI_PIPELINE_SOURCE == "schedule"' });
  if (triggers.includes('manual')) rules.push({ if: '$CI_PIPELINE_SOURCE == "web"', when: 'manual' });

  pipeline.stages.forEach((stage) => {
    stage.jobs.forEach((job) => {
      const script = (job.steps || []).flatMap(stepToScriptLines);

      const jobDef = {
        stage: stage.name,
        image: job.runsOn && job.runsOn.includes('docker') ? job.runsOn : (job.image || 'node:20'),
        script,
      };

      if (rules.length) jobDef.rules = rules;

      const cacheStep = (job.steps || []).find((s) => s.type === 'cache');
      if (cacheStep) {
        jobDef.cache = { key: cacheStep.key || 'default-cache', paths: [cacheStep.path || '.cache/'] };
      }

      const uploadStep = (job.steps || []).find((s) => s.type === 'artifact-upload');
      if (uploadStep) {
        jobDef.artifacts = { paths: [uploadStep.path || 'dist'] };
      }

      if (job.needs && job.needs.length) {
        jobDef.needs = job.needs;
      }

      doc[job.id] = jobDef;
    });
  });

  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

module.exports = { generateGitlabCI };
