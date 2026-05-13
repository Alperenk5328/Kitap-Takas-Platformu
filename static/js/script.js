// Global değişkenler
let currentUser = null;
let currentSwapRequestId = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function () {
    checkAuthStatus();
    loadBooks();
    setupEventListeners();
});

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const addBookForm = document.getElementById('add-book-form');
    if (addBookForm) addBookForm.addEventListener('submit', handleAddBook);

    const swapResponseForm = document.getElementById('swap-response-form');
    if (swapResponseForm) swapResponseForm.addEventListener('submit', handleSwapResponse);

    const addressForm = document.getElementById('address-form');
    if (addressForm) addressForm.addEventListener('submit', handleAddressSubmit);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', debounce(searchBooks, 300));

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkAuthStatus() {
    fetch('/api/check-auth', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
            currentUser = data.authenticated ? data.user : null;
            updateAuthUI(data.authenticated);
        })
        .catch(() => updateAuthUI(false));
}

function updateAuthUI(authenticated) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const usernameDisplay = document.getElementById('username-display');
    const kitapEkleLink = document.getElementById('kitap-ekle-link');
    const heroRegisterBtn = document.getElementById('hero-register-btn');
    const heroAddBookBtn = document.getElementById('hero-add-book-btn');

    if (authenticated && currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = `Hoş geldin, ${currentUser.username}`;
        if (kitapEkleLink) kitapEkleLink.style.display = 'block';
        if (heroRegisterBtn) heroRegisterBtn.style.display = 'none';
        if (heroAddBookBtn) heroAddBookBtn.style.display = 'inline-block';

        loadMyBooks();
        loadMySwaps();
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (kitapEkleLink) kitapEkleLink.style.display = 'none';
        if (heroRegisterBtn) heroRegisterBtn.style.display = 'inline-block';
        if (heroAddBookBtn) heroAddBookBtn.style.display = 'none';
    }
}

function showLoginModal() { document.getElementById('login-modal').style.display = 'block'; }
function showRegisterModal() { document.getElementById('register-modal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function switchModal() {
    const l = document.getElementById('login-modal');
    const r = document.getElementById('register-modal');
    if (l.style.display === 'block') { l.style.display = 'none'; r.style.display = 'block'; }
    else { r.style.display = 'none'; l.style.display = 'block'; }
}

async function handleLogin(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
            showToast('Giriş başarılı!', 'success');
            closeModal('login-modal');
            checkAuthStatus();
            e.target.reset();
        } else {
            showToast(result.message, 'error');
        }
    } catch { showToast('Giriş işlemi başarısız oldu', 'error'); }
}

async function handleRegister(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
            showToast('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
            closeModal('register-modal');
            switchModal();
            e.target.reset();
        } else {
            showToast(result.message, 'error');
        }
    } catch { showToast('Kayıt işlemi başarısız oldu', 'error'); }
}

async function logout() {
    await fetch('/logout', { credentials: 'include' });
    currentUser = null;
    updateAuthUI(false);
    window.location.reload();
}

// ─── Books ─────────────────────────────────────────────────────────────────────

async function loadBooks() {
    try {
        const res = await fetch('/api/books');
        if (res.ok) displayBooks(await res.json(), 'books-grid');
        else showToast('Kitaplar yüklenemedi', 'error');
    } catch { showToast('Kitaplar yüklenemedi', 'error'); }
}

