# Backend CORS Configuration Fix

## Problem
Frontend at `https://fixup.ge` and `https://acfd9102-0bd1-441e-9f2b-8f8d9498061d.lovableproject.com` is blocked by CORS when trying to access `https://fuel-prices-backend.onrender.com`.

## Solution

You need to update the backend server CORS configuration to allow requests from your frontend domains.

### For Node.js/Express Backend

1. **Install CORS package** (if not already installed):
```bash
npm install cors
```

2. **Update your server file** (usually `server.js`, `app.js`, or `index.js`):

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration - ADD THIS BEFORE YOUR ROUTES
const allowedOrigins = [
  'https://fixup.ge',
  'https://www.fixup.ge',
  'https://acfd9102-0bd1-441e-9f2b-8f8d9498061d.lovableproject.com',
  'http://localhost:8080',
  'http://localhost:8083',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Your routes go here...
app.get('/api/fuel-prices', (req, res) => {
  // Your code...
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Or Use Environment Variables (Recommended for Render.com)

1. **In your Render.com dashboard**, add environment variable:
   - Key: `ALLOWED_ORIGINS`
   - Value: `https://fixup.ge,https://www.fixup.ge,https://acfd9102-0bd1-441e-9f2b-8f8d9498061d.lovableproject.com`

2. **In your backend code**:
```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:8080']; // Fallback for development

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Your routes...
```

### Simple Solution (For Development Only)

If you just want to test quickly (NOT for production):

```javascript
// WARNING: This allows ALL origins - only use for testing!
app.use(cors({
  origin: '*'
}));
```

## After Making Changes

1. Commit and push changes to your Git repository
2. Render.com will automatically redeploy
3. Wait for deployment to complete
4. Test the frontend again

## Verification

After deployment, test with:
```bash
curl -I https://fuel-prices-backend.onrender.com/api/fuel-prices \
  -H "Origin: https://fixup.ge"
```

You should see in the response headers:
```
Access-Control-Allow-Origin: https://fixup.ge
```

## Common Issues

1. **Forgot to install cors package**: Run `npm install cors`
2. **CORS middleware in wrong position**: Must be BEFORE your routes
3. **Typo in domain names**: Check exact spelling of domains
4. **Missing trailing slash**: `https://fixup.ge/` ≠ `https://fixup.ge`
5. **Render not redeployed**: Check Render dashboard for deployment status
