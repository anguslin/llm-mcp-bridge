// Configuration - Automatically detects local development vs production
// For local development: uses http://localhost:3000
// For production: uses your deployed backend URL
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

const API_BASE_URL = isLocalDevelopment 
    ? 'http://localhost:3000'  // Local backend
    : 'https://llm-mcp-bridge.onrender.com'; // Production backend (update this to your deployed URL)

const API_KEY = 'VZnKldn7Gw0qm3vSyYTdyQfFoLEBwsjWrQm7famO'; // Must match your backend API_KEY
const USER_ID = 'github-pages-user-' + Math.random().toString(36).substring(7);

// Wait for DOM to be ready
let chatForm, messageInput, sendButton, chatMessages;

// Convert inline bullet points to markdown lists
function convertInlineBulletsToMarkdown(text) {
    // Check if text contains inline bullet points (• on same line)
    // Pattern: text with multiple • symbols on the same line
    const inlineBulletPattern = /([^\n]*•[^\n]*•[^\n]*)/;
    
    if (inlineBulletPattern.test(text)) {
        // Split by bullet points and convert to markdown list
        const lines = text.split('\n');
        const processedLines = lines.map(line => {
            // If line contains multiple bullet points, convert them
            if (line.includes('•') && (line.match(/•/g) || []).length > 1) {
                // Split by bullet point, filter empty, and format as markdown list
                const items = line.split(/•\s*/).filter(item => item.trim().length > 0);
                return items.map(item => `- ${item.trim()}`).join('\n');
            }
            return line;
        });
        return processedLines.join('\n');
    }
    
    return text;
}

// Add message to chat (with markdown support)
function addMessage(content, type = 'assistant') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Convert inline bullet points to markdown lists
    let processedContent = convertInlineBulletsToMarkdown(content);
    
    // Render markdown if available, otherwise use plain text
    if (typeof marked !== 'undefined') {
        const rendered = marked.parse(processedContent);
        messageDiv.innerHTML = rendered;
    } else {
        const p = document.createElement('p');
        p.textContent = processedContent;
        messageDiv.appendChild(p);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// Add loading message with progress updates
function addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message loading';
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Analyzing your question...';
    
    messageDiv.innerHTML = `
        <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        </div>
    `;
    messageDiv.appendChild(textSpan);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Update loading message based on time with more stages
    const progressStages = [
        { delay: 0, message: 'Analyzing your question...' },
        { delay: 1500, message: 'Determining data needs...' },
        { delay: 3000, message: 'Fetching data from Capitol Trades...' },
        { delay: 5000, message: 'Processing data...' },
        { delay: 7000, message: 'Formatting response...' },
        { delay: 10000, message: 'Almost done...' }
    ];
    
    progressStages.forEach((stage) => {
        if (stage.delay > 0) {
            setTimeout(() => {
                if (textSpan && textSpan.parentNode) {
                    textSpan.textContent = stage.message;
                }
            }, stage.delay);
        }
    });
    
    // Store reference to text span for easy updates
    messageDiv._textSpan = textSpan;
    
    return messageDiv;
}

// Remove loading message
function removeLoadingMessage(loadingDiv) {
    if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
    }
}

// Send message to backend
async function sendMessage(message) {
    try {
        // Add user message to UI
        addMessage(message, 'user');
        
        // Show loading
        const loadingDiv = addLoadingMessage();
        
        // Make API request
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-user-id': USER_ID,
            },
            body: JSON.stringify({ message }),
        });

        removeLoadingMessage(loadingDiv);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Display the final analyzed response
        if (data.reply) {
            addMessage(data.reply, 'assistant');
        } else if (data.llmReply) {
            // Fallback for old format
            addMessage(data.llmReply, 'assistant');
        } else {
            addMessage('No response received from the server.', 'assistant');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.innerHTML = `<p>❌ Error: ${error.message}</p><p style="font-size: 12px; margin-top: 8px;">Make sure your API_BASE_URL and API_KEY are configured correctly.</p>`;
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    chatForm = document.getElementById('chat-form');
    messageInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-button');
    chatMessages = document.getElementById('chat-messages');

    if (!chatForm || !messageInput || !sendButton || !chatMessages) {
        console.error('Failed to find required DOM elements');
        return;
    }

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Disable input while processing
        messageInput.disabled = true;
        sendButton.disabled = true;
        
        await sendMessage(message);
        
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.value = '';
        messageInput.focus();
    });

    // Allow Enter to send (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Handle clickable examples (works with both li and div elements)
    const exampleItems = document.querySelectorAll('.example-item');
    exampleItems.forEach(item => {
        item.addEventListener('click', () => {
            const exampleText = item.getAttribute('data-example');
            if (exampleText) {
                messageInput.value = exampleText;
                messageInput.focus();
            }
        });
    });

    // Check API configuration on load
    if (API_KEY === 'your-api-key-here') {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'message error';
        warningDiv.style.margin = '16px 24px';
        warningDiv.innerHTML = `
            <p>⚠️ Configuration Required</p>
            <p style="font-size: 12px; margin-top: 8px;">
                Please set your API_KEY in app.js or configure it as an environment variable for GitHub Pages.
            </p>
        `;
        chatMessages.insertBefore(warningDiv, chatMessages.firstChild);
    }
});
