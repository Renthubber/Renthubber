
import { createClient } from "@supabase/supabase-js";

// Credenziali fornite
const SUPABASE_URL = "https://upyznglekmynztmydtxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweXpuZ2xla215bnp0bXlkdHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTQyMjIsImV4cCI6MjA3OTI5MDIyMn0.SsXFHjInQ7bihDEmSwLNdoC-Ap9D4K66QmxUwm7kur8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
