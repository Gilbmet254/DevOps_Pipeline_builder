const express = require('express');
const router = express.Router();

const { generateGithubActions } = require('../lib/generators/githubActions');
const { generateGitlabCI } = require('../lib/generators/gitlabci');
const { generateJenkinsfile } = require('../lib/generators/jenkins');

function validatePipeline(pipeline) {
  if (!pipeline || typeof pipeline !== 'object') return 'Pipeline definition is required.';
  if (!Array.isArray(pipeline.stages)) return 'Pipeline must include a "stages" array.';
  return null;
}

router.post('/', (req, res) => {
  const pipeline = req.body;
  const error = validatePipeline(pipeline);
  if (error) return res.status(400).json({ error });

  try {
    const githubActions = generateGithubActions(pipeline);
    const gitlabci = generateGitlabCI(pipeline);
    const jenkinsfile = generateJenkinsfile(pipeline);

    res.json({
      githubActions,
      gitlabci,
      jenkinsfile,
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to generate pipeline output: ${err.message}` });
  }
});

module.exports = router;
