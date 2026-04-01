import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase Credentials are missing. Make sure to define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.")
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    // Definimos uma chave única para evitar colisões mortais e locks eternos
    // (Deadlock do cache do navegador, que congela o getSession e o Login)
    storageKey: 'erp_sso_v2', 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
