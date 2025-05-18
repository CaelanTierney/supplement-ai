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
  maxRetries: 2,
  timeout: 15000
});

const getSupplementEvidence = async (supplement, outcome) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an evidence-based nutrition expert specializing in supplement research. 
          Your task is to provide information about supplements as if you're summarizing data from examine.com.
          
          For each query about a supplement and health outcome:
          1. Focus primarily on whether there is human evidence to support the supplement for the specific outcome
          2. Provide information on dosage and timing if available
          3. Present information in a casual but scientifically accurate way
          4. Be clear about the level of evidence (strong, moderate, preliminary, or insufficient)
          5. Do not exaggerate benefits or downplay risks
          
          Format your response using HTML:
          - Use <strong> for bold text
          - Use <em> for italics
          - Use <ul> and <li> for bullet points
          - Use <ol> and <li> for numbered lists
          - Use ✅ for checkmarks
          - Use 1-2 relevant emojis
          
          Keep responses concise (max 3-4 key points) and use proper HTML formatting.
          If there's insufficient information, be honest about the limitations of current research.`
        },
        {
          role: "user",
          content: `What do you think of ${supplement} for ${outcome}? Please provide an evidence-based summary focused on human research data.`
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
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
        { role: 'system', content: `You are a helpful, evidence-based supplement research assistant. 
        Format your responses using HTML:
        - Use <strong> for bold text
        - Use <em> for italics
        - Use <ul> and <li> for bullet points
        - Use <ol> and <li> for numbered lists
        - Use ✅ for checkmarks
        - Use 1-2 relevant emojis
        
        Keep responses concise (max 3-4 key points) and use proper HTML formatting.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.5,
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