import dotenv from 'dotenv';
import { callHuggingFaceAPI, extractJsonFromResponse } from '../services/llmService.js';
import { buildPrompt } from '../services/promptService.js';

dotenv.config();

async function testLLMService() {
  const testMessage = process.env.TEST_MESSAGE || 'What are the top traded assets by politicians?';
  const userId = process.env.USER_ID || 'test-user';

  console.log('Testing LLM Service...\n');
  console.log('Test message:', testMessage);
  console.log('User ID:', userId);
  console.log('---\n');

  try {
    // Test 1: Build prompt
    console.log('1. Building prompt...');
    const history = [];
    const prompt = buildPrompt(testMessage, history);
    console.log('Prompt length:', prompt.length, 'characters');
    console.log('Prompt preview:', prompt.substring(0, 200) + '...\n');

    // Test 2: Call Hugging Face API
    console.log('2. Calling Hugging Face API...');
    const startTime = Date.now();
    const llmResponse = await callHuggingFaceAPI(prompt);
    const duration = Date.now() - startTime;
    
    console.log('Response received in', duration, 'ms');
    console.log('Response length:', llmResponse.length, 'characters');
    console.log('Response preview:', llmResponse.substring(0, 300));
    console.log('\nFull response:');
    console.log(llmResponse);
    console.log('\n---\n');

    // Test 3: Extract JSON from response
    console.log('3. Extracting JSON from response...');
    const extractedJson = extractJsonFromResponse(llmResponse);
    console.log('Extracted JSON:', JSON.stringify(extractedJson, null, 2));
    console.log('\n---\n');

    // Test 4: Test with conversation history
    console.log('4. Testing with conversation history...');
    const historyWithContext = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help you with politician trading data?' }
    ];
    const promptWithHistory = buildPrompt('Tell me about AAPL trades', historyWithContext);
    console.log('Prompt with history length:', promptWithHistory.length, 'characters');
    
    const llmResponseWithHistory = await callHuggingFaceAPI(promptWithHistory);
    console.log('Response with history:', llmResponseWithHistory.substring(0, 300));
    console.log('\n---\n');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testLLMService();

