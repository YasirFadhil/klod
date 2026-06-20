// ===== HELPER: Format ukuran file =====
function formatSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== HELPER: Format tanggal =====
function formatDate(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}


// ===== AMBIL ELEMENT HTML =====
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('upload-status');
const fileList = document.getElementById('file-list');

// Modal preview
const previewModal = document.getElementById('preview-modal');
const previewImg = document.getElementById('preview-img');
const previewFilename = document.getElementById('preview-filename');
const previewClose = document.getElementById('preview-close');
const previewBackdrop = document.getElementById('preview-backdrop');

// ===== HELPER: Cek apakah file gambar =====
function isImage(fileName) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
}

// ===== CEK AUTH =====
// Jalankan saat halaman dibuka — kalau belum login, tendang ke auth.html
async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = './auth.html';
        return;
    }

    // Tampilkan email user di navbar
    userEmailEl.textContent = session.user.email;

    // Load daftar file
    loadFiles(session.user.id);
}

// ===== UPLOAD FILE =====
uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];

    if (!file) {
        uploadStatus.textContent = 'Pilih file dulu!';
        return;
    }

    uploadStatus.textContent = 'Mengupload...';

    const { data: { session } } = await supabaseClient.auth.getSession();
    const userId = session.user.id;

    // Simpan file di folder berdasarkan user ID supaya tiap user punya folder sendiri
    const filePath = `${userId}/${file.name}`;

    const { error } = await supabaseClient.storage
        .from('files_gabut')
        .upload(filePath, file, { upsert: true }); // upsert: true = timpa kalau nama sama

    if (error) {
        uploadStatus.textContent = 'Upload gagal: ' + error.message;
    } else {
        uploadStatus.textContent = 'Upload berhasil!';
        fileInput.value = ''; // reset input file
        loadFiles(userId);    // refresh daftar file
    }
});

// ===== LOAD DAFTAR FILE =====
async function loadFiles(userId) {
    fileList.innerHTML = 'Memuat file...';

    const { data, error } = await supabaseClient.storage
        .from('files_gabut')
        .list(userId); // ambil file di folder milik user ini

    if (error) {
        fileList.innerHTML = 'Gagal memuat file.';
        return;
    }

    if (data.length === 0) {
        fileList.innerHTML = '<p>Belum ada file.</p>';
        return;
    }

    // Tampilkan tiap file sebagai item di list
    fileList.innerHTML = '';
    data.forEach(file => {
        const size = formatSize(file.metadata?.size);
        const date = formatDate(file.created_at);
        const image = isImage(file.name);
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-info">
                ${image ? `<div class="file-thumb" onclick="previewFile('${userId}', '${file.name}')"></div>` : `<div class="file-icon">📄</div>`}
                <div>
                    <span class="file-name">${file.name}</span>
                    <span class="file-meta">${size} · ${date}</span>
                </div>
            </div>
            <div class="file-actions">
                ${image ? `<button onclick="previewFile('${userId}', '${file.name}')">Preview</button>` : ''}
                <button onclick="downloadFile('${userId}', '${file.name}')">Download</button>
                <button class="btn-danger" onclick="deleteFile('${userId}', '${file.name}')">Hapus</button>
            </div>
        `;

        // Load thumbnail untuk gambar
        if (image) {
            loadThumbnail(userId, file.name, item.querySelector('.file-thumb'));
        }

        fileList.appendChild(item);
    });
}

// ===== DOWNLOAD FILE =====
async function downloadFile(userId, fileName) {
    const { data, error } = await supabaseClient.storage
        .from('files_gabut')
        .download(`${userId}/${fileName}`);

    if (error) {
        alert('Download gagal: ' + error.message);
        return;
    }

    // Buat link download sementara lalu klik otomatis
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== HAPUS FILE =====
async function deleteFile(userId, fileName) {
    const konfirmasi = confirm(`Hapus file "${fileName}"?`);
    if (!konfirmasi) return;

    const { error } = await supabaseClient.storage
        .from('files_gabut')
        .remove([`${userId}/${fileName}`]);

    if (error) {
        alert('Hapus gagal: ' + error.message);
    } else {
        loadFiles(userId); // refresh list
    }
}

// ===== LOAD THUMBNAIL =====
async function loadThumbnail(userId, fileName, el) {
    const { data } = await supabaseClient.storage
        .from('files_gabut')
        .createSignedUrl(`${userId}/${fileName}`, 60);

    if (data?.signedUrl) {
        el.style.backgroundImage = `url('${data.signedUrl}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
    }
}

// ===== PREVIEW GAMBAR =====
async function previewFile(userId, fileName) {
    const { data } = await supabaseClient.storage
        .from('files_gabut')
        .createSignedUrl(`${userId}/${fileName}`, 300);

    if (data?.signedUrl) {
        previewImg.src = data.signedUrl;
        previewFilename.textContent = fileName;
        previewModal.classList.add('open');
    }
}

// Tutup modal
previewClose.addEventListener('click', closePreview);
previewBackdrop.addEventListener('click', closePreview);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePreview(); });

function closePreview() {
    previewModal.classList.remove('open');
    previewImg.src = '';
}

// ===== LOGOUT =====
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = './auth.html';
});

// ===== MULAI =====
init();
