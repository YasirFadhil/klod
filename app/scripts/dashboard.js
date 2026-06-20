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
const storageUsageEl = document.getElementById('storage-usage');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('upload-status');
const fileList = document.getElementById('file-list');
const dropZone = document.getElementById('drop-zone');
const progressWrap = document.getElementById('progress-wrap');
const progressBar = document.getElementById('progress-bar');

// Modal preview
const previewModal = document.getElementById('preview-modal');
const previewImg = document.getElementById('preview-img');
const previewFilename = document.getElementById('preview-filename');
const previewClose = document.getElementById('preview-close');
const previewBackdrop = document.getElementById('preview-backdrop');

// Sort state
let currentSort = 'date';
let currentUserId = null;

// ===== HELPER: Cek apakah file gambar =====
function isImage(fileName) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
}

// ===== CEK AUTH =====
async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = './auth.html';
        return;
    }

    currentUserId = session.user.id;
    userEmailEl.textContent = session.user.email;
    loadFiles(currentUserId);
    setupDragAndDrop();
    setupSort();
}

// ===== UPLOAD FILE =====
async function uploadFiles(files) {
    if (!files || files.length === 0) return;

    progressWrap.style.display = 'block';
    progressBar.style.width = '0%';
    uploadStatus.textContent = `Mengupload ${files.length} file...`;

    let uploaded = 0;

    for (const file of files) {
        const filePath = `${currentUserId}/${file.name}`;
        const { error } = await supabaseClient.storage
            .from('files_gabut')
            .upload(filePath, file, { upsert: true });

        if (error) {
            uploadStatus.textContent = `Gagal: ${file.name} — ${error.message}`;
        } else {
            uploaded++;
            progressBar.style.width = `${(uploaded / files.length) * 100}%`;
        }
    }

    uploadStatus.textContent = `${uploaded} dari ${files.length} file berhasil diupload!`;
    fileInput.value = '';
    setTimeout(() => { progressWrap.style.display = 'none'; }, 1500);
    loadFiles(currentUserId);
}

// Trigger upload saat file dipilih lewat input
fileInput.addEventListener('change', () => {
    uploadFiles(fileInput.files);
});

// ===== DRAG & DROP =====
function setupDragAndDrop() {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        uploadFiles(e.dataTransfer.files);
    });
}

// ===== SORT =====
function setupSort() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            loadFiles(currentUserId);
        });
    });
}

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

    // Hitung total usage
    const totalBytes = data.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
    storageUsageEl.textContent = `💾 ${formatSize(totalBytes)} digunakan`;

    // Sort data
    data.sort((a, b) => {
        if (currentSort === 'name') return a.name.localeCompare(b.name);
        if (currentSort === 'size') return (b.metadata?.size || 0) - (a.metadata?.size || 0);
        // default: date (terbaru dulu)
        return new Date(b.created_at) - new Date(a.created_at);
    });

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
