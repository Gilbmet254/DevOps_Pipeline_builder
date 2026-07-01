const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'templates.json');

function readTemplates() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeTemplates(templates) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(templates, null, 2));
}

// List all templates (summary only)
router.get('/', (req, res) => {
  const templates = readTemplates();
  res.json(
    templates.map(({ id, name, description, author, tags }) => ({ id, name, description, author, tags }))
  );
});

// Get a single template with its full pipeline definition
router.get('/:id', (req, res) => {
  const templates = readTemplates();
  const template = templates.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

// Contribute a new community template
router.post('/', (req, res) => {
  const { name, description, author, tags, pipeline } = req.body;
  if (!name || !pipeline || !Array.isArray(pipeline.stages)) {
    return res.status(400).json({ error: 'name and a valid pipeline (with stages) are required.' });
  }
  const templates = readTemplates();
  const newTemplate = {
    id: uuidv4(),
    name,
    description: description || '',
    author: author || 'anonymous',
    tags: Array.isArray(tags) ? tags : [],
    pipeline,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  writeTemplates(templates);
  res.status(201).json(newTemplate);
});

// Delete a community-contributed template
router.delete('/:id', (req, res) => {
  const templates = readTemplates();
  const idx = templates.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Template not found' });
  const [removed] = templates.splice(idx, 1);
  writeTemplates(templates);
  res.json({ removed: removed.id });
});

module.exports = router;
