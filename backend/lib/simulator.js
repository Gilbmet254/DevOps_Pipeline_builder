/**
 * Simulates executing the pipeline without touching any real infrastructure.
 * Produces a deterministic, ordered log with per-step timing estimates,
 * validation warnings, and a final status.
 */

const STEP_DURATION_SECONDS = {
  checkout: 8,
  run: 45,
  cache: 12,
  'artifact-upload': 15,
  'artifact-download': 10,
  'docker-build': 120,
  deploy: 60,
  default: 20,
};

function validateStep(step) {
  const warnings = [];
  if ((step.type === 'run' || step.type === 'deploy') && !step.command) {
    warnings.push(`Step "${step.name || step.type}" has no command configured.`);
  }
  if (step.type === 'docker-build' && !step.image) {
    warnings.push(`Docker build step "${step.name || step.id}" has no image tag; defaulting to app:latest.`);
  }
  if (step.type === 'artifact-upload' && !step.path) {
    warnings.push(`Artifact upload step "${step.name || step.id}" has no path; defaulting to dist.`);
  }
  return warnings;
}

function simulatePipeline(pipeline) {
  const log = [];
  const warnings = [];
  let clockSeconds = 0;
  let hasFailure = false;

  log.push({ t: clockSeconds, level: 'info', message: `Starting dry-run for pipeline "${pipeline.name || 'Unnamed pipeline'}"` });

  if (!pipeline.stages || pipeline.stages.length === 0) {
    warnings.push('Pipeline has no stages defined.');
    return {
      status: 'failed',
      totalDurationSeconds: 0,
      log,
      warnings,
    };
  }

  pipeline.stages.forEach((stage) => {
    log.push({ t: clockSeconds, level: 'stage', message: `Stage "${stage.name}" started` });

    if (!stage.jobs || stage.jobs.length === 0) {
      warnings.push(`Stage "${stage.name}" has no jobs.`);
    }

    // Jobs within a stage run in parallel in a real system; for the
    // simulated timeline we advance the clock by the longest job.
    let maxJobDuration = 0;

    (stage.jobs || []).forEach((job) => {
      log.push({ t: clockSeconds, level: 'job', message: `  Job "${job.name}" started on runner "${job.runsOn || 'ubuntu-latest'}"` });
      let jobDuration = 0;

      if (!job.steps || job.steps.length === 0) {
        warnings.push(`Job "${job.name}" in stage "${stage.name}" has no steps.`);
      }

      (job.steps || []).forEach((step) => {
        const stepWarnings = validateStep(step);
        stepWarnings.forEach((w) => warnings.push(w));

        const duration = STEP_DURATION_SECONDS[step.type] || STEP_DURATION_SECONDS.default;
        jobDuration += duration;

        const failed = (step.type === 'run' || step.type === 'deploy') && !step.command;
        if (failed) hasFailure = true;

        log.push({
          t: clockSeconds + jobDuration,
          level: failed ? 'error' : 'step',
          message: `    [${step.type}] ${step.name || step.type} ${failed ? 'FAILED (missing command)' : `completed in ~${duration}s`}`,
        });
      });

      maxJobDuration = Math.max(maxJobDuration, jobDuration);
      log.push({ t: clockSeconds + jobDuration, level: 'job', message: `  Job "${job.name}" finished` });
    });

    clockSeconds += maxJobDuration;
    log.push({ t: clockSeconds, level: 'stage', message: `Stage "${stage.name}" completed` });
  });

  log.push({ t: clockSeconds, level: 'info', message: `Dry-run finished in ~${clockSeconds}s` });

  return {
    status: hasFailure ? 'failed' : 'success',
    totalDurationSeconds: clockSeconds,
    log,
    warnings,
  };
}

module.exports = { simulatePipeline };
