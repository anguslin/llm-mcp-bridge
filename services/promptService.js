import { MAX_MESSAGES_PER_USER } from './historyService.js';

// MCP Schema for prompt building
const MCP_SCHEMA = `
Available MCP Functions from @anguslin/mcp-capitol-trades:

1. get_top_traded_assets(days: 30|90|180|365, limit?: number)
   - Get most traded assets by politicians
   - Returns top assets ranked by number of trades

2. get_politician_stats(politician: string, days: 30|90|180|365)
   - Get statistics for a specific politician
   - Includes total trades, buy/sell ratio, top holdings

3. get_asset_stats(symbol: string, days: 30|90|180|365)
   - Get statistics for a specific asset/stock
   - Includes total trades, buy/sell ratio, most active traders

4. get_buy_momentum_assets(days: 30|90|180|365, limit?: number)
   - Get assets with high buy momentum from politician trading
   - Shows assets where politicians are net buyers

5. get_party_buy_momentum(days: 30|90|180|365, limit?: number)
   - Get buy momentum broken down by political party
   - Shows consensus assets, Democrat favorites, Republican favorites

6. get_politician_trades(days: 30|90|180|365, options?: {
   symbol?: string,
   politician?: string,
   party?: "DEMOCRAT" | "REPUBLICAN",
   type?: ("BUY" | "SELL" | "RECEIVE" | "EXCHANGE")[]
})
   - Get politician trades with advanced filters

When the user asks about politician trades, assets, or statistics, respond with a JSON object:
{
  "function": "function_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}

If the user's message doesn't require MCP data, respond with: {"function": null}
`;

/**
 * Build prompt with history and MCP schema
 */
export function buildPrompt(userMessage, history) {
  const historyContext = history
    .slice(-MAX_MESSAGES_PER_USER)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
  
  return `${MCP_SCHEMA}

Conversation History:
${historyContext || '(No previous messages)'}

User: ${userMessage}

Assistant: First, determine if an MCP function call is needed. Your response MUST start with a JSON object in this exact format:
{"function": "function_name", "params": {...}} OR {"function": null}

Then provide your natural language response on a new line.

Example response:
{"function": "get_top_traded_assets", "params": {"days": 90, "limit": 10}}
Based on recent trading data, here are the top traded assets by politicians...`;
}