function displayBooks(books, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (!books || books.length === 0) {
        grid.innerHTML = `<div class="empty-state"><h3>📚 Kitap bulunamadı</h3><p>Henüz kitap eklenmemiş veya arama kriterlerinize uygun kitap yok.</p></div>`;
        return;
    }

    grid.innerHTML = books.map(book => `
        <div class="book-card">
            ${book.photo_url ? `<img src="${escapeHtml(book.photo_url)}" alt="${escapeHtml(book.title)}" class="book-photo" onerror="this.style.display='none'">` : ''}
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author">📝 ${escapeHtml(book.author)}</p>
            ${book.publisher ? `<p class="book-publisher">🏢 ${escapeHtml(book.publisher)}</p>` : ''}
            ${book.genre ? `<span class="book-genre">${getGenreText(book.genre)}</span>` : ''}
            <span class="book-condition">${getConditionText(book.condition)}</span>
            ${book.description ? `<p class="book-description">${escapeHtml(book.description)}</p>` : ''}
            <p class="book-owner">👤 ${escapeHtml(book.owner)}</p>
            <div class="book-actions">
                ${currentUser
                    ? `<button class="btn btn-primary" onclick="requestSwap(${book.id}, this)">🔄 Takas İste</button>`
                    : `<button class="btn btn-outline" onclick="showLoginModal()">🔄 Takas İste (Giriş gerekli)</button>`
                }
            </div>
        </div>
    `).join('');
}

async function handleAddBook(e) {
    e.preventDefault();
    if (!currentUser) { showToast('Kitap eklemek için giriş yapmalısınız', 'error'); showLoginModal(); return; }

    const data = Object.fromEntries(new FormData(e.target));
    try {
        const res = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
            showToast('Kitap başarıyla eklendi!', 'success');
            e.target.reset();
            loadMyBooks();
            loadBooks();
        } else {
            showToast(result.message, 'error');
        }
    } catch { showToast('Kitap eklenemedi', 'error'); }
}

async function loadMyBooks() {
    if (!currentUser) return;
    try {
        const res = await fetch('/api/my-books', { credentials: 'include' });
        if (res.ok) displayMyBooks(await res.json());
    } catch { /* sessiz hata */ }
}

function displayMyBooks(books) {
    const grid = document.getElementById('my-books-grid');
    if (!grid) return;

    if (!books || books.length === 0) {
        grid.innerHTML = `<div class="empty-state"><h3>📚 Henüz kitabınız yok</h3><p>Kitap eklemek için Kitap Ekle sayfasını kullanın.</p></div>`;
        return;
    }

    grid.innerHTML = books.map(book => `
        <div class="book-card">
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author">📝 ${escapeHtml(book.author)}</p>
            ${book.publisher ? `<p class="book-publisher">🏢 ${escapeHtml(book.publisher)}</p>` : ''}
            <span class="book-condition">${getConditionText(book.condition)}</span>
            ${book.description ? `<p class="book-description">${escapeHtml(book.description)}</p>` : ''}
            <p class="book-owner">Durum: ${book.is_available ? '✅ Takasa Açık' : '🔄 Takasta'}</p>
        </div>
    `).join('');
}

// ─── Swap Requests ─────────────────────────────────────────────────────────────

async function requestSwap(bookId, btn) {
    if (!currentUser) { showToast('Takas isteği için giriş yapmalısınız', 'error'); showLoginModal(); return; }

    // Önce kullanıcının takasa açık kitabı olup olmadığını kontrol et
    try {
        const checkRes = await fetch('/api/my-books', { credentials: 'include' });
        if (checkRes.ok) {
            const myBooks = await checkRes.json();
            const hasAvailable = Array.isArray(myBooks) && myBooks.some(b => b.is_available);
            if (!hasAvailable) {
                showToast('Takas isteği gönderebilmek için önce takasa açık en az bir kitabınız olmalı', 'error');
                return;
            }
        }
    } catch { /* backend de kontrol ediyor, devam et */ }

    // Butonu devre dışı bırak — çift tıklamayı önler
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Gönderiliyor...'; }

    try {
        const res = await fetch('/api/swap-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requested_book_id: bookId }),
            credentials: 'include'
        });
        const result = await res.json();

        if (result.success) {
            showToast('Takas isteği gönderildi!', 'success');
            if (btn) { btn.textContent = '✅ İstek Gönderildi'; }
            loadMySwaps();
        } else {
            showToast(result.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = '🔄 Takas İste'; }
        }
    } catch {
        showToast('Takas isteği gönderilemedi', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '🔄 Takas İste'; }
    }
}

// ─── My Swaps ─────────────────────────────────────────────────────────────────

