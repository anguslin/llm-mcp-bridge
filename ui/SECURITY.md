# Security Guide for GitHub Pages Deployment

## ⚠️ Important Security Consideration

**GitHub Pages serves static files only.** Any API key stored in client-side JavaScript (`app.js`) will be **visible to anyone** who:
- Views your GitHub repository
- Inspects the page source in a browser
- Uses browser developer tools

## Security Options

### Option 1: Backend Proxy (Recommended for Production)

Create a lightweight proxy endpoint on your backend that handles authentication server-side.

**Backend changes needed:**
```javascript
// Add to backend/routes/chat.js or create a new proxy route
router.post('/api/proxy/chat', async (req, res) => {
  // Backend uses its own API_KEY internally
  // Frontend doesn't need to send API_KEY
  const userId = req.headers['x-user-id'] || 'anonymous';
  const { message } = req.body;
  
  // Process the request using backend's API_KEY
  // ... existing chat logic
});
```

**Frontend changes:**
```javascript
// No API_KEY needed in frontend
const response = await fetch(`${API_BASE_URL}/api/proxy/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': USER_ID,
  },
  body: JSON.stringify({ message }),
});
```

**Pros:**
- ✅ API key never exposed to client
- ✅ Full control over authentication
- ✅ Can add rate limiting per user

**Cons:**
- Requires backend changes
- All requests go through your backend

### Option 2: Public API with Rate Limiting (Acceptable for Demo)

If this is a demo/public project, you can:

1. **Use a separate, limited API key** for the public frontend
2. **Implement strict rate limiting** on the backend
3. **Monitor usage** and rotate keys if abused
4. **Add IP-based restrictions** if needed

**Backend changes:**
```javascript
// In backend/middleware/auth.js
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  // Allow public key for GitHub Pages
  const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
  const PRIVATE_API_KEY = process.env.API_KEY;
  
  if (apiKey === PUBLIC_API_KEY || apiKey === PRIVATE_API_KEY) {
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid API key' });
}
```

**Pros:**
- ✅ Simple to implement
- ✅ Can revoke/rotate public key easily

**Cons:**
- ⚠️ Public key is still visible in code
- ⚠️ Vulnerable to abuse if not rate-limited

### Option 3: GitHub Actions Build-Time Injection (Partial Solution)

Use GitHub Actions to inject the API key during build, but note it's still visible in the built JavaScript.

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Inject API Key
        run: |
          sed -i "s|const API_KEY = '.*';|const API_KEY = '${{ secrets.API_KEY }}';|g" ui/app.js
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./ui
```

**Pros:**
- ✅ Key not in source code
- ✅ Can use GitHub Secrets

**Cons:**
- ⚠️ Key still visible in deployed JavaScript
- ⚠️ Anyone can view it in browser dev tools

### Option 4: User Authentication (Most Secure)

Implement user login/authentication:

1. Users create accounts
2. Backend issues session tokens or JWT
3. Frontend stores token (more secure than API key)
4. Backend validates tokens

**Pros:**
- ✅ Most secure
- ✅ Per-user rate limiting
- ✅ Usage tracking

**Cons:**
- Most complex to implement
- Requires authentication system

## Recommended Approach

For a **public demo/project**: Use **Option 2** (Public API Key with rate limiting)

For a **production application**: Use **Option 1** (Backend Proxy) or **Option 4** (User Authentication)

## Current Implementation

The current `app.js` has the API key hardcoded, which means:
- ⚠️ It's visible in the repository
- ⚠️ It's visible in the deployed site
- ⚠️ Anyone can extract and use it

**If you must use this approach:**
1. Create a separate, limited API key for public use
2. Set strict rate limits (e.g., 10 requests/hour per IP)
3. Monitor usage and rotate keys regularly
4. Consider IP-based blocking for abuse

## Best Practices

1. **Never commit real API keys** to public repositories
2. **Use environment-specific keys** (dev, staging, prod)
3. **Rotate keys regularly**
4. **Monitor API usage** for unusual patterns
5. **Implement rate limiting** on the backend
6. **Use HTTPS** for all API calls

