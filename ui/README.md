# LLM MCP Bridge - Frontend UI

A static web frontend for the LLM MCP Bridge, designed to be hosted on GitHub Pages.

## Features

- Clean, modern chat interface
- Real-time communication with the backend API
- Displays both LLM responses and MCP data
- Responsive design for mobile and desktop
- Error handling and loading states

## Setup for GitHub Pages

### ⚠️ Security Warning

**GitHub Pages serves static files only.** Any API key in `app.js` will be **visible to everyone** (in GitHub repo, browser dev tools, page source).

**See [SECURITY.md](./SECURITY.md) for secure alternatives**, including:
- Backend proxy pattern (recommended)
- Public API key with rate limiting (for demos)
- User authentication (most secure)

### 1. Configure API Settings

Before deploying, update `app.js` with:

```javascript
const API_KEY = 'your-api-key-here'; // Must match backend API_KEY
// Update the production URL below if you deploy somewhere else:
const API_BASE_URL = isLocalDevelopment 
    ? 'http://localhost:3000' 
    : 'https://llm-mcp-bridge.onrender.com';
```

The script automatically targets `http://localhost:3000` when opened on `localhost/127.0.0.1`, so you only need to change the production URL string if your backend lives elsewhere.

**⚠️ Important:** If you hardcode the API key:
- It will be visible in your GitHub repository
- It will be visible in the deployed site's JavaScript
- Anyone can extract and use it
- **Use a separate, limited API key for public use**
- **Implement strict rate limiting on your backend**

### 2. Deploy to GitHub Pages

1. Push this `ui/` folder to your GitHub repository
2. Go to your repository Settings > Pages
3. Set source to the branch containing the `ui/` folder
4. Set the root directory to `/ui` (or move files to root if preferred)

### 3. Alternative: Deploy from Root

If you want to deploy from the repository root:

1. Move `index.html`, `styles.css`, and `app.js` to the repository root
2. Update any asset paths if needed
3. Set GitHub Pages to deploy from root

## Local Development

### Quick Start

1. **Start your backend** (in a separate terminal):
   ```bash
   cd ../backend
   npm run dev:local
   ```

2. **Start the UI** (in this directory):
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js (http-server)
   npx http-server -p 8080
   
   # Using PHP
   php -S localhost:8080
   ```

3. **Configure the API key** in `app.js`:
   ```javascript
   const API_KEY = 'your-api-key-here'; // Must match your backend's API_KEY
   ```

4. **Open** `http://localhost:8080` in your browser

### Auto-Detection

The UI **automatically detects** local development:
- When running on `localhost` or `127.0.0.1`, it uses `http://localhost:3000` for the backend
- When deployed, it uses the production backend URL defined in `app.js`

**No need to manually change `API_BASE_URL`** each time you switch environments—just ensure the production URL string and `API_KEY` are correct.

## Configuration

### Environment Variables (for GitHub Actions)

If using GitHub Actions to build/deploy, you can set:

- `API_BASE_URL`: Your backend API URL
- `API_KEY`: Your API key (store as GitHub secret)

Then modify `app.js` to read from these variables during build.

## File Structure

```
ui/
├── index.html      # Main HTML file
├── styles.css      # Styling
├── app.js          # JavaScript application logic
└── README.md       # This file
```

## Customization

- **Colors**: Edit CSS variables in `styles.css` (`:root` section)
- **API Endpoint**: Update `API_BASE_URL` in `app.js`
- **Styling**: Modify `styles.css` to match your brand
- **Functionality**: Extend `app.js` for additional features

## Security Notes

⚠️ **Important**: If you hardcode your API key in `app.js`, it will be visible to anyone who views your GitHub repository or the deployed page. For production:

- Use GitHub Secrets with GitHub Actions
- Implement a proxy/backend-for-frontend pattern
- Use environment-specific configuration files (gitignored)

