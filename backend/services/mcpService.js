import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map function names to MCP tool names (currently 1:1 mapping, but kept for future flexibility)
const MCP_FUNCTION_MAP = {
  'get_top_traded_assets': 'get_top_traded_assets',
  'get_politician_stats': 'get_politician_stats',
  'get_asset_stats': 'get_asset_stats',
  'get_buy_momentum_assets': 'get_buy_momentum_assets',
  'get_party_buy_momentum': 'get_party_buy_momentum',
  'get_politician_trades': 'get_politician_trades',
};

// Helper to get tool name (simplifies the mapping logic)
function getToolName(functionName) {
  return MCP_FUNCTION_MAP[functionName] || functionName;
}

// MCP client instance (singleton)
let mcpClient = null;
let isConnecting = false;

/**
 * Initialize and connect to MCP server
 */
async function getMCPClient() {
  if (mcpClient) {
    return mcpClient;
  }

  if (isConnecting) {
    // Wait for connection to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return mcpClient;
  }

  isConnecting = true;

  try {
    // Find the MCP server executable
    // Package has main: "build/src/index.js" and bin: "mcp-capitol-trades"
    // __dirname is backend/services, so we need to go up one level to backend, then into node_modules
    const mcpServerPath = join(__dirname, '../node_modules/@anguslin/mcp-capitol-trades/build/src/index.js');
    
    // Create stdio transport - this will spawn the server process
    const transport = new StdioClientTransport({
      command: 'node',
      args: [mcpServerPath],
      env: process.env,
    });

    // Create MCP client
    mcpClient = new Client(
      {
        name: 'llm-mcp-bridge',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect to the server (transport connection is handled by client.connect)
    await mcpClient.connect(transport);

    console.log('✅ Connected to MCP Capitol Trades server');

    isConnecting = false;
    return mcpClient;
  } catch (error) {
    console.error('Error connecting to MCP server:', error);
    isConnecting = false;
    mcpClient = null;
    throw error;
  }
}

/**
 * Get list of available MCP tools with descriptions
 */
export async function getMCPTools() {
  try {
    const client = await getMCPClient();
    const toolsResponse = await client.listTools();
    return toolsResponse.tools || [];
  } catch (error) {
    console.error('Error getting MCP tools:', error);
    return [];
  }
}

/**
 * Call MCP function via protocol
 */
export async function callMCPFunction(functionName, params) {
  try {
    if (!functionName) {
      return null;
    }

    const toolName = getToolName(functionName);
    
    // Get or create MCP client
    const client = await getMCPClient();

    // Call the tool via MCP protocol
    const result = await client.callTool({
      name: toolName,
      arguments: params || {},
    });

    // MCP returns result in a specific format
    if (result.content && result.content.length > 0) {
      // Try to parse the content
      const content = result.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          return { data: content.text };
        }
      } else if (content.type === 'resource') {
        return content;
      }
    }

    return result;
  } catch (error) {
    console.error(`Error calling MCP function ${functionName}:`, error);
    console.error('Error stack:', error.stack);
    return { error: `MCP function error: ${error.message}` };
  }
}

/**
 * Helper to safely call MCP function with error handling
 */
async function safeMCPCall(functionName, params) {
  try {
    return await callMCPFunction(functionName, params);
  } catch (error) {
    console.error('Fallback MCP call error:', error);
    return null;
  }
}

/**
 * Fallback: Keyword-based MCP calls when JSON parsing fails
 */
export async function fallbackMCPCall(message) {
  const lowerMessage = message.toLowerCase();
  
  // Keyword-based fallback logic
  if (lowerMessage.includes('top') && (lowerMessage.includes('trade') || lowerMessage.includes('asset'))) {
    return await safeMCPCall('get_top_traded_assets', { days: 90, limit: 10 });
  } else if (lowerMessage.includes('politician') && (lowerMessage.includes('stat') || lowerMessage.includes('trade'))) {
    // Try to extract politician name from message
    const politicianMatch = message.match(/politician[:\s]+([A-Za-z\s]+)|([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (politicianMatch) {
      const politician = politicianMatch[1] || politicianMatch[2];
      return await safeMCPCall('get_politician_stats', { politician: politician.trim(), days: 90 });
    }
  } else if (lowerMessage.includes('buy') && lowerMessage.includes('momentum')) {
    return await safeMCPCall('get_buy_momentum_assets', { days: 90, limit: 10 });
  } else if (lowerMessage.includes('party') && lowerMessage.includes('momentum')) {
    return await safeMCPCall('get_party_buy_momentum', { days: 90, limit: 5 });
  }
  
  return null;
}

