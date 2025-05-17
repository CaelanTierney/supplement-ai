const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplementController');

// In-memory array for demonstration
let supplements = [
  { id: 1, name: 'Creatine', description: 'Helps with power output and recovery.', category: 'Performance' },
  { id: 2, name: 'Vitamin D', description: 'Supports bone health and immunity.', category: 'Health' }
];
let nextId = 3;

// GET /api/supplements
router.get('/supplements', (req, res) => {
  console.log('GET /api/supplements');
  res.json(supplements);
});

// POST /api/supplements
router.post('/supplements', (req, res) => {
  console.log('POST /api/supplements', req.body);
  const { name, description, category } = req.body;
  if (!name || !description || !category) {
    return res.status(400).json({ error: 'Invalid supplement data. "name", "description", and "category" are required.' });
  }
  const newSupplement = { id: nextId++, name, description, category };
  supplements.push(newSupplement);
  res.status(201).json(newSupplement);
});

// GET /api/supplements/:id
router.get('/supplements/:id', (req, res) => {
  console.log('GET /api/supplements/:id', req.params.id);
  const id = parseInt(req.params.id, 10);
  const supplement = supplements.find(s => s.id === id);
  if (!supplement) {
    return res.status(404).json({ error: 'Supplement not found' });
  }
  res.json(supplement);
});

// DELETE /api/supplements/:id
router.delete('/supplements/:id', (req, res) => {
  console.log('DELETE /api/supplements/:id', req.params.id);
  const id = parseInt(req.params.id, 10);
  const index = supplements.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Supplement not found' });
  }
  supplements.splice(index, 1);
  res.status(204).send();
});

// Existing POST /supplement endpoint
router.post('/supplement', supplementController.getSupplementInfo);

// 404 handler for /api/*
router.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

module.exports = router;