async function loadMySwaps() {
    if (!currentUser) return;
    try {
        const res = await fetch('/api/my-swaps', { credentials: 'include' });
        if (res.ok) displaySwaps(await res.json());
    } catch { /* sessiz hata */ }
}

function displaySwaps(swaps) {
    const content = document.getElementById('swaps-content');
    if (!content) return;

    if (!swaps || swaps.length === 0) {
        content.innerHTML = `<div class="empty-state"><h3>🔄 Henüz takasınız yok</h3><p>Kitapları keşfederek takas isteği gönderebilirsiniz.</p></div>`;
        return;
    }

    const sentSwaps = swaps.filter(s => s.type === 'sent');
    const receivedSwaps = swaps.filter(s => s.type === 'received');
    const activeTab = document.querySelector('.tab-btn.active')?.textContent || '';
    displaySwapList(activeTab.includes('Gönderilen') ? sentSwaps : receivedSwaps, content);
}

function displaySwapList(swaps, container) {
    if (!swaps || swaps.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>🔄 Takas bulunamadı</h3><p>Bu kategoride henüz takasınız yok.</p></div>`;
        return;
    }

    container.innerHTML = swaps.map(swap => {
        const isMatched = swap.status === 'eslesti';
        const addressSection = isMatched ? buildAddressSection(swap) : '';

        return `
        <div class="swap-item ${isMatched ? 'swap-matched' : ''}">
            <div class="swap-header">
                <div>
                    <strong>${swap.type === 'sent' ? 'Gönderdiğiniz' : 'Aldığınız'} İstek</strong><br>
                    <small>${swap.type === 'sent' ? `Alıcı: ${escapeHtml(swap.receiver)}` : `Gönderen: ${escapeHtml(swap.requester)}`}</small>
                </div>
                <span class="swap-status status-${swap.status}">${getStatusText(swap.status)}</span>
            </div>
            <div class="swap-books">
                <div class="swap-book">
                    <strong>İstenen Kitap:</strong> ${escapeHtml(swap.requested_book.title)} — ${escapeHtml(swap.requested_book.author)}
                </div>
                ${swap.offered_book ? `
                    <div class="swap-book">
                        <strong>Karşılık Kitap:</strong> ${escapeHtml(swap.offered_book.title)} — ${escapeHtml(swap.offered_book.author)}
                    </div>` : ''}
            </div>
            ${swap.type === 'received' && swap.status === 'beklemede' ? `
                <div class="swap-actions">
                    <button class="btn btn-primary" onclick="showSwapResponseModal(${swap.id}, '${escapeHtml(swap.requested_book.title)}', ${swap.requester_id})">Yanıtla</button>
                </div>` : ''}
            ${addressSection}
        </div>`;
    }).join('');
}

/* Eşleşmiş takaslarda adres panelini oluşturur */
function buildAddressSection(swap) {
    const bothReady = swap.other_address !== undefined; // backend her ikisi hazırsa diğerini de gönderir

    let html = `<div class="address-section">`;
    html += `<div class="address-section-title">📦 Teslimat Bilgileri</div>`;

    if (swap.address_submitted) {
        // Kendi bilgileri kaydedilmiş
        html += `
            <div class="address-mine saved">
                <span class="address-badge">✅ Bilgileriniz kaydedildi</span>
                <p><strong>Adresiniz:</strong> ${escapeHtml(swap.my_address || '')}</p>
                ${swap.my_phone ? `<p><strong>Telefonunuz:</strong> ${escapeHtml(swap.my_phone)}</p>` : ''}
            </div>`;
    } else {
        // Henüz girilmemiş — form göster
        html += `
            <div class="address-mine">
                <p class="address-hint">Kitabı gönderebilmek için adres ve telefon bilginizi girin. Karşı taraf da girince bilgiler karşılıklı paylaşılır.</p>
                <div class="address-inline-form" id="addr-form-${swap.id}">
                    <input type="text" id="addr-input-${swap.id}" placeholder="Tam adresiniz (mahalle, cadde, no, şehir)" class="addr-input">
                    <input type="text" id="phone-input-${swap.id}" placeholder="Telefon (isteğe bağlı)" class="addr-input addr-input-phone">
                    <button class="btn btn-primary btn-sm" onclick="submitAddress(${swap.id})">💾 Kaydet</button>
                </div>
            </div>`;
    }

    if (bothReady) {
        html += `
            <div class="address-other">
                <span class="address-badge address-badge-other">📬 Karşı Tarafın Bilgileri</span>
                <p><strong>Adres:</strong> ${escapeHtml(swap.other_address)}</p>
                ${swap.other_phone ? `<p><strong>Telefon:</strong> ${escapeHtml(swap.other_phone)}</p>` : ''}
            </div>`;
    } else if (swap.address_submitted) {
        html += `<div class="address-waiting"><span class="address-badge address-badge-waiting">⏳ Karşı tarafın bilgilerini girmesi bekleniyor…</span></div>`;
    }

    html += `</div>`;
    return html;
}

async function submitAddress(swapId) {
    const address = document.getElementById(`addr-input-${swapId}`)?.value.trim();
    const phone = document.getElementById(`phone-input-${swapId}`)?.value.trim();

    if (!address) { showToast('Lütfen adresinizi girin', 'error'); return; }

    try {
        const res = await fetch('/api/swap-address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ swap_id: swapId, address, phone }),
            credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.both_ready ? '🎉 Her iki taraf hazır! Bilgiler paylaşıldı.' : '✅ Adresiniz kaydedildi', 'success');
            loadMySwaps(); // paneli yenile
        } else {
            showToast(result.message, 'error');
        }
    } catch { showToast('Adres kaydedilemedi', 'error'); }
}

// ─── Swap Response Modal ───────────────────────────────────────────────────────

// currentRequesterId global olarak saklanır — handleSwapResponse içinde kullanılmaz
// ama loadRequesterBooksForSelect için gerekli
let currentRequesterId = null;

function showSwapResponseModal(swapId, requestedBookTitle, requesterId) {
    currentSwapRequestId = swapId;
    currentRequesterId = requesterId;

    document.getElementById('swap-request-details').innerHTML = `
        <p><strong>İstenen Kitap:</strong> ${escapeHtml(requestedBookTitle)}</p>
        <p class="modal-hint">Karşı tarafın takasa açık kitaplarından birini seçin — seçtiğiniz kitap size gelecek.</p>`;

    // Sol panel: bilgi amaçlı liste (requester'ın kitapları — sadece görsel)
    loadRequesterBooksPanel(requesterId);
    // Sağ panel select: aynı kitaplar ama seçilebilir dropdown
    loadRequesterBooksForSelect(requesterId);

    document.getElementById('swap-response-modal').style.display = 'block';
}

// Sol panel — sadece görüntüleme
async function loadRequesterBooksPanel(requesterId) {
    const panel = document.getElementById('requester-books-panel');
    if (!panel) return;
    panel.innerHTML = '<p class="loading-text">⏳ Yükleniyor…</p>';
    try {
        const res = await fetch(`/api/user-books/${requesterId}`, { credentials: 'include' });
        if (!res.ok) { panel.innerHTML = '<p class="panel-empty">Kitaplar yüklenemedi.</p>'; return; }
        const books = await res.json();
        if (!books.length) {
            panel.innerHTML = '<p class="panel-empty">Takasa açık kitap yok.</p>';
            return;
        }
        panel.innerHTML = books.map(b => `
            <div class="mini-book-card">
                <strong>${escapeHtml(b.title)}</strong>
                <span>${escapeHtml(b.author)}</span>
                <span class="book-condition">${getConditionText(b.condition)}</span>
                ${b.description ? `<span class="mini-book-desc">${escapeHtml(b.description)}</span>` : ''}
            </div>`).join('');
    } catch {
        panel.innerHTML = '<p class="panel-empty">Kitaplar yüklenemedi.</p>';
    }
}

// Sağ panel select — receiver hangisini istediğini seçiyor (requester'ın kitapları)
async function loadRequesterBooksForSelect(requesterId) {
    const select = document.getElementById('offered-book');
    select.innerHTML = '<option value="">⏳ Yükleniyor…</option>';
    select.disabled = true;
    try {
        const res = await fetch(`/api/user-books/${requesterId}`, { credentials: 'include' });
        if (!res.ok) { select.innerHTML = '<option value="">Yüklenemedi</option>'; return; }
        const books = await res.json();
        if (!books.length) {
            select.innerHTML = '<option value="">Karşı tarafın takasa açık kitabı yok</option>';
        } else {
            select.innerHTML = '<option value="">— İstediğiniz kitabı seçin —</option>' +
                books.map(b => `<option value="${b.id}">${escapeHtml(b.title)} — ${escapeHtml(b.author)} (${getConditionText(b.condition)})</option>`).join('');
            select.disabled = false;
        }
    } catch {
        select.innerHTML = '<option value="">Yüklenemedi</option>';
    }
}

// Artık kullanılmıyor; bozulmasın diye boş
async function loadRequesterBooks() {}
async function loadMyBooksForSwap() {}

async function handleSwapResponse(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        const res = await fetch('/api/swap-respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ swap_request_id: currentSwapRequestId, offered_book_id: data.offered_book, action: 'accept' }),
            credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
            showToast('🎉 Takas eşleşti! Adres bilgilerinizi girin.', 'success');
            closeModal('swap-response-modal');
            loadMySwaps();
            loadMyBooks();
            // Takaslar sekmesine otomatik scroll
            setTimeout(() => {
                document.getElementById('takaslar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Alınan İstekler tabını aktif yap (kabul eden receiver)
                showTab('received');
            }, 400);
        } else {
            showToast(result.message, 'error');
        }
    } catch { showToast('Takas yanıtı gönderilemedi', 'error'); }
}

async function respondToSwap(action) {
    try {
        const res = await fetch('/api/swap-respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ swap_request_id: currentSwapRequestId, action }),
            credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
            showToast('Takas isteği reddedildi', 'info');
            closeModal('swap-response-modal');
            loadMySwaps();
        } else {
            showToast(result.message, 'error');
        }
    } catch { showToast('İşlem başarısız oldu', 'error'); }
}

// ─── Search & Tabs ─────────────────────────────────────────────────────────────

async function searchBooks() {
    const query = document.getElementById('search-input')?.value || '';
    const genre = document.getElementById('genre-filter')?.value || '';
    try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (genre) params.append('genre', genre);
        const res = await fetch(`/api/search-books?${params}`);
        displayBooks(await res.json(), 'books-grid');
    } catch { showToast('Arama yapılamadı', 'error'); }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const idx = tabName === 'sent' ? 0 : 1;
    document.querySelectorAll('.tab-btn')[idx]?.classList.add('active');
    loadMySwaps();
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function getConditionText(c) {
    return {'yeni':'Yeni','iyi':'İyi','yipranmis':'Yıpranmış','cok-iyi':'Çok İyi'}[c] || c;
}
function getStatusText(s) {
    return {'beklemede':'Beklemede','eslesti':'Eşleşti ✅','reddedildi':'Reddedildi','iptal':'İptal'}[s] || s;
}
function getGenreText(g) {
    const map = {roman:'Roman',hikaye:'Hikaye',bilim:'Bilim',tarih:'Tarih',felsefe:'Felsefe',
        siyaset:'Siyaset',ekonomi:'Ekonomi',psikoloji:'Psikoloji',cocuk:'Çocuk',
        genclik:'Gençlik',biyografi:'Biyografi',sanat:'Sanat',spor:'Spor',diger:'Diğer'};
    return map[g] || g;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function debounce(func, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => func(...args), wait); };
}

window.onclick = function (e) {
    document.querySelectorAll('.modal').forEach(m => {
        if (e.target === m) m.style.display = 'none';
    });
};