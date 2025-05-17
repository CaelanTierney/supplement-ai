const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplementController');
const openaiService = require('../services/openaiService');
const didYouMean = require('didyoumean2').default;

// In-memory array for demonstration
let supplements = [
  { id: 1, name: 'Creatine', description: 'Helps with power output and recovery.', category: 'Performance' },
  { id: 2, name: 'Vitamin D', description: 'Supports bone health and immunity.', category: 'Health' }
];
let nextId = 3;

// Common supplements and outcomes for fuzzy matching
const SUPPLEMENTS = [
  'Creatine', 'Vitamin D', 'Fish Oil', 'Protein', 'Magnesium', 'Zinc', 'Ashwagandha', 'Caffeine', 'Melatonin', 'Beta-Alanine', 'BCAA', 'Multivitamin', 'Iron', 'Calcium', 'Vitamin C', 'Vitamin B12', 'Probiotic', 'Collagen', 'Curcumin', 'Berberine', 'L-Carnitine', 'L-Glutamine', 'Green Tea', 'CoQ10', 'Resveratrol', 'Ginkgo Biloba', 'Rhodiola', 'Ginseng', 'HMB', 'Echinacea', 'Garlic', 'SAM-e', 'NAC', 'L-Theanine', 'Turmeric', 'Choline', 'DHEA', 'CLA', 'Niacin', 'Folate', 'Selenium', 'Potassium', 'Chromium', 'Copper', 'Iodine', 'Vitamin K2', 'Vitamin E', 'Vitamin A', 'Omega-3', 'Omega-6', 'Omega-9'
];
const OUTCOMES = [
  'muscle growth', 'strength', 'power', 'recovery', 'bone health', 'immunity', 'sleep', 'anxiety', 'focus', 'energy', 'fatigue', 'testosterone', 'cognition', 'memory', 'cholesterol', 'blood pressure', 'weight loss', 'fat loss', 'endurance', 'inflammation', 'joint health', 'skin health', 'hair growth', 'mood', 'depression', 'stress', 'blood sugar', 'insulin sensitivity', 'cardiovascular health', 'liver health', 'gut health', 'digestion', 'appetite', 'hydration', 'antioxidant', 'fertility', 'libido', 'vision', 'eye health', 'immune function', 'muscle soreness', 'DOMS', 'exercise performance', 'athletic performance', 'lean mass', 'body composition', 'metabolism', 'aging', 'longevity', 'pain', 'arthritis', 'osteoporosis', 'asthma', 'allergies', 'cancer risk', 'diabetes', 'heart health', 'blood flow', 'circulation', 'focus', 'alertness', 'motivation', 'well-being'
];

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
  console.log('POST /api/supplement hit', req.body);
  let { supplement, outcome } = req.body;
  if (!supplement || !outcome) {
    return res.status(400).json({ error: 'Please provide both a supplement and a health outcome.' });
  }
  // Fuzzy match supplement and outcome
  const supplementMatch = didYouMean(supplement, SUPPLEMENTS, { returnType: 'all-matches', threshold: 0.4 });
  const outcomeMatch = didYouMean(outcome, OUTCOMES, { returnType: 'all-matches', threshold: 0.4 });
  let correctedSupplement = supplement;
  let correctedOutcome = outcome;
  let correctionMsg = '';
  if (supplementMatch && supplementMatch.length > 0) {
    correctedSupplement = supplementMatch[0];
    if (correctedSupplement.toLowerCase() !== supplement.toLowerCase()) {
      correctionMsg += `Did you mean "${correctedSupplement}" for supplement?\n`;
    }
  }
  if (outcomeMatch && outcomeMatch.length > 0) {
    correctedOutcome = outcomeMatch[0];
    if (correctedOutcome.toLowerCase() !== outcome.toLowerCase()) {
      correctionMsg += `Did you mean "${correctedOutcome}" for outcome?\n`;
    }
  }
  try {
    const prompt = `You are an evidence-based nutrition expert specializing in supplement research. Your task is to provide information about supplements as if you're summarizing data from examine.com.\n\nFor the query: What do you think of ${correctedSupplement} for ${correctedOutcome}?\n\n1. Focus primarily on whether there is human evidence to support the supplement for the specific outcome.\n2. Provide information on dosage and timing if available.\n3. Present information in a casual but scientifically accurate way.\n4. Be clear about the level of evidence (strong, moderate, preliminary, or insufficient).\n5. Do not exaggerate benefits or downplay risks.\n6. Limit your response to 2-3 paragraphs.\n\nIf there's insufficient information, be honest about the limitations of current research.`;
    const aiResponse = await openaiService.getCompletion(prompt);
    res.json({ result: (correctionMsg ? correctionMsg + '\n' : '') + aiResponse });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to get supplement information. Please try again later.' });
  }
});

// 404 handler for /api/*
router.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

module.exports = router;