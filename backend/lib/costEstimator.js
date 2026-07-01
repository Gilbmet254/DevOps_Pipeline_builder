/**
 * Rough cost estimation for running the pipeline on each platform.
 * Rates are illustrative approximations of public pricing (as of early 2026)
 * and are meant to give directional guidance, not billing-accurate figures.
 */

const STEP_DURATION_MINUTES = {
  checkout: 0.15,
  run: 0.75,
  cache: 0.2,
  'artifact-upload': 0.25,
  'artifact-download': 0.15,
  'docker-build': 2.0,
  deploy: 1.0,
  default: 0.35,
};

// $ per runner-minute, by platform + runner tier.
const RATE_PER_MINUTE = {
  github: {
    'ubuntu-latest': 0.008,
    'ubuntu-latest-4-cores': 0.016,
    'windows-latest': 0.016,
    'macos-latest': 0.08,
  },
  gitlab: {
    default: 0.0125, // approx cost of GitLab-hosted runner minutes beyond free tier
  },
  jenkins: {
    default: 0.006, // approximate self-hosted EC2 equivalent compute cost per minute
  },
};

function estimateJobMinutes(job) {
  return (job.steps || []).reduce((sum, step) => {
    return sum + (STEP_DURATION_MINUTES[step.type] || STEP_DURATION_MINUTES.default);
  }, 0);
}

function rateFor(platform, runsOn) {
  if (platform === 'github') {
    return RATE_PER_MINUTE.github[runsOn] || RATE_PER_MINUTE.github['ubuntu-latest'];
  }
  return RATE_PER_MINUTE[platform]?.default || 0.01;
}

function estimateCost(pipeline, { runsPerMonth = 30 } = {}) {
  const platforms = ['github', 'gitlab', 'jenkins'];
  const breakdown = {};

  platforms.forEach((platform) => {
    let totalMinutesPerRun = 0;
    const jobBreakdown = [];

    (pipeline.stages || []).forEach((stage) => {
      (stage.jobs || []).forEach((job) => {
        const minutes = estimateJobMinutes(job);
        const rate = rateFor(platform, job.runsOn);
        const costPerRun = minutes * rate;
        totalMinutesPerRun += minutes;

        jobBreakdown.push({
          stage: stage.name,
          job: job.name,
          estimatedMinutesPerRun: round(minutes),
          ratePerMinute: rate,
          costPerRun: round(costPerRun),
        });
      });
    });

    const costPerRun = jobBreakdown.reduce((sum, j) => sum + j.costPerRun, 0);
    const costPerMonth = costPerRun * runsPerMonth;

    breakdown[platform] = {
      totalMinutesPerRun: round(totalMinutesPerRun),
      costPerRun: round(costPerRun),
      runsPerMonth,
      costPerMonth: round(costPerMonth),
      jobBreakdown,
    };
  });

  return breakdown;
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}

module.exports = { estimateCost };
