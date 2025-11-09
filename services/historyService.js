import fs from 'fs';
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
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    const history = JSON.parse(data) || {};
    
    // Keep only last MAX_MESSAGES_PER_USER messages
    const recentMessages = messages.slice(-MAX_MESSAGES_PER_USER);
    history[userId] = recentMessages;
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

