// supabase.ts

// Re-export samo regularnog klijenta
export { supabase } from './supabase-client'

// Database types
export interface User {
  id: string
  username: string
  role: 'parent' | 'teacher' | 'admin'
  email?: string
  temp_password?: string
  auth_user_id?: string
  created_at: string
}

export interface Child {
  id: string
  name: string
  parent_id: string
  birth_date?: string
  group_name?: string
  gender?: 'muški' | 'ženski'
  allergies?: string
  additional_notes?: string
  photo_url?: string
  personal_id?: string
  created_at: string
  users?: { username: string }
}

export interface Attendance {
  id: string
  child_id: string
  date: string
  status: 'present' | 'absent'
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  created_at: string
  created_by: string
  target: 'all' | 'parents' | 'teachers' | string
  read_status?: Record<string, string>
}

export interface Menu {
  id: string
  date: string
  breakfast: string
  lunch: string
  snack: string
  dinner?: string
  created_at: string
}

export interface Note {
  id: string
  child_id: string
  teacher_id: string
  message: string
  created_at: string
}

export interface Schedule {
  id: string
  date: string
  activity: string
  group: string
  group_name: string
  created_at: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  read_status?: Record<string, string>
  sender?: {
    username: string
    role: string
  }
}
