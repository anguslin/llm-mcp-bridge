# LLM MCP Bridge

A Node.js + Express backend that connects a static frontend (GitHub Pages) to the Hugging Face LLM API and the MCP Capitol Trades server. It processes user messages, maintains conversation history, and returns combined responses from both the LLM and MCP server.

## Features

- **Express Server**: Handles POST `/api/chat` requests with JSON responses
- **Security**: CORS restriction, API key validation, and rate limiting (100 requests per 15 minutes per IP)
- **LLM Integration**: Uses Hugging Face Inference API via `@huggingface/inference` SDK with conversation history
- **MCP Integration**: Connects to `@anguslin/mcp-capitol-trades` for politician trading data
- **Conversation History**: Stores up to 30 messages per user in a local JSON file

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
   - `HF_API_KEY`: Your Hugging Face API token (required)
   - `API_KEY`: Custom API key for authentication between the frontend and this server (required)
   - `HF_MODEL_TYPE`: Hugging Face model identifier (optional, defaults to `mistralai/Mistral-7B-Instruct-v0.3`)
   - `PORT`: Server port (optional, defaults to 3000)
   - `GITHUB_PAGES_DOMAIN`: (optional) Origin allowed by CORS (e.g. `https://your-user.github.io`)
   - `TRUST_PROXY`: (optional) Express proxy trust setting; keep unset locally

### Example `.env` for local development
```dotenv
HF_API_KEY=hf_your_token
API_KEY=local-dev-key
HF_MODEL_TYPE=mistralai/Mistral-7B-Instruct-v0.3
PORT=3000
GITHUB_PAGES_DOMAIN=https://your-site.github.io
# TRUST_PROXY intentionally omitted for localhost
```

## Running the Server

Start the server in production mode:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Local helpers (automatically set `NODE_ENV=development`):
```bash
npm run start:local
npm run dev:local
```

These scripts expect `.env` to contain `HF_API_KEY`, `API_KEY`, and optionally override `PORT`.

## Testing the Server

### Test the full server
With your server running (e.g. `npm run dev:local`), you can send a smoke test to `/health` and `/api/chat`:
```bash
npm test
```
The test script reads credentials from `.env` and prints the responses. Ensure `API_KEY` is set; otherwise it skips the chat call.

To validate your deployed instance (e.g. Render), run:
```bash
npm run test:remote
```
The `test:remote` script uses a fixed `BASE_URL=https://llm-mcp-bridge.onrender.com`. Override that variable if your deployment lives elsewhere.

### Test the LLM service directly
To test the Hugging Face LLM integration in isolation:
```bash
npm run test:llm
```
This script tests the LLM service directly without requiring the full server to be running. You can customize the test message:
```bash
TEST_MESSAGE="What are the top traded assets?" npm run test:llm
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
- `HF_MODEL_TYPE` (optional): Hugging Face model identifier, defaults to `mistralai/Mistral-7B-Instruct-v0.3`
  - Examples: `mistralai/Mistral-7B-Instruct-v0.3`, `mistralai/Mistral-7B-Instruct-v0.2`, `moonshotai/Kimi-K2-Instruct-0905`
  - Note: Use text generation models (not chat models) for best compatibility
- `PORT` (optional): Server port, defaults to 3000
- `GITHUB_PAGES_DOMAIN` (optional): GitHub Pages domain for CORS configuration
- `NODE_ENV` (optional): Environment mode (development/production)
- `TRUST_PROXY` (optional but recommended in production): Express `trust proxy` setting; use `1` on Render

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
3. Set the following environment variables under **Environment > Environment Variables**:
   - `HF_API_KEY`: Same token you use locally (stored as a secret in Render)
   - `API_KEY`: Match the key your production frontend sends in the `x-api-key` header
   - `HF_MODEL_TYPE` (optional): Override the default model if needed
   - `TRUST_PROXY=1`: Required so Express honors `X-Forwarded-For` when behind Render's proxy
   - `GITHUB_PAGES_DOMAIN` (optional): Production domain allowed by CORS
4. Render injects the `PORT` automatically—do not hard-code it.
5. Click **Deploy**. Update secrets here whenever they rotate, then redeploy to apply.

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
- The project uses the official `@huggingface/inference` SDK for LLM integration, which handles retries and error handling automatically

