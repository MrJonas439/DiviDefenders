import { createClient } from '@supabase/supabase-js'

// 🔑 These are your project's unique door keys to Supabase!
const supabaseUrl = 'https://byikfwzorxxnqmqxmcgz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aWtmd3pvcnh4bnFtcXhtY2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzIyMzQsImV4cCI6MjA5MDEwODIzNH0.kYUm8E_nLiXl9AeHyoxy28RSlRTjyACMsIYW02d0Y44'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
