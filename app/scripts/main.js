// ===== AUTH CHECK (Landing Page) =====
// Kalau user sudah login (atau baru konfirmasi email), redirect ke dashboard

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        window.location.href = './dashboard.html';
    }
});
