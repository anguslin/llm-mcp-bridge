import fetch from 'node-fetch';
import { HF_API_KEY } from '../config/constants.js';

/**
 * Call Hugging Face Inference API
 */
export async function callHuggingFaceAPI(prompt) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          return_full_text: false,
          max_new_tokens: 500,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle array response format
    if (Array.isArray(data) && data.length > 0) {
      return data[0].generated_text || data[0];
    }
    
    return data.generated_text || JSON.stringify(data);
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw error;
  }
}

/**
 * Parse JSON from LLM response
 */
export function extractJsonFromResponse(response) {
  try {
    // Try to find JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { function: null };
  } catch (error) {
    console.error('Error parsing JSON from LLM response:', error);
    return { function: null };
  }
}

