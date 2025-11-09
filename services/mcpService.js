import * as mcpCapitolTradesModule from '@anguslin/mcp-capitol-trades';

// Map function names to MCP package functions
const MCP_FUNCTION_MAP = {
  'get_top_traded_assets': 'get_top_traded_assets',
  'get_politician_stats': 'get_politician_stats',
  'get_asset_stats': 'get_asset_stats',
  'get_buy_momentum_assets': 'get_buy_momentum_assets',
  'get_party_buy_momentum': 'get_party_buy_momentum',
  'get_politician_trades': 'get_politician_trades',
};

/**
 * Call MCP function
 */
export async function callMCPFunction(functionName, params) {
  try {
    if (!functionName) {
      return null;
    }

    // Try to find the function in the MCP package
    // Handle both named exports and default exports
    const mcpModule = mcpCapitolTradesModule.default || mcpCapitolTradesModule;
    const mappedName = MCP_FUNCTION_MAP[functionName] || functionName;
    const func = mcpModule[mappedName] || mcpCapitolTradesModule[mappedName];

    if (!func || typeof func !== 'function') {
      console.warn(`MCP function ${functionName} not found`);
      return null;
    }

    // Call the function with params
    return await func(params);
  } catch (error) {
    console.error(`Error calling MCP function ${functionName}:`, error);
    return { error: `MCP function error: ${error.message}` };
  }
}

/**
 * Fallback: Keyword-based MCP calls when JSON parsing fails
 */
export async function fallbackMCPCall(message) {
  const lowerMessage = message.toLowerCase();
  
  // Keyword-based fallback logic
  if (lowerMessage.includes('top') && (lowerMessage.includes('trade') || lowerMessage.includes('asset'))) {
    try {
      return await callMCPFunction('get_top_traded_assets', { days: 90, limit: 10 });
    } catch (error) {
      console.error('Fallback MCP call error:', error);
      return null;
    }
  } else if (lowerMessage.includes('politician') && (lowerMessage.includes('stat') || lowerMessage.includes('trade'))) {
    // Try to extract politician name from message
    const politicianMatch = message.match(/politician[:\s]+([A-Za-z\s]+)|([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (politicianMatch) {
      const politician = politicianMatch[1] || politicianMatch[2];
      try {
        return await callMCPFunction('get_politician_stats', { politician: politician.trim(), days: 90 });
      } catch (error) {
        console.error('Fallback MCP call error:', error);
        return null;
      }
    }
  } else if (lowerMessage.includes('buy') && lowerMessage.includes('momentum')) {
    try {
      return await callMCPFunction('get_buy_momentum_assets', { days: 90, limit: 10 });
    } catch (error) {
      console.error('Fallback MCP call error:', error);
      return null;
    }
  } else if (lowerMessage.includes('party') && lowerMessage.includes('momentum')) {
    try {
      return await callMCPFunction('get_party_buy_momentum', { days: 90, limit: 5 });
    } catch (error) {
      console.error('Fallback MCP call error:', error);
      return null;
    }
  }
  
  return null;
}

