# Render Service Update Guide - Step by Step

## 🎯 Goal
Update your Render service settings to fix the deployment issue.

## 📋 Step-by-Step Instructions

### Step 1: Access Your Render Dashboard
1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Sign in to your account
3. You should see your **SafeLink** service listed

### Step 2: Open Service Settings
1. Click on your **SafeLink** service (the one that's currently failing)
2. In the service page, look for the **"Settings"** tab in the top navigation
3. Click on **"Settings"**

### Step 3: Update Service Configuration

Scroll down to find these sections and update them:

#### **Root Directory**
- **Field Name**: "Root Directory" or "Working Directory"
- **Current Value**: (probably empty or `/`)
- **New Value**: `server`
- **What it does**: Tells Render to run commands from the `server` directory

#### **Build Command**
- **Field Name**: "Build Command"
- **Current Value**: (might be `yarn` or empty)
- **New Value**: `npm install`
- **What it does**: Installs all dependencies before deployment

#### **Start Command**
- **Field Name**: "Start Command"
- **Current Value**: `scripts\start.bat` or `npm run start`
- **New Value**: `npm start`
- **What it does**: Starts your Node.js server

### Step 4: Save Changes
1. Scroll to the bottom of the Settings page
2. Click the **"Save Changes"** button
3. Wait for confirmation that settings are saved

### Step 5: Manual Deploy
1. Go back to the main service page (click on your service name or "Overview" tab)
2. Look for the **"Manual Deploy"** button (usually in the top right)
3. Click **"Manual Deploy"**
4. Select **"Deploy latest commit"** or **"Deploy commit: 3353765"** (the latest one)
5. Click **"Deploy"**

### Step 6: Monitor Deployment
1. Watch the **"Logs"** tab to see the deployment progress
2. You should see:
   - ✅ Cloning repository
   - ✅ Installing dependencies (`npm install`)
   - ✅ Starting server (`npm start`)
   - ✅ Build successful
3. Wait for the service to become **"Live"**

## ✅ Expected Results

After successful deployment, you should see:

### In Logs:
```
==> Cloning from https://github.com/Abubakarsidiq01/SafeLink
==> Running build command 'npm install'
==> Build successful 🎉
==> Running 'npm start'
[SafeLink][Server] 🌐 Listening on port 10000
[SafeLink][Server] 🌍 Environment: production
```

### Service Status:
- Status: **Live** (green indicator)
- URL: `https://safelink-tvrz.onrender.com` (or your custom URL)
- Health Check: Should pass

## 🧪 Test Your Deployment

Once deployed, test the health endpoint:

```bash
curl https://safelink-tvrz.onrender.com/health
```

Expected response:
```json
{"status":"ok","ts":"2025-11-25T..."}
```

Or open in browser:
```
https://safelink-tvrz.onrender.com/health
```

## ⚠️ Troubleshooting

### If you can't find "Root Directory" field:
- Some Render interfaces call it "Working Directory"
- It might be under "Advanced Settings"
- If not available, the `render.yaml` configuration should handle it

### If deployment still fails:
1. Check the **Logs** tab for error messages
2. Verify all three settings are saved correctly
3. Make sure you're deploying the latest commit (3353765)

### If service won't start:
- Check that `server/package.json` has `"start": "node index.js"`
- Verify PORT environment variable is set (Render sets this automatically)
- Check logs for specific error messages

## 📝 Settings Summary

Here's what your settings should look like:

| Setting | Value |
|---------|-------|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |
| **Node Version** | `22.16.0` (or latest) |

## 🔄 Alternative: Recreate Service

If updating settings doesn't work, you can:

1. **Delete** the current service
2. **Create New** → **Web Service**
3. Connect your GitHub repo: `Abubakarsidiq01/SafeLink`
4. Render will auto-detect `render.yaml` and configure everything correctly

---

**Need Help?** Check Render's documentation: [https://render.com/docs](https://render.com/docs)

