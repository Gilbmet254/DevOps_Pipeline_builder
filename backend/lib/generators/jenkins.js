function stepToJenkinsSh(step) {
  switch (step.type) {
    case 'checkout':
      return `checkout scm`;
    case 'run':
      return `sh '${escapeSingleQuotes(step.command || 'echo "no command set"')}'`;
    case 'cache':
      return `// cache: consider using the Jenkins "Job Cacher" plugin for path "${step.path || '.cache'}"`;
    case 'artifact-upload':
      return `archiveArtifacts artifacts: '${step.path || 'dist/**'}', fingerprint: true`;
    case 'artifact-download':
      return `unarchive mapping: ['${step.path || 'dist/**'}': '.']`;
    case 'docker-build':
      return `sh 'docker build -t ${step.image || 'app:latest'} .'`;
    case 'deploy':
      return `sh '${escapeSingleQuotes(step.command || 'echo "Add your deploy command here"')}'`;
    default:
      return `sh '${escapeSingleQuotes(step.command || 'echo "noop"')}'`;
  }
}

function escapeSingleQuotes(str) {
  return String(str).replace(/'/g, "'\\''");
}

function indent(lines, depth) {
  const pad = '    '.repeat(depth);
  return lines.map((l) => pad + l).join('\n');
}

function generateJenkinsfile(pipeline) {
  const envLines = pipeline.variables && Object.keys(pipeline.variables).length
    ? indent(
        ['environment {', ...Object.entries(pipeline.variables).map(([k, v]) => `    ${k} = '${v}'`), '}'],
        1
      )
    : '';

  const triggerBlock = buildTriggers(pipeline.triggers);

  const stageBlocks = pipeline.stages
    .map((stage) => {
      // Jenkins declarative pipeline stages run sequentially by default.
      // Jobs within a stage are represented as `parallel` branches.
      const jobBlocks = stage.jobs
        .map((job) => {
          const stepLines = (job.steps || []).map(stepToJenkinsSh);
          return [
            `'${job.name}': {`,
            `    node {`,
            ...stepLines.map((l) => `        ${l}`),
            `    }`,
            `}`,
          ].join('\n');
        })
        .join(',\n');

      const body = stage.jobs.length > 1
        ? `parallel {\n${indent([jobBlocks], 1)}\n}`
        : (() => {
            const job = stage.jobs[0] || { steps: [] };
            const stepLines = (job.steps || []).map(stepToJenkinsSh);
            return `steps {\n${indent(stepLines, 1)}\n}`;
          })();

      return `stage('${stage.name}') {\n${indent([body], 1)}\n}`;
    })
    .join('\n');

  const jenkinsfile = [
    'pipeline {',
    '    agent any',
    triggerBlock ? indent([triggerBlock], 1) : '',
    envLines,
    '    stages {',
    indent([stageBlocks], 2),
    '    }',
    '}',
  ]
    .filter(Boolean)
    .join('\n');

  return jenkinsfile;
}

function buildTriggers(triggers = ['push']) {
  const lines = [];
  if (triggers.includes('schedule')) {
    lines.push("triggers {\n    cron('H 0 * * *')\n}");
  }
  // push / pull_request triggers in Jenkins are typically configured via
  // a webhook + multibranch pipeline in the job UI, not in the Jenkinsfile.
  return lines.join('\n');
}

module.exports = { generateJenkinsfile };
