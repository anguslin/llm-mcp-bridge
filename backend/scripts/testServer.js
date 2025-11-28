import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'http://localhost';
const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const USER_ID = process.env.USER_ID || 'local-test';
const MESSAGE = process.env.MESSAGE || 'hi';

function resolveBaseUrl() {
  if (BASE_URL) {
    return BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  }

  if (!HOST) {
    throw new Error('HOST environment variable must be set when BASE_URL is not provided.');
  }

  const normalizedHost = HOST.endsWith('/') ? HOST.slice(0, -1) : HOST;

  if (!PORT) {
    return normalizedHost;
  }

  if (/^https?:\/\//i.test(normalizedHost)) {
    try {
      const url = new URL(normalizedHost);
      if (!url.port) {
        url.port = PORT;
      }
      return url.toString().replace(/\/$/, '');
    } catch (error) {
      console.warn(`Failed to parse HOST as URL: ${error.message}. Falling back to string concatenation.`);
    }
  }

  return `${normalizedHost}:${PORT}`;
}

async function main() {
  let baseUrl;

  try {
    baseUrl = resolveBaseUrl();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

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

