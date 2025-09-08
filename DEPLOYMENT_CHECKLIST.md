# Vrticko App - Deployment Checklist

## ✅ Pre-deployment Steps
- [x] Git repository initialized
- [x] .gitignore configured
- [x] vercel.json created
- [x] DEPLOYMENT.md created

## 🔄 GitHub Setup
- [ ] Create GitHub repository
- [ ] Add remote origin: `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
- [ ] Push code: `git push -u origin main`

## 🚀 Vercel Setup
- [ ] Sign up/Login to Vercel
- [ ] Import GitHub repository
- [ ] Add environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY`
- [ ] Deploy project

## ✅ Post-deployment
- [ ] Test live URL
- [ ] Verify authentication works
- [ ] Test push notifications
- [ ] Check all pages load correctly

## 🔧 Environment Variables Needed
```env
VITE_SUPABASE_URL=https://bylgwspkjtgcasuldgeq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📝 Notes
- Make sure to replace the placeholder keys with your actual Supabase keys
- The app uses Supabase for authentication and database
- Push notifications require proper VAPID keys setup
