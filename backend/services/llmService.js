import { InferenceClient } from '@huggingface/inference';
import { HF_API_KEY, HF_MODEL_TYPE } from '../config/constants.js';

// Initialize the Hugging Face Inference client
const client = new InferenceClient(HF_API_KEY);

/**
 * Call Hugging Face Inference API
 * Uses the official @huggingface/inference SDK
 */
export async function callHuggingFaceAPI(prompt) {
  try {
    const chatCompletion = await client.chatCompletion({
      model: HF_MODEL_TYPE,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    // Extract the message content from the response
    if (chatCompletion.choices && chatCompletion.choices.length > 0 && chatCompletion.choices[0].message) {
      const content = chatCompletion.choices[0].message.content;
      console.log('=== Raw LLM API Response ===');
      console.log(JSON.stringify(chatCompletion, null, 2));
      console.log('=== Extracted Content ===');
      console.log(content);
      console.log('===========================');
      return content;
    }
    
    throw new Error('Unexpected response format from API');
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

