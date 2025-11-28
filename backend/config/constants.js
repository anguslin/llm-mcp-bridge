import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 3000;
export const API_KEY = process.env.API_KEY;
export const HF_API_KEY = process.env.HF_API_KEY;
export const HF_MODEL_TYPE = process.env.HF_MODEL_TYPE;
export const GITHUB_PAGES_DOMAIN = process.env.GITHUB_PAGES_DOMAIN || 'https://*.github.io';
export const HISTORY_FILE = path.join(__dirname, '..', 'history.json');

// Initialize history file if it doesn't exist
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify({}, null, 2));
}

