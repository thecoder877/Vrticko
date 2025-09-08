# Vrtićko - Preschool Management System

A modern web application for preschool management built with React, TypeScript, and Supabase.

## Features

### For Parents
- View daily and weekly menu
- Receive notifications (trips, illnesses, holidays)
- View child's attendance records
- Direct notes from teachers
- Photo gallery (Phase II)

### For Teachers
- Record children's attendance (check-in/check-out)
- Send mass and individual notifications to parents
- Write notes to parents about children
- Manage activity schedule
- View menu

### For Administration
- User management (add parents, teachers, children)
- Menu management (create and edit)
- Activity schedule management
- Notification management
- Statistics (attendance, activity, technical usage)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

4. Create environment file:
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   
   **Important**: You need the service role key for admin operations (user management).
   Get these values from your Supabase project dashboard:
   - Go to Settings > API
   - Copy the Project URL for VITE_SUPABASE_URL
   - Copy the anon public key for VITE_SUPABASE_ANON_KEY
   - Copy the service_role secret key for VITE_SUPABASE_SERVICE_ROLE_KEY

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Schema

The application uses the following main tables:

- `users` - User accounts with roles (parent, teacher, admin)
- `children` - Children linked to parent users
- `attendance` - Daily attendance records
- `notifications` - System notifications
- `menu` - Daily meal plans
- `notes` - Teacher notes for parents
- `schedule` - Activity schedules

## User Roles

- **Parent**: Can view their child's information, menu, attendance, and notes
- **Teacher**: Can manage attendance, send notifications, write notes, manage schedule
- **Admin**: Full system access including user management and statistics

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── lib/               # Utilities and configurations
├── pages/             # Page components
└── App.tsx            # Main app component
```

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your preferred hosting service (Vercel, Netlify, etc.)

3. Make sure to set your environment variables in your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of a master's thesis on preschool management systems.