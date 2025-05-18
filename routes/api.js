const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplementController');
const openaiService = require('../services/openaiService');
const didYouMean = require('didyoumean2').default;
const { distance: levenshtein } = require('fastest-levenshtein');

// In-memory array for demonstration
let supplements = [
  { id: 1, name: 'Creatine', description: 'Helps with power output and recovery.', category: 'Performance' },
  { id: 2, name: 'Vitamin D', description: 'Supports bone health and immunity.', category: 'Health' }
];
let nextId = 3;

// Common supplements and outcomes for fuzzy matching
const SUPPLEMENTS = [
  'Creatine', 'Whey Protein', 'Protein', 'Vitamin D', 'Fish Oil', 'Magnesium', 'Zinc', 'Ashwagandha', 'Caffeine', 'Melatonin', 'Beta-Alanine', 'BCAA', 'Multivitamin', 'Iron', 'Calcium', 'Vitamin C', 'Vitamin B12', 'Probiotic', 'Collagen', 'Curcumin', 'Berberine', 'L-Carnitine', 'L-Glutamine', 'Green Tea', 'CoQ10', 'Resveratrol', 'Ginkgo Biloba', 'Rhodiola', 'Ginseng', 'HMB', 'Echinacea', 'Garlic', 'SAM-e', 'NAC', 'L-Theanine', 'Turmeric', 'Choline', 'DHEA', 'CLA', 'Niacin', 'Folate', 'Selenium', 'Potassium', 'Chromium', 'Copper', 'Iodine', 'Vitamin K2', 'Vitamin E', 'Vitamin A', 'Omega-3', 'Omega-6', 'Omega-9'
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
  console.log('POST /api/supplement - Request received:', req.body);
  let { supplement, outcome } = req.body;
  if (!supplement || !outcome) {
    console.log('Missing required fields:', { supplement, outcome });
    return res.status(400).json({ error: 'Please provide both a supplement and a health outcome.' });
  }

  try {
    console.log('Processing request with:', { supplement, outcome });

    const prompt = `You are an evidence-based nutrition expert specializing in supplement research. For the query: "What do you think of ${supplement} for ${outcome}?"

For each query about a supplement and health outcome:
1. Focus primarily on whether there is human evidence to support the supplement for the specific outcome
2. Provide information on dosage, best forms, timing if available
3. Present information in a casual but scientifically accurate way
4. Be clear about the level of evidence (strong, moderate, preliminary, or insufficient)
5. Do not exaggerate benefits or downplay risks

Structure your response in this order:
1. Brief introduction (1-2 sentences)
2. Evidence summary with headings and subheadings
3. Key findings in bullet points
4. Practical recommendations if applicable
5. Summary with emoji

Format your response using HTML:
- Use <h3> for main headings
- Use <h4> for subheadings
- Use <strong> for emphasis
- Use <em> for italics
- Use <ul> and <li> for bullet points
- Use <ol> and <li> for numbered lists
- Use ✅ for checkmarks

Spacing rules:
- One blank line between sections
- No extra spacing between list items
- One blank line before and after lists
- One blank line before and after headings

Always end with:
<h3>Summary</h3>
A brief 1-2 sentence summary of the key findings
Followed by a single, relevant emoji that captures the overall sentiment

Keep responses thorough but concise.`;

    console.log('Sending request to OpenAI...');
    const aiResponse = await openaiService.getCompletion(prompt);
    console.log('Received response from OpenAI');
    
    res.json({ result: aiResponse });
  } catch (error) {
    console.error('Error in /api/supplement:', error);
    
    // Handle specific error cases
    if (error.message.includes('API key')) {
      return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
    }
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: 'Service is busy. Please try again in a few moments.' });
    }
    if (error.message.includes('Connection error')) {
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
    if (error.message.includes('Invalid response')) {
      return res.status(500).json({ error: 'Unexpected response from AI service. Please try again.' });
    }
    
    // Generic error response
    res.status(500).json({ error: 'Failed to get supplement information. Please try again later.' });
  }
});

// 404 handler for /api/*
router.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

module.exports = router;