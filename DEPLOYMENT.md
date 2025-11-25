# SafeLink Deployment Guide - Render

This guide will help you deploy SafeLink to Render.com.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **API Keys**:
   - Google Gemini API Key (optional, for AI features)
   - Google Maps API Key (optional, for route finding)

## Deployment Steps

### Step 1: Deploy Backend API Server

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `safelink-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (or choose a paid plan)

5. **Environment Variables** (Add these in the Render dashboard):
   ```
   NODE_ENV=production
   PORT=10000
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_MAPS_KEY=your_google_maps_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   FRONTEND_URL=https://safelink-dashboard.onrender.com
   ```

6. Click **"Create Web Service"**
7. Wait for deployment to complete
8. **Copy the service URL** (e.g., `https://safelink-api.onrender.com`)

### Step 2: Deploy Frontend Dashboard

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure the service:
   - **Name**: `safelink-dashboard`
   - **Build Command**: `cd safelink-dashboard && npm install && npm run build`
   - **Publish Directory**: `safelink-dashboard/dist`

4. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://safelink-api.onrender.com
   ```

5. Click **"Create Static Site"**
6. Wait for deployment to complete
7. **Copy the site URL** (e.g., `https://safelink-dashboard.onrender.com`)

### Step 3: Update Backend CORS

1. Go back to your backend service settings
2. Update the `FRONTEND_URL` environment variable with your actual dashboard URL:
   ```
   FRONTEND_URL=https://safelink-dashboard.onrender.com
   ```
3. Redeploy the backend service

### Step 4: Verify Deployment

1. **Test Backend Health**:
   ```bash
   curl https://safelink-api.onrender.com/health
   ```
   Should return: `{"status":"ok","ts":"..."}`

2. **Test Frontend**:
   - Open your dashboard URL in a browser
   - Check browser console for errors
   - Test voice input, buttons, and features

## Features to Test

### ✅ Voice Features
- Click microphone button in "Request Help" modal
- Speak and verify auto-stop after silence
- Check speech-to-text transcription

### ✅ Image Generation
- Go to "First Aid Guide"
- Enter a medical situation
- Verify images are generated/displayed for each step

### ✅ Buttons & Navigation
- Test all navigation buttons
- Test form submission buttons
- Test modal close buttons
- Test refresh location button

### ✅ API Endpoints
- Help requests creation
- Rescue stats fetching
- First aid instructions
- Route finding
- Medical AI processing

## Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check logs in Render dashboard
- Verify `PORT` environment variable is set
- Ensure `node` version is 18+ (check `package.json` engines)

**Problem**: CORS errors
- Verify `FRONTEND_URL` matches your dashboard URL exactly
- Check backend logs for CORS errors

**Problem**: Data directory errors
- The server automatically creates data directories on startup
- Check file permissions in Render logs

### Frontend Issues

**Problem**: API calls fail
- Verify `VITE_API_BASE_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend URL is accessible

**Problem**: Voice not working
- Voice requires HTTPS (Render provides this)
- Check browser permissions for microphone
- Verify browser supports Web Speech API (Chrome/Edge recommended)

**Problem**: Images not loading
- Check network tab for failed image requests
- Verify image generation service is working
- Check backend logs for image generation errors

## Environment Variables Reference

### Backend (`safelink-api`)
```
NODE_ENV=production
PORT=10000
GEMINI_API_KEY=your_key_here (optional)
GOOGLE_MAPS_KEY=your_key_here (optional)
GOOGLE_API_KEY=your_key_here (optional)
FRONTEND_URL=https://safelink-dashboard.onrender.com
```

### Frontend (`safelink-dashboard`)
```
VITE_API_BASE_URL=https://safelink-api.onrender.com
```

## Using render.yaml (Alternative Method)

If you prefer using `render.yaml`:

1. Ensure `render.yaml` is in your repository root
2. In Render Dashboard, click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect and use `render.yaml`
5. Review and deploy both services

## Post-Deployment Checklist

- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] Voice input works (microphone button)
- [ ] Images display in First Aid Guide
- [ ] All buttons are functional
- [ ] Help requests can be created
- [ ] Location detection works
- [ ] API endpoints respond correctly
- [ ] CORS is properly configured
- [ ] Environment variables are set

## Notes

- **Free Tier Limitations**: Render free tier services spin down after 15 minutes of inactivity. First request may be slow.
- **HTTPS**: Render automatically provides HTTPS certificates
- **Data Persistence**: File-based storage works on Render, but data is lost on redeploy. Consider using a database for production.
- **API Keys**: Keep your API keys secure. Never commit them to Git.

## Support

If you encounter issues:
1. Check Render service logs
2. Check browser console (F12)
3. Verify all environment variables are set
4. Test API endpoints directly with curl/Postman

---

**Deployment Status**: ✅ Ready for Render deployment

