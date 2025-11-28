import fs from 'fs';
import path from 'path';
import { HISTORY_FILE } from '../config/constants.js';

export const MAX_MESSAGES_PER_USER = 30;

/**
 * Load conversation history for a user
 */
export function loadUserHistory(userId) {
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    const history = JSON.parse(data);
    return history[userId] || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

/**
 * Save conversation history for a user
 */
export function saveUserHistory(userId, messages) {
  try {
    let history = {};
    
    // Try to read existing history, or start with empty object
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        history = JSON.parse(data) || {};
      } catch (parseError) {
        console.warn('Error parsing history file, starting fresh:', parseError);
        history = {};
      }
    }
    
    // Keep only last MAX_MESSAGES_PER_USER messages
    const recentMessages = messages.slice(-MAX_MESSAGES_PER_USER);
    history[userId] = recentMessages;
    
    // Ensure directory exists
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving history:', error);
    console.error('History file path:', HISTORY_FILE);
  }
}

