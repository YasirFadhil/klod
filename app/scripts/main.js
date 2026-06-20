// ===== AUTH CHECK (Landing Page) =====
// Kalau user sudah login, langsung redirect ke dashboard
async function checkAuthAndRedirect() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // Sudah login → ke dashboard
        window.location.href = './dashboard.html';
    }
}

checkAuthAndRedirect();
