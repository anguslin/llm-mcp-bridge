import { GITHUB_PAGES_DOMAIN } from '../config/constants.js';

/**
 * CORS middleware - restrict to GitHub Pages domain
 */
export const corsMiddleware = (req, res, next) => {
  let origin = req.headers.origin;
  
  // Extract origin from referer if origin header is missing
  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch (e) {
      // Invalid referer URL, ignore
    }
  }
  
  // Allow requests from GitHub Pages domains or configured domain
  const isAllowedOrigin = origin && (
    origin.includes('github.io') || 
    (GITHUB_PAGES_DOMAIN && origin === GITHUB_PAGES_DOMAIN) ||
    process.env.NODE_ENV === 'development'
  );
  
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-user-id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(isAllowedOrigin ? 200 : 403);
  }
  
  next();
};

