# LLM MCP Bridge

A Node.js + Express backend that connects a static frontend (GitHub Pages) to the Hugging Face LLM API and the MCP Capitol Trades server. It processes user messages, maintains conversation history, and returns combined responses from both the LLM and MCP server.

## Features

- **Express Server**: Handles POST `/api/chat` requests with JSON responses
- **Security**: CORS restriction, API key validation, and rate limiting (100 requests per 15 minutes per IP)
- **LLM Integration**: Uses Hugging Face Inference API (Falcon-7B) with conversation history
- **MCP Integration**: Connects to `@anguslin/mcp-capitol-trades` for politician trading data
- **Conversation History**: Stores up to 20 messages per user in a local JSON file

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - `HF_API_KEY`: Your Hugging Face API token
   - `API_KEY`: Custom API key for authentication
   - `PORT`: Server port (default: 3000)

## Running the Server

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST `/api/chat`

Processes user messages and returns combined LLM and MCP responses.

**Headers:**
- `x-api-key`: Your API key (required)
- `x-user-id`: User identifier for conversation history (required)

**Request Body:**
```json
{
  "message": "What are the top traded assets by politicians?"
}
```

**Response:**
```json
{
  "llmReply": "Based on the data...",
  "mcpReply": {
    "data": "..."
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Environment Variables

- `HF_API_KEY` (required): Hugging Face API token
- `API_KEY` (required): Custom API key for request authentication
- `PORT` (optional): Server port, defaults to 3000
- `GITHUB_PAGES_DOMAIN` (optional): GitHub Pages domain for CORS configuration
- `NODE_ENV` (optional): Environment mode (development/production)

## MCP Functions

The server integrates with the following MCP Capitol Trades functions:

- `get_top_traded_assets`: Get most traded assets by politicians
- `get_politician_stats`: Get statistics for a specific politician
- `get_asset_stats`: Get statistics for a specific asset/stock
- `get_buy_momentum_assets`: Get assets with high buy momentum
- `get_party_buy_momentum`: Get buy momentum by political party
- `get_politician_trades`: Get politician trades with filters

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables:
   - `HF_API_KEY`
   - `API_KEY`
   - `GITHUB_PAGES_DOMAIN` (optional)
4. Render provides the `PORT` for you—do not hard-code it. Deploy!

## Security

- CORS is restricted to GitHub Pages domains
- API key validation via `x-api-key` header
- Rate limiting: 100 requests per 15 minutes per IP address
- Conversation history is stored locally per user (via `x-user-id` header)

## Notes

- Conversation history is stored in `history.json` (automatically added to `.gitignore`)
- Each user's history is limited to the last 30 messages
- Render's disk is ephemeral: `history.json` resets on deploys. Use an external store if you need persistence.
- The LLM attempts to parse user requests and automatically call appropriate MCP functions
- If JSON parsing fails, the system falls back gracefully without MCP data

