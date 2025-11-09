import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'http://localhost';
const API_KEY = process.env.API_KEY;
const USER_ID = process.env.USER_ID || 'local-test';
const MESSAGE = process.env.MESSAGE || 'Hello!';

async function main() {
  const normalizedHost = HOST.endsWith('/') ? HOST.slice(0, -1) : HOST;
  const baseUrl = `${normalizedHost}:${PORT}`;

  try {
    // Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.log('Health check:', healthJson);

    if (!API_KEY) {
      console.warn('API_KEY environment variable not set. Skipping /api/chat call.');
      return;
    }

    // Chat endpoint
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-user-id': USER_ID,
      },
      body: JSON.stringify({ message: MESSAGE }),
    });

    const chatJson = await chatRes.json();
    console.log('Chat response:', chatJson);
  } catch (error) {
    console.error('Error pinging server:', error.message);
  }
}

main();

