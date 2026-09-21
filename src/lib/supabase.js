import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY

if (!supabaseUrl || !supabasePublicKey) {
  console.warn('VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLIC_KEY harus diatur di .env')
}

export const supabase = createClient(supabaseUrl || '', supabasePublicKey || '')
