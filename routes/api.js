const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplementController');
const openaiService = require('../services/openaiService');

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

// POST /api/supplement - AI evidence-based summary
router.post('/supplement', async (req, res) => {
  const { supplement, outcome } = req.body;
  if (!supplement || !outcome) {
    return res.status(400).json({ error: 'Please provide both a supplement and a health outcome.' });
  }
  try {
    const prompt = `You are an evidence-based nutrition expert specializing in supplement research. Your task is to provide information about supplements as if you're summarizing data from examine.com.\n\nFor the query: What do you think of ${supplement} for ${outcome}?\n\n1. Focus primarily on whether there is human evidence to support the supplement for the specific outcome.\n2. Provide information on dosage and timing if available.\n3. Present information in a casual but scientifically accurate way.\n4. Be clear about the level of evidence (strong, moderate, preliminary, or insufficient).\n5. Do not exaggerate benefits or downplay risks.\n6. Limit your response to 2-3 paragraphs.\n\nIf there's insufficient information, be honest about the limitations of current research.`;
    const aiResponse = await openaiService.getCompletion(prompt);
    res.json({ result: aiResponse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get supplement information. Please try again later.' });
  }
});

// 404 handler for /api/*
router.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

module.exports = router;