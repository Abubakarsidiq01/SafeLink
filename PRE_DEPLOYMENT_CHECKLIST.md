# Pre-Deployment Checklist

Use this checklist to verify all features work before deploying to Render.

## ✅ Configuration Fixes Completed

- [x] Updated all API files to use `VITE_API_BASE_URL` environment variable
- [x] Fixed CORS configuration in server to support production URLs
- [x] Updated server to use `PORT` from environment variable
- [x] Added data directory initialization in server startup
- [x] Created `render.yaml` for Render deployment
- [x] Updated `package.json` with Node.js engine requirements
- [x] Created deployment documentation

## 🧪 Feature Testing Checklist

### Voice Features
- [ ] **Request Help Modal**: Click microphone button, speak, verify auto-stop
- [ ] **Find Shelter**: Test voice input for emergency description
- [ ] **First Aid Guide**: Test voice input for medical situation
- [ ] **Status Update Modal**: Test voice input for status messages
- [ ] Verify speech-to-text transcription appears correctly
- [ ] Verify microphone permissions are requested properly

### Image Features
- [ ] **First Aid Guide**: Enter medical situation, verify images display
- [ ] **Image Generation**: Check that SVG images are generated for each step
- [ ] **Image Caching**: Verify images are cached (check network tab)
- [ ] **Fallback Images**: Verify default images show if generation fails

### Button Functionality
- [ ] **Navigation**: All sidebar navigation buttons work
- [ ] **Modal Buttons**: Open/close modals work correctly
- [ ] **Form Buttons**: Submit buttons work (Request Help, Find Shelter, etc.)
- [ ] **Action Buttons**: Update status, refresh location, etc.
- [ ] **Voice Buttons**: Microphone toggle buttons work
- [ ] **Map Buttons**: Zoom, pan, marker clicks work

### API Endpoints
- [ ] **Health Check**: `GET /health` returns OK
- [ ] **Help Requests**: Create, fetch, update status
- [ ] **Rescue Stats**: Fetch statistics
- [ ] **First Aid**: Get instructions with images
- [ ] **Medical AI**: Process text and audio
- [ ] **Routes**: Find shelters and get directions
- [ ] **Peers**: Fetch and register peers
- [ ] **Messages**: Send and fetch messages

### Location Services
- [ ] **Auto-detection**: Location detected automatically
- [ ] **Refresh Location**: Manual refresh button works
- [ ] **Address Display**: Reverse geocoding shows address
- [ ] **Location Updates**: Location updates in real-time

### UI/UX
- [ ] **Responsive Design**: Works on different screen sizes
- [ ] **Loading States**: Loading indicators show correctly
- [ ] **Error Messages**: Error messages display properly
- [ ] **Success Messages**: Success notifications appear
- [ ] **Form Validation**: Required fields validated
- [ ] **Disabled States**: Buttons disabled when appropriate

## 🔧 Local Testing Commands

### Start Backend
```bash
cd server
npm install
npm start
# Should start on http://localhost:4000
```

### Start Frontend
```bash
cd safelink-dashboard
npm install
npm run dev
# Should start on http://localhost:5173
```

### Test Backend Health
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","ts":"..."}
```

### Test API Endpoint
```bash
curl -X POST http://localhost:4000/api/help-requests \
  -H "Content-Type: application/json" \
  -d '{"message":"Test help request","latitude":37.7749,"longitude":-122.4194,"address":"Test Location"}'
```

## 🚀 Ready for Deployment

Once all items above are checked, you're ready to deploy to Render!

### Next Steps:
1. Push all changes to GitHub
2. Follow `DEPLOYMENT.md` guide
3. Set environment variables in Render
4. Deploy backend first, then frontend
5. Update CORS with actual frontend URL
6. Test deployed services

## ⚠️ Common Issues to Watch For

1. **CORS Errors**: Make sure `FRONTEND_URL` matches exactly
2. **API Connection**: Verify `VITE_API_BASE_URL` is set correctly
3. **Voice Not Working**: Requires HTTPS (Render provides this)
4. **Images Not Loading**: Check network tab, verify image generation service
5. **Location Not Working**: Requires HTTPS and user permission
6. **Environment Variables**: All must be set in Render dashboard

---

**Status**: Ready for deployment ✅

