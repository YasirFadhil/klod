// ===== AMBIL ELEMENT DARI HTML =====
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toRegister = document.getElementById('to-register');
const toLogin = document.getElementById('to-login');


// ===== TOGGLE: Login ↔ Register =====
// Klik "Belum punya akun?" → tampilkan form register
toRegister.addEventListener('click', (e) => {
    e.preventDefault(); // supaya link # tidak scroll ke atas
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

// Klik "Sudah punya akun?" → tampilkan form login
toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// ===== LOGIN =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // mencegah halaman reload saat form disubmit

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert('Login gagal: ' + error.message);
    } else {
        // Berhasil login → redirect ke dashboard
        window.location.href = './dashboard.html';
    }
});

// ===== REGISTER =====
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-password-confirm').value;

    if (password !== confirm) {
        alert('Password dan konfirmasi password tidak sama!');
        return;
    }

    if (password.length < 6) {
        alert('Password minimal 6 karakter!');
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        alert('Daftar gagal: ' + error.message);
    } else {
        alert('Berhasil daftar! Cek email kamu untuk konfirmasi.');
    }
});
