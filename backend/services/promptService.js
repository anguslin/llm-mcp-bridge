import { MAX_MESSAGES_PER_USER } from './historyService.js';
import { getMCPTools } from './mcpService.js';

/**
 * Build MCP schema from actual MCP server tools
 */
async function buildMCPSchema() {
  try {
    const tools = await getMCPTools();
    
    if (tools.length === 0) {
      return 'No MCP tools available.';
    }

    let schema = 'Available MCP Functions from @anguslin/mcp-capitol-trades:\n\n';
    
    tools.forEach((tool, index) => {
      schema += `${index + 1}. ${tool.name}`;
      
      // Add description if available
      if (tool.description) {
        schema += `\n   - ${tool.description}`;
      }
      
      // Add input schema if available
      if (tool.inputSchema && tool.inputSchema.properties) {
        const params = Object.entries(tool.inputSchema.properties)
          .map(([key, value]) => {
            const type = value.type || 'any';
            const required = tool.inputSchema.required?.includes(key) ? '' : '?';
            const description = value.description ? ` (${value.description})` : '';
            return `${key}${required}: ${type}${description}`;
          })
          .join(', ');
        if (params) {
          schema += `\n   - Parameters: ${params}`;
        }
      }
      
      schema += '\n\n';
    });

    schema += `When the user asks about politician trades, assets, or statistics, respond with a JSON object:
{
  "function": "function_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}

If the user's message doesn't require MCP data, respond with: {"function": null}`;

    return schema;
  } catch (error) {
    console.error('Error building MCP schema:', error);
    // Fallback to basic message
    return 'MCP tools are available but schema could not be loaded.';
  }
}

// Fetch schema once at module load time
let MCP_SCHEMA = null;
const schemaPromise = buildMCPSchema().then(schema => {
  MCP_SCHEMA = schema;
  console.log('✅ MCP schema loaded at startup');
  return schema;
}).catch(error => {
  console.error('Failed to load MCP schema at startup:', error);
  MCP_SCHEMA = 'MCP tools are available but schema could not be loaded.';
  return MCP_SCHEMA;
});

/**
 * Build prompt with history and MCP schema (for function detection)
 */
export async function buildPrompt(userMessage, history) {
  // Ensure schema is loaded (wait if still loading)
  if (!MCP_SCHEMA) {
    await schemaPromise;
  }
  
  const historyContext = history
    .slice(-MAX_MESSAGES_PER_USER)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
  
  return `${MCP_SCHEMA}

Conversation History:
${historyContext || '(No previous messages)'}

User: ${userMessage}

Assistant: Determine if an MCP function call is needed. Your response MUST start with a JSON object in this exact format:
{"function": "function_name", "params": {...}} OR {"function": null}

Example:
{"function": "get_top_traded_assets", "params": {"days": 90, "limit": 10}}`;
}

/**
 * Build prompt for analyzing MCP data and generating natural language response
 */
export async function buildAnalysisPrompt(userMessage, mcpData, history) {
  const historyContext = history
    .slice(-MAX_MESSAGES_PER_USER)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
  
  const mcpDataStr = JSON.stringify(mcpData, null, 2);
  
  // Debug logging
  console.log('=== buildAnalysisPrompt called ===');
  console.log('User Message:', userMessage);
  console.log('History Context:', historyContext);
  console.log('MCP Data:', JSON.stringify(mcpData, null, 2));
  console.log('===================================');
  
  return `You are a helpful assistant that analyzes politician trading data from Capitol Trades. Your responses should be clear, well-formatted, and easy to read.

Conversation History:
${historyContext || '(No previous messages)'}

User asked: ${userMessage}

MCP Data Retrieved:
${mcpDataStr}

Analyze this data and provide a clear, natural language response to the user's question. 

FORMATTING REQUIREMENTS:
- Use markdown formatting for better readability (headers, lists, bold text)
- Organize information with clear sections using ## headers
- Use markdown list syntax for bullet points - each item MUST be on a new line:
  - Item 1: Description
  - Item 2: Description
  - Item 3: Description
- DO NOT use inline bullet points (•) on the same line - always use markdown list format with each item on its own line
- Highlight key numbers and statistics using **bold**
- For multiple related items, use markdown lists (not inline text with bullet symbols)
- For tables or structured data, use markdown tables or well-formatted lists
- Keep paragraphs concise and scannable
- Use line breaks to separate different topics
- Each list item must start with "- " or "* " and be on a separate line

RESPONSE STRUCTURE:
1. Start with a brief summary answering the user's question
2. Present the key findings in an organized way
3. Include specific numbers, dates, and statistics from the data
4. Highlight any interesting trends or patterns
5. End with any relevant insights or conclusions

Make your response conversational and easy to understand. Avoid raw JSON or technical jargon unless necessary.`;
}

