const express = require('express');
const router = express.Router();
const { simulatePipeline } = require('../lib/simulator');

router.post('/', (req, res) => {
  const pipeline = req.body;
  if (!pipeline || !Array.isArray(pipeline.stages)) {
    return res.status(400).json({ error: 'Pipeline must include a "stages" array.' });
  }
  try {
    const result = simulatePipeline(pipeline);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Simulation failed: ${err.message}` });
  }
});

module.exports = router;
