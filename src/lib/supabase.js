import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Отсутствуют переменные окружения Supabase:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? '[СКРЫТО]' : undefined
  })
  throw new Error('Необходимо настроить переменные окружения Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 