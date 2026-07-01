const express = require('express');
const cors = require('cors');

const templatesRouter = require('./routes/templates');
const generateRouter = require('./routes/generate');
const simulateRouter = require('./routes/simulate');
const costRouter = require('./routes/cost');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'pipeline-builder-backend', time: new Date().toISOString() });
});

app.use('/api/templates', templatesRouter);
app.use('/api/generate', generateRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/cost', costRouter);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Pipeline Builder API listening on http://localhost:${PORT}`);
});
