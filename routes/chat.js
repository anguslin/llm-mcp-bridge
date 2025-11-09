import express from 'express';
import { HF_API_KEY } from '../config/constants.js';
import { loadUserHistory, saveUserHistory } from '../services/historyService.js';
import { buildPrompt } from '../services/promptService.js';
import { callHuggingFaceAPI, extractJsonFromResponse } from '../services/llmService.js';
import { callMCPFunction, fallbackMCPCall } from '../services/mcpService.js';

const router = express.Router();

/**
 * POST /api/chat endpoint
 */
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous';

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!HF_API_KEY) {
      return res.status(500).json({ error: 'Hugging Face API key not configured' });
    }

    // Load user history
    const history = loadUserHistory(userId);

    // Build prompt
    const prompt = buildPrompt(message, history);

    // Call Hugging Face API
    let llmReply;
    try {
      const llmResponse = await callHuggingFaceAPI(prompt);
      llmReply = llmResponse.trim();
    } catch (error) {
      console.error('LLM API error:', error);
      llmReply = `I'm having trouble processing your request right now. Please try again later. Error: ${error.message}`;
    }

    // Extract JSON from LLM response to determine MCP call
    const mcpCall = extractJsonFromResponse(llmReply);

    // Call MCP server if needed
    let mcpReply = null;
    if (mcpCall && mcpCall.function) {
      try {
        mcpReply = await callMCPFunction(mcpCall.function, mcpCall.params || {});
      } catch (error) {
        console.error('MCP call error:', error);
        mcpReply = { error: 'Failed to retrieve MCP data' };
      }
    }

    // Fallback: If JSON parsing failed, try keyword-based MCP calls
    if (!mcpCall || !mcpCall.function) {
      mcpReply = await fallbackMCPCall(message);
    }

    // Save to history
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: llmReply }
    );
    saveUserHistory(userId, history);

    // Return combined response
    res.json({
      llmReply,
      mcpReply,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

