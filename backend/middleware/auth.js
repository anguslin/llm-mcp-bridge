import { API_KEY } from '../config/constants.js';

/**
 * API Key validation middleware
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!API_KEY) {
    console.error('API_KEY not configured in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  next();
};

