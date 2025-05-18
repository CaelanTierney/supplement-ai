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
  timeout: 8000
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
          
          Keep responses thorough but concise. If there's insufficient information, be honest about the limitations.`
        },
        {
          role: "user",
          content: `What do you think of ${supplement} for ${outcome}? Please provide an evidence-based summary focused on human research data.`
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
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
        For each query:
        1. Focus on human evidence for the specific outcome
        2. Include dosage, forms, and timing if available
        3. Be casual but scientifically accurate
        4. State evidence level (strong/moderate/preliminary/insufficient)
        5. Be honest about benefits and risks
        
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
        
        Keep responses thorough but concise.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.3,
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