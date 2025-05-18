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

    const prompt = `You are an evidence-based nutrition expert specializing in supplement and dietary pattern research, focusing exclusively on human data from Examine.com. For the query: "What do you think of ${supplement} for ${outcome}?"

For each query, use this structure:
1. Start with a casual, friendly intro (1-2 sentences, no heading) followed by a relevant emoji
2. <h3>How it works</h3> – brief mechanism (keep it casual and easy to understand)
3. <h3>Human evidence</h3> – key trials & strength (<strong>strong</strong>, <strong>moderate</strong>, <strong>preliminary</strong>, or <strong>insufficient</strong>)
4. <h3>Dosage & timing</h3> – recommended dose range and when to take (for supplements) or implementation guidelines (for dietary patterns)
5. <h3>Best form</h3> – powder, capsule, liposomal, etc. (for supplements) or practical implementation tips (for dietary patterns)
6. <h3>Safety</h3> – known side effects or interactions
7. <h3>Practical takeaway</h3> – one-sentence consumer advice
8. <h3>Summary</h3> – brief 1-2 sentence summary with emoji

Format your response using HTML:
- Use <h3> for main headings
- Use <strong> for emphasis and evidence strength ratings
- Use <em> for italics
- Use ✅ for checkmarks where appropriate
- Write in clear, concise paragraphs
- Keep paragraphs short and focused
- Use a casual, friendly tone throughout
- NEVER use markdown-style formatting (like **bold** or *italic*)
- NEVER use bullet points with dashes (-) or asterisks (*)
- NEVER use markdown-style lists
- ALWAYS use proper HTML tags for formatting

Spacing rules:
- Use exactly ONE line break between major sections
- NO line breaks between headings and their content
- Keep everything as compact as possible while maintaining readability
- Use minimal spacing throughout

Example of correct formatting:
<h3>Human evidence</h3>
<strong>Moderate</strong> evidence suggests magnesium can improve sleep quality, especially in those with low magnesium levels. Several randomized controlled trials have shown improvements in sleep onset and quality.

Example of INCORRECT formatting (DO NOT USE):
- **Magnesium**: Has moderate evidence suggesting it can improve sleep quality
* Magnesium shows moderate evidence for sleep improvement
**Magnesium** has been shown to improve sleep quality

Keep responses thorough but concise—no fluff, just clear, accurate, consumer-friendly info. If there's no human data, say so directly. Use a casual, friendly tone throughout while maintaining scientific accuracy.`;

    console.log('Sending request to OpenAI...');
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
    
    const stream = await openaiService.getCompletion(prompt, true);
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        // Flush the response to ensure immediate delivery
        if (res.flushHeaders) {
          res.flushHeaders();
        }
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
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