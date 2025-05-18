console.log('Loaded openaiService');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key is not configured');
  throw new Error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 1,
  timeout: 30000
});

const getSupplementEvidence = async (supplement, outcome) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Evidence-based supplement expert. Focus on human research, dosage, forms, timing. Be casual but accurate. State evidence level. Be honest about benefits/risks.`
        },
        {
          role: "user",
          content: `What do you think of ${supplement} for ${outcome}?`
        }
      ],
      max_tokens: 400,
      temperature: 0.1,
      presence_penalty: 0,
      frequency_penalty: 0
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI service:', error);
    throw new Error('Failed to get supplement information from AI');
  }
};

async function getCompletion(prompt) {
  try {
    console.log('Making OpenAI API request...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: `Evidence-based supplement expert. Focus on human research, dosage, forms, timing. Be casual but accurate. State evidence level. Be honest about benefits/risks.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.1,
      presence_penalty: 0,
      frequency_penalty: 0
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    console.log('Successfully received response from OpenAI');
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your configuration.');
    }
    
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection error. Please try again.');
    }
    
    throw new Error('Failed to get completion from OpenAI: ' + error.message);
  }
}

module.exports = {
  getSupplementEvidence,
  getCompletion
};