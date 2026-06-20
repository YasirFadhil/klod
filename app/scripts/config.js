// ===== SUPABASE CONFIG =====
// File ini di-load pertama di semua halaman
const SUPABASE_URL = 'https://qklcdnnooiymdvxbpkou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbGNkbm5vb2l5bWR2eGJwa291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTc0NzUsImV4cCI6MjA5NzUzMzQ3NX0.jDgCdshnpMVGwX3-9DygX_mMUqsjvBnUg6y12xR-Pww';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
