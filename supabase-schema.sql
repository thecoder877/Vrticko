-- Create users table (profiles table for additional user data)
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin')),
  email TEXT,
  temp_password TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create children table
CREATE TABLE public.children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, date)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  target TEXT NOT NULL, -- 'all', 'parents', 'teachers', or specific parent_id
  read_status JSONB DEFAULT '{}'
);

-- Create menu table
CREATE TABLE public.menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  breakfast TEXT NOT NULL,
  lunch TEXT NOT NULL,
  snack TEXT NOT NULL,
  dinner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule table
CREATE TABLE public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  activity TEXT NOT NULL,
  group_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_status JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Parents can read their children
CREATE POLICY "Parents can read own children" ON public.children
  FOR SELECT USING (auth.uid() = parent_id);

-- Teachers and admins can read all children
CREATE POLICY "Teachers and admins can read all children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Parents can read attendance for their children
CREATE POLICY "Parents can read own children attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE id = child_id AND parent_id = auth.uid()
    )
  );

-- Teachers and admins can manage attendance
CREATE POLICY "Teachers and admins can manage attendance" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Everyone can read notifications
CREATE POLICY "Everyone can read notifications" ON public.notifications
  FOR SELECT USING (true);

-- Teachers and admins can create notifications
CREATE POLICY "Teachers and admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Everyone can read menu
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

-- Admins can manage menu
CREATE POLICY "Admins can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Parents can read notes about their children
CREATE POLICY "Parents can read notes about own children" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE id = child_id AND parent_id = auth.uid()
    )
  );

-- Teachers can create notes
CREATE POLICY "Teachers can create notes" ON public.notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Everyone can read schedule
CREATE POLICY "Everyone can read schedule" ON public.schedule
  FOR SELECT USING (true);

-- Teachers and admins can manage schedule
CREATE POLICY "Teachers and admins can manage schedule" ON public.schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Users can read their own messages (sent or received)
CREATE POLICY "Users can read own messages" ON public.chat_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Users can create messages
CREATE POLICY "Users can create messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- Users can update read status of messages they received
CREATE POLICY "Users can update read status" ON public.chat_messages
  FOR UPDATE USING (
    receiver_id = auth.uid()
  );

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, role)
  VALUES (NEW.id, NEW.email, 'parent'); -- Default role is parent
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
