# Project Architecture

This document describes the modular structure of the LLM MCP Bridge backend.

## Project Structure

```
llm-mcp-bridge/
├── config/
│   └── constants.js          # Environment variables and constants
├── middleware/
│   ├── auth.js                # API key validation
│   ├── cors.js                # CORS configuration
│   └── rateLimit.js           # Rate limiting
├── services/
│   ├── historyService.js      # Conversation history management
│   ├── llmService.js          # Hugging Face LLM integration
│   ├── mcpService.js          # MCP Capitol Trades integration
│   └── promptService.js       # Prompt building and MCP schema
├── routes/
│   ├── chat.js                # POST /api/chat endpoint
│   └── health.js              # GET /health endpoint
├── server.js                  # Main entry point
└── package.json
```

## Component Responsibilities

### `config/constants.js`
- Centralizes all configuration constants
- Environment variable access
- File path definitions
- History file initialization

### `middleware/`
- **auth.js**: Validates `x-api-key` header
- **cors.js**: Handles CORS for GitHub Pages domains
- **rateLimit.js**: Implements rate limiting (100 req/15min)

### `services/`
- **historyService.js**: 
  - `loadUserHistory(userId)` - Loads conversation history
  - `saveUserHistory(userId, messages)` - Saves conversation history
- **promptService.js**:
  - `buildPrompt(userMessage, history)` - Builds LLM prompt with MCP schema
  - Contains MCP_SCHEMA constant
- **llmService.js**:
  - `callHuggingFaceAPI(prompt)` - Calls Hugging Face Inference API
  - `extractJsonFromResponse(response)` - Extracts JSON from LLM response
- **mcpService.js**:
  - `callMCPFunction(functionName, params)` - Calls MCP functions
  - `fallbackMCPCall(message)` - Keyword-based fallback for MCP calls

### `routes/`
- **chat.js**: Main chat endpoint handler
- **health.js**: Health check endpoint

### `server.js`
- Express app setup
- Middleware registration
- Route mounting
- Server startup

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Maintainability**: Easy to find and modify specific functionality
3. **Testability**: Services and middleware can be tested in isolation
4. **Scalability**: Easy to add new routes, services, or middleware
5. **Reusability**: Services can be imported and used in multiple routes

## Import Flow

```
server.js
  ├── middleware/cors.js
  ├── middleware/auth.js
  ├── middleware/rateLimit.js
  ├── routes/chat.js
  │   ├── services/historyService.js
  │   ├── services/promptService.js
  │   ├── services/llmService.js
  │   └── services/mcpService.js
  └── routes/health.js
```

All components import from `config/constants.js` as needed.

## Adding New Features

### Adding a New Route
1. Create file in `routes/` directory
2. Import required services
3. Define route handlers
4. Export router
5. Mount in `server.js`

### Adding a New Service
1. Create file in `services/` directory
2. Export service functions
3. Import in routes that need it

### Adding New Middleware
1. Create file in `middleware/` directory
2. Export middleware function
3. Import and use in `server.js`

