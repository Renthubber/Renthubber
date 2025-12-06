import { createClient } from "@supabase/supabase-js";

// Legge le variabili da .env (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase configuration missing in .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
