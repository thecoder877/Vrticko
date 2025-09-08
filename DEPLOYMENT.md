# Vrticko App - Deployment Guide

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## GitHub Deployment

1. Initialize Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Add remote and push:
   ```bash
   git remote add origin https://github.com/yourusername/vrticko-app.git
   git branch -M main
   git push -u origin main
   ```

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`
3. Deploy!

## Build Commands

- Development: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
