import express from 'express';
import { HF_API_KEY } from '../config/constants.js';
import { loadUserHistory, saveUserHistory } from '../services/historyService.js';
import { buildPrompt, buildAnalysisPrompt } from '../services/promptService.js';
import { callHuggingFaceAPI, extractJsonFromResponse } from '../services/llmService.js';
import { callMCPFunction, fallbackMCPCall, getMCPTools } from '../services/mcpService.js';

const router = express.Router();

/**
 * Analyze MCP data using LLM and return formatted response
 */
async function analyzeMCPData(message, mcpData, history) {
  try {
    const analysisPrompt = await buildAnalysisPrompt(message, mcpData, history);
    const analysisResponse = await callHuggingFaceAPI(analysisPrompt);
    return analysisResponse.trim();
  } catch (error) {
    console.error('LLM analysis error:', error);
    return `I retrieved the data, but I'm having trouble analyzing it.`;
  }
}

/**
 * Build a helpful response when no MCP function is found
 */
async function buildNoFunctionResponse() {
  try {
    const tools = await getMCPTools();
    
    if (tools.length === 0) {
      return "Sorry, I couldn't find any information on that. I'm currently having trouble accessing the data sources.";
    }
    
    let response = "Sorry, I couldn't find any information on that topic. However, I can help you with the following:\n\n";
    
    tools.forEach((tool, index) => {
      response += `${index + 1}. **${tool.name}**`;
      if (tool.description) {
        response += ` - ${tool.description}`;
      }
      response += "\n";
    });
    
    response += "\nTry asking about one of these topics, or rephrase your question!";
    
    return response;
  } catch (error) {
    console.error('Error building no function response:', error);
    return "Sorry, I couldn't find any information on that. Please try asking about politician trading data, stock statistics, or trading trends.";
  }
}

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

    // Step 1: Build prompt to determine if MCP function call is needed
    const functionDetectionPrompt = await buildPrompt(message, history);

    // Step 2: Call LLM to detect if function call is needed
    let functionCallResponse;
    try {
      const llmResponse = await callHuggingFaceAPI(functionDetectionPrompt);
      functionCallResponse = llmResponse.trim();
      console.log('=== LLM Function Detection Response ===');
      console.log(functionCallResponse);
      console.log('=======================================');
    } catch (error) {
      console.error('LLM API error:', error);
      return res.status(500).json({ 
        error: `I'm having trouble processing your request right now. Please try again later. Error: ${error.message}` 
      });
    }

    // Step 3: Extract JSON from LLM response to determine MCP call
    const mcpCall = extractJsonFromResponse(functionCallResponse);

    // Step 4: Call MCP server if needed
    let mcpData = null;
    let finalResponse;

    if (mcpCall && mcpCall.function) {
      // Function was detected - call it
      try {
        mcpData = await callMCPFunction(mcpCall.function, mcpCall.params || {});
        
        if (mcpData && !mcpData.error) {
          // Step 5: Feed MCP data back to LLM for analysis
          finalResponse = await analyzeMCPData(message, mcpData, history);
          console.log('=== LLM Analysis Response ===');
          console.log(finalResponse);
          console.log('==============================');
        } else {
          // MCP call failed
          finalResponse = mcpData?.error || 'Failed to retrieve the requested data. Please try again.';
        }
      } catch (error) {
        console.error('MCP call error:', error);
        finalResponse = 'Failed to retrieve the requested data. Please try again.';
      }
    } else {
      // No function detected - try fallback first, then provide suggestions
      const fallbackData = await fallbackMCPCall(message);
      
      if (fallbackData && !fallbackData.error) {
        // Fallback found data
        finalResponse = await analyzeMCPData(message, fallbackData, history);
        console.log('=== LLM Fallback Analysis Response ===');
        console.log(finalResponse);
        console.log('======================================');
        mcpData = fallbackData;
      } else {
        // No function and no fallback - provide helpful suggestions
        finalResponse = await buildNoFunctionResponse();
      }
    }

    // Save to history
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: finalResponse }
    );
    saveUserHistory(userId, history);

    // Return the final analyzed response
    res.json({
      reply: finalResponse,
      mcpDataUsed: mcpData ? true : false,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

