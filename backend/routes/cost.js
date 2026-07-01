const express = require('express');
const router = express.Router();
const { estimateCost } = require('../lib/costEstimator');

router.post('/', (req, res) => {
  const { pipeline, runsPerMonth } = req.body;
  if (!pipeline || !Array.isArray(pipeline.stages)) {
    return res.status(400).json({ error: 'Pipeline must include a "stages" array.' });
  }
  try {
    const result = estimateCost(pipeline, { runsPerMonth: Number(runsPerMonth) || 30 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Cost estimation failed: ${err.message}` });
  }
});

module.exports = router;
