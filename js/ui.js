/* ============================================
   UI — Page Rendering Functions
   All render functions return HTML strings
   ============================================ */

import { escapeHtml, getInitials, getAvatarClass, getDomain, formatDate, formatTime, timeAgo, getGreeting, daysBetween } from './utils.js';
import { calculatePasswordStrength, getStrengthLabel, getStrengthClass, getStrengthColor, calculateSecurityScore, getSecurityIssues, findWeakPasswords, findReusedPasswords, findOldPasswords } from './security.js';
import { getDefaultGeneratorOptions } from './generator.js';
import { getActionLabel, getActionIcon, getActionDotClass, groupActivitiesByDate } from './activity.js';
import { getActiveItems, getDeletedItems, getFavorites, getCategoryById, getCategoryCounts, sortItems } from './vault.js';


/* ==================== SIDEBAR ==================== */

export function renderSidebar(vault, currentPage) {
  const activeItems = getActiveItems(vault);
  const deletedItems = getDeletedItems(vault);
  const issues = getSecurityIssues(activeItems);
  const totalIssues = issues.reduce((s, i) => s + i.count, 0);

  return `
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">
        <i data-lucide="shield-check"></i>
      </div>
      <span class="sidebar-brand-text">Personal Vault</span>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section">
        <div class="sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}" data-action="navigate" data-page="dashboard">
          <i data-lucide="layout-dashboard"></i>
          <span>Beranda</span>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Vault</div>
        <div class="sidebar-link ${currentPage === 'vault' ? 'active' : ''}" data-action="navigate" data-page="vault">
          <i data-lucide="key-round"></i>
          <span>Semua Akun</span>
          <span class="badge badge-accent">${activeItems.length}</span>
        </div>
        <div class="sidebar-link ${currentPage === 'favorites' ? 'active' : ''}" data-action="navigate" data-page="favorites">
          <i data-lucide="star"></i>
          <span>Favorit</span>
        </div>
        <div class="sidebar-link ${currentPage === 'categories' ? 'active' : ''}" data-action="navigate" data-page="categories">
          <i data-lucide="folder"></i>
          <span>Kategori</span>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Tools</div>
        <div class="sidebar-link ${currentPage === 'generator' ? 'active' : ''}" data-action="navigate" data-page="generator">
          <i data-lucide="wand-2"></i>
          <span>Pembuat Kata Sandi</span>
        </div>
        <div class="sidebar-link ${currentPage === 'security' ? 'active' : ''}" data-action="navigate" data-page="security">
          <i data-lucide="shield-alert"></i>
          <span>Pusat Keamanan</span>
          ${totalIssues > 0 ? `<span class="badge badge-warning">${totalIssues}</span>` : ''}
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">History</div>
        <div class="sidebar-link ${currentPage === 'activity' ? 'active' : ''}" data-action="navigate" data-page="activity">
          <i data-lucide="clock"></i>
          <span>Log Aktivitas</span>
        </div>
        <div class="sidebar-link ${currentPage === 'recycle' ? 'active' : ''}" data-action="navigate" data-page="recycle">
          <i data-lucide="trash-2"></i>
          <span>Tempat Sampah</span>
          ${deletedItems.length > 0 ? `<span class="badge badge-danger">${deletedItems.length}</span>` : ''}
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-link ${currentPage === 'settings' ? 'active' : ''}" data-action="navigate" data-page="settings">
          <i data-lucide="settings"></i>
          <span>Pengaturan</span>
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-link" data-action="lock-vault">
        <i data-lucide="lock"></i>
        <span>Kunci Brankas</span>
      </div>
    </div>
  `;
}


/* ==================== BOTTOM NAV ==================== */

export function renderBottomNav(currentPage) {
  const morePages = ['favorites', 'categories', 'generator', 'activity', 'recycle', 'settings'];
  const isMoreActive = morePages.includes(currentPage);
  return `
    <div class="bottom-nav-inner">
      <div class="bottom-nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-action="navigate" data-page="dashboard">
        <i data-lucide="layout-dashboard"></i>
        <span>Beranda</span>
      </div>
      <div class="bottom-nav-item ${currentPage === 'vault' ? 'active' : ''}" data-action="navigate" data-page="vault">
        <i data-lucide="key-round"></i>
        <span>Brankas</span>
      </div>
      <div class="bottom-nav-item add-btn" data-action="navigate" data-page="add">
        <div class="nav-icon-wrap">
          <i data-lucide="plus"></i>
        </div>
      </div>
      <div class="bottom-nav-item ${currentPage === 'security' ? 'active' : ''}" data-action="navigate" data-page="security">
        <i data-lucide="shield-check"></i>
        <span>Keamanan</span>
      </div>
      <div class="bottom-nav-item ${isMoreActive ? 'active' : ''}" data-action="open-more-menu">
        <i data-lucide="grid-2x2"></i>
        <span>Lainnya</span>
      </div>
    </div>
  `;
}

/* ==================== MORE MENU (MOBILE DRAWER) ==================== */

export function renderMoreMenuDrawer(currentPage, deletedCount = 0) {
  return `
    <div class="more-menu-overlay" data-action="close-more-menu"></div>
    <div class="more-menu-drawer animate-slideUp">
      <div class="more-menu-handle"></div>
      <div class="more-menu-title">Menu Lainnya</div>
      <div class="more-menu-grid">
        <div class="more-menu-item ${currentPage === 'favorites' ? 'active' : ''}" data-action="navigate-more" data-page="favorites">
          <div class="more-menu-icon yellow"><i data-lucide="star"></i></div>
          <span>Favorit</span>
        </div>
        <div class="more-menu-item ${currentPage === 'categories' ? 'active' : ''}" data-action="navigate-more" data-page="categories">
          <div class="more-menu-icon blue"><i data-lucide="folder"></i></div>
          <span>Kategori</span>
        </div>
        <div class="more-menu-item ${currentPage === 'generator' ? 'active' : ''}" data-action="navigate-more" data-page="generator">
          <div class="more-menu-icon purple"><i data-lucide="wand-2"></i></div>
          <span>Generator</span>
        </div>
        <div class="more-menu-item ${currentPage === 'activity' ? 'active' : ''}" data-action="navigate-more" data-page="activity">
          <div class="more-menu-icon green"><i data-lucide="clock"></i></div>
          <span>Log Aktivitas</span>
        </div>
        <div class="more-menu-item ${currentPage === 'recycle' ? 'active' : ''}" data-action="navigate-more" data-page="recycle">
          <div class="more-menu-icon red"><i data-lucide="trash-2"></i></div>
          <span>Tempat Sampah ${deletedCount > 0 ? `<span class="more-menu-badge">${deletedCount}</span>` : ''}</span>
        </div>
        <div class="more-menu-item ${currentPage === 'settings' ? 'active' : ''}" data-action="navigate-more" data-page="settings">
          <div class="more-menu-icon gray"><i data-lucide="settings"></i></div>
          <span>Pengaturan</span>
        </div>
        <div class="more-menu-item" data-action="lock-vault">
          <div class="more-menu-icon gray"><i data-lucide="lock"></i></div>
          <span>Kunci Brankas</span>
        </div>
      </div>
    </div>
  `;
}


/* ==================== AUTH SCREEN ==================== */

export function renderAuthScreen(isInitialized) {
  if (isInitialized) {
    return `
      <div class="auth-bg"></div>
      <div class="auth-card" id="auth-card">
        <div class="auth-icon" id="auth-icon">
          <i data-lucide="lock-keyhole"></i>
        </div>
        <h1 class="auth-title">Brankas Akun Digital</h1>
        <p class="auth-subtitle">Brankas Anda terkunci. Masukkan kata sandi utama untuk membuka.</p>
        <form class="auth-form" id="auth-form">
          <div class="input-group">
            <label class="input-label" for="master-password">Kata Sandi Utama</label>
            <div class="input-wrap">
              <input type="password" id="master-password" class="input-field" placeholder="Masukkan kata sandi utama Anda" autocomplete="current-password" autofocus>
              <div class="input-action">
                <button type="button" class="btn-icon" data-action="toggle-password-visibility" data-target="master-password">
                  <i data-lucide="eye"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="auth-error" id="auth-error"></div>
          <button type="submit" class="btn btn-primary btn-lg btn-block">
            <i data-lucide="lock-open"></i>
            <span>Buka Kunci</span>
          </button>
        </form>
        <div class="auth-reset-section">
          <p class="auth-footer">Semua data dienkripsi secara lokal di perangkat Anda.</p>
          <button type="button" class="btn-reset-vault" data-action="show-reset-confirm">
            <i data-lucide="rotate-ccw"></i>
            Lupa kata sandi? Reset Brankas
          </button>
        </div>
      </div>
    `;
  }

  // First-time setup
  return `
    <div class="auth-bg"></div>
    <div class="auth-card" id="auth-card">
      <div class="auth-icon">
        <i data-lucide="shield-plus"></i>
      </div>
      <h1 class="auth-title">Buat Brankas Anda</h1>
      <p class="auth-subtitle">Atur kata sandi utama untuk melindungi data Anda. Buat yang kuat — ini adalah satu-satunya kata sandi yang perlu Anda ingat.</p>
      <form class="auth-form" id="setup-form">
        <div class="input-group">
          <label class="input-label" for="setup-name">Nama Anda</label>
          <div class="input-wrap">
            <input type="text" id="setup-name" class="input-field" placeholder="Masukkan nama Anda" autocomplete="off" autofocus>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label" for="setup-password">Kata Sandi Utama</label>
          <div class="input-wrap">
            <input type="password" id="setup-password" class="input-field" placeholder="Buat kata sandi yang kuat (min. 8 karakter)" autocomplete="new-password">
            <div class="input-action">
              <button type="button" class="btn-icon" data-action="toggle-password-visibility" data-target="setup-password">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>
          <div class="strength-bar" id="setup-strength-bar">
            <div class="strength-bar-fill" id="setup-strength-fill"></div>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label" for="setup-confirm">Konfirmasi Kata Sandi</label>
          <div class="input-wrap">
            <input type="password" id="setup-confirm" class="input-field" placeholder="Konfirmasi kata sandi Anda" autocomplete="new-password">
            <div class="input-action">
              <button type="button" class="btn-icon" data-action="toggle-password-visibility" data-target="setup-confirm">
                <i data-lucide="eye"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="auth-error" id="auth-error"></div>
        <button type="submit" class="btn btn-primary btn-lg btn-block">
          <i data-lucide="shield-check"></i>
          <span>Buat Brankas</span>
        </button>
      </form>
      <p class="auth-footer">🔒 Data Anda tidak akan pernah meninggalkan perangkat ini. Enkripsi AES-256.</p>
    </div>
  `;
}

/* ==================== RESET VAULT CONFIRM ==================== */

export function renderResetConfirmScreen() {
  return `
    <div class="auth-bg"></div>
    <div class="auth-card" id="auth-card">
      <div class="auth-icon" style="background: var(--danger-bg); border-color: var(--danger-border); color: var(--danger);">
        <i data-lucide="alert-triangle"></i>
      </div>
      <h1 class="auth-title" style="color: var(--danger);">Reset Brankas</h1>
      <p class="auth-subtitle">⚠️ Tindakan ini akan <strong>menghapus permanen</strong> semua akun dan data yang tersimpan. Brankas akan dikosongkan dan Anda perlu membuat kata sandi baru.</p>
      <div class="auth-reset-confirm-box">
        <p class="text-sm text-muted" style="margin-bottom: var(--sp-3);">Ketik <strong>RESET</strong> di bawah ini untuk mengkonfirmasi:</p>
        <input type="text" id="reset-confirm-input" class="input-field" placeholder="Ketik RESET di sini" autocomplete="off" style="text-align: center; letter-spacing: 4px; font-weight: 700;">
      </div>
      <div class="flex gap-3 mt-4" style="width: 100%;">
        <button type="button" class="btn btn-secondary" style="flex:1" data-action="cancel-reset">
          <i data-lucide="arrow-left"></i> Batal
        </button>
        <button type="button" class="btn btn-danger" style="flex:1" data-action="confirm-hard-reset" id="btn-confirm-reset" disabled>
          <i data-lucide="trash-2"></i> Hapus Semua
        </button>
      </div>
      <p class="auth-footer" style="color: var(--danger); opacity: 0.7;">Tindakan ini tidak dapat dibatalkan!</p>
    </div>
  `;
}



/* ==================== DASHBOARD ==================== */

export function renderDashboard(vault) {
  const activeItems = getActiveItems(vault);
  const favorites = getFavorites(vault);
  const securityScore = calculateSecurityScore(activeItems);
  const issues = getSecurityIssues(activeItems);
  const totalIssues = issues.reduce((s, i) => s + i.count, 0);
  const scoreColor = securityScore >= 80 ? 'var(--success)' : securityScore >= 60 ? 'var(--warning)' : 'var(--danger)';

  let attentionHtml = '';
  if (totalIssues > 0) {
    const attentionItems = issues.flatMap(issue =>
      issue.items.slice(0, 3).map(item => `
        <div class="attention-item" data-action="navigate" data-page="detail" data-id="${item.id}">
          <span class="attention-item-name">${escapeHtml(item.name)}</span>
          <span class="attention-item-issue text-sm">${issue.title}</span>
          <span class="attention-item-arrow"><i data-lucide="chevron-right"></i></span>
        </div>
      `)
    ).join('');

    attentionHtml = `
      <div class="dashboard-attention">
        <div class="dashboard-attention-header">
          <span class="dashboard-attention-title">
            <i data-lucide="alert-triangle"></i>
            ${totalIssues} akun butuh perhatian Anda
          </span>
          <span class="dashboard-section-link" data-action="navigate" data-page="security">Lihat semua</span>
        </div>
        <div class="card">
          ${attentionItems}
        </div>
      </div>
    `;
  }

  let favoritesHtml = '';
  if (favorites.length > 0) {
    const favItems = favorites.slice(0, 5).map(item => renderAccountItem(item, vault)).join('');
    favoritesHtml = `
      <div class="dashboard-favorites">
        <div class="dashboard-section-header">
          <span class="dashboard-section-title">⭐ Favorites</span>
          <span class="dashboard-section-link" data-action="navigate" data-page="favorites">Lihat semua</span>
        </div>
        <div class="account-list">${favItems}</div>
      </div>
    `;
  }

  return `
    <div class="page-inner animate-fadeIn">
      <div class="dashboard-greeting">
        <h2>${getGreeting()}, ${escapeHtml(vault.settings.userName)} 👋</h2>
        <p class="text-secondary">Brankas Anda ${securityScore >= 80 ? 'sehat & aman' : 'butuh perhatian'}. Terakhir diperbarui ${timeAgo(vault.updatedAt)}.</p>
      </div>

      <div class="search-bar search-bar-lg">
        <i data-lucide="search"></i>
        <input type="text" class="input-field" placeholder="Cari di brankas..." data-action="global-search" id="dashboard-search">
      </div>

      <div class="dashboard-stats">
        <div class="card stat-card">
          <div class="stat-card-icon purple"><i data-lucide="key-round"></i></div>
          <div class="stat-card-value">${activeItems.length}</div>
          <div class="stat-card-label">Akun</div>
        </div>
        <div class="card stat-card card-clickable" data-action="navigate" data-page="security">
          <div class="stat-card-icon green"><i data-lucide="shield-check"></i></div>
          <div class="stat-card-value" style="color: ${scoreColor}">${securityScore}%</div>
          <div class="stat-card-label">Skor Keamanan</div>
        </div>
        <div class="card stat-card card-clickable" data-action="navigate" data-page="categories">
          <div class="stat-card-icon yellow"><i data-lucide="folder"></i></div>
          <div class="stat-card-value">${vault.categories.length}</div>
          <div class="stat-card-label">Categories</div>
        </div>
      </div>

      ${attentionHtml}
      ${favoritesHtml}

      ${activeItems.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="plus-circle"></i></div>
          <div class="empty-state-title">Brankas Anda kosong</div>
          <div class="empty-state-desc">Mulailah dengan menambahkan akun pertama Anda agar tetap aman dan teratur.</div>
          <button class="btn btn-primary" data-action="navigate" data-page="add">
            <i data-lucide="plus"></i> Tambah Akun Pertama
          </button>
        </div>
      ` : ''}
    </div>
  `;
}


/* ==================== ALL ACCOUNTS ==================== */

export function renderVaultPage(vault, searchQuery = '', sortBy = 'name', filterCategory = '') {
  let items = getActiveItems(vault);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(item => {
      if (item.name?.toLowerCase().includes(q)) return true;
      if (item.username?.toLowerCase().includes(q)) return true;
      if (item.website?.toLowerCase().includes(q)) return true;
      if (item.notes?.toLowerCase().includes(q)) return true;
      const cat = getCategoryById(vault, item.category);
      if (cat?.name.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  if (filterCategory) {
    items = items.filter(i => i.category === filterCategory);
  }

  items = sortItems(items, sortBy);

  const itemsHtml = items.length > 0
    ? `<div class="account-list">${items.map(i => renderAccountItem(i, vault)).join('')}</div>`
    : `<div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="search"></i></div>
        <div class="empty-state-title">${searchQuery ? 'Tidak ada hasil' : 'Belum ada akun'}</div>
        <div class="empty-state-desc">${searchQuery ? 'Coba kata kunci lain.' : 'Tambahkan akun pertama Anda untuk memulai.'}</div>
        ${!searchQuery ? '<button class="btn btn-primary" data-action="navigate" data-page="add"><i data-lucide="plus"></i> Tambah Akun</button>' : ''}
      </div>`;

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <h2 class="page-title">All Akun</h2>
        <button class="btn btn-primary" data-action="navigate" data-page="add">
          <i data-lucide="plus"></i> Add
        </button>
      </div>

      <div class="search-bar">
        <i data-lucide="search"></i>
        <input type="text" class="input-field" placeholder="Cari akun..." id="vault-search" value="${escapeHtml(searchQuery)}" data-action="vault-search">
      </div>

      <div class="vault-filters flex items-center justify-between gap-3 mb-4" style="flex-wrap: wrap;">
        <div class="flex items-center gap-2" style="flex-wrap: wrap;">
          <div class="select-wrap" style="width: auto; min-width: 150px;">
            <select id="vault-sort" class="select-field" style="padding: var(--sp-2) var(--sp-4); font-size: var(--fs-xs);" data-action="vault-sort">
              <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Urutkan: Nama (A-Z)</option>
              <option value="recent" ${sortBy === 'recent' ? 'selected' : ''}>Urutkan: Baru Diperbarui</option>
              <option value="created" ${sortBy === 'created' ? 'selected' : ''}>Urutkan: Tanggal Ditambahkan</option>
            </select>
          </div>
          <div class="select-wrap" style="width: auto; min-width: 150px;">
            <select id="vault-category-filter" class="select-field" style="padding: var(--sp-2) var(--sp-4); font-size: var(--fs-xs);" data-action="vault-category-select">
              <option value="">Semua Kategori</option>
              ${vault.categories.map(c => `<option value="${c.id}" ${filterCategory === c.id ? 'selected' : ''}>${c.icon} ${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        ${filterCategory ? `
          <button class="btn btn-ghost btn-sm text-xs" data-action="clear-category-filter">
            <i data-lucide="x"></i> Hapus Kategori
          </button>
        ` : ''}
      </div>

      ${itemsHtml}
    </div>
  `;
}


/* ==================== ACCOUNT ITEM (reusable) ==================== */

function renderAccountItem(item, vault) {
  const cat = getCategoryById(vault, item.category);
  const domain = getDomain(item.website);

  return `
    <div class="account-item" data-action="navigate" data-page="detail" data-id="${item.id}">
      <div class="account-avatar ${getAvatarClass(item.name)}">
        ${getInitials(item.name)}
      </div>
      <div class="account-info">
        <div class="account-name">
          ${item.isFavorite ? '<span class="fav-star">★</span>' : ''}
          ${escapeHtml(item.name)}
        </div>
        <div class="account-meta">${escapeHtml(item.username || domain || '')}</div>
        ${cat ? `<span class="account-category-tag">${cat.icon} ${escapeHtml(cat.name)}</span>` : ''}
      </div>
      <div class="account-arrow"><i data-lucide="chevron-right"></i></div>
    </div>
  `;
}


/* ==================== ACCOUNT DETAIL ==================== */

export function renderDetailPage(item, vault) {
  if (!item) {
    return `<div class="page-inner"><div class="empty-state"><div class="empty-state-title">Akun tidak ditemukan</div></div></div>`;
  }

  const cat = getCategoryById(vault, item.category);
  const domain = getDomain(item.website);
  const strength = calculatePasswordStrength(item.password);
  const strengthLabel = getStrengthLabel(strength);
  const strengthClass = getStrengthClass(strength);

  let fieldsHtml = '';

  // Username
  if (item.username) {
    fieldsHtml += renderDetailField('Username', item.username, 'user', item.username, false);
  }

  // Kata Sandi
  if (item.password) {
    fieldsHtml += `
      <div class="detail-field">
        <div class="detail-field-info">
          <div class="detail-field-label">Kata Sandi</div>
          <div class="detail-field-value password-masked password-blurred" id="pw-display-${item.id}">
            ${escapeHtml(item.password)}
          </div>
          <div class="strength-bar mt-2">
            <div class="strength-bar-fill ${strengthClass}"></div>
          </div>
          <div class="text-xs mt-2" style="color: ${getStrengthColor(strength)}">${strengthLabel}</div>
        </div>
        <div class="detail-field-actions">
          <button class="btn-icon" data-action="reveal-password" data-id="${item.id}" title="Show password">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn-icon" data-action="copy" data-value="${escapeHtml(item.password)}" data-label="Kata Sandi" data-item-name="${escapeHtml(item.name)}" title="Copy password">
            <i data-lucide="clipboard"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Situs Web
  if (item.website) {
    fieldsHtml += `
      <div class="detail-field">
        <div class="detail-field-info">
          <div class="detail-field-label">Situs Web</div>
          <div class="detail-field-value">${escapeHtml(domain)}</div>
        </div>
        <div class="detail-field-actions">
          <a href="${item.website.startsWith('http') ? item.website : 'https://' + item.website}" target="_blank" rel="noopener" class="btn-icon" title="Open website">
            <i data-lucide="external-link"></i>
          </a>
          <button class="btn-icon" data-action="copy" data-value="${escapeHtml(item.website)}" data-label="Situs Web" title="Copy URL">
            <i data-lucide="clipboard"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Custom fields
  let customFieldsHtml = '';
  if (item.customFields && item.customFields.length > 0) {
    customFieldsHtml = `
      <div class="detail-section">
        <div class="detail-section-title">Informasi Tambahan</div>
        ${item.customFields.map(field => {
          if (field.isSensitive) {
            return `
              <div class="detail-field">
                <div class="detail-field-info">
                  <div class="detail-field-label">${escapeHtml(field.label)}</div>
                  <div class="detail-field-value password-masked password-blurred" id="cf-display-${field.id}">
                    ${escapeHtml(field.value)}
                  </div>
                </div>
                <div class="detail-field-actions">
                  <button class="btn-icon" data-action="reveal-custom-field" data-field-id="${field.id}" title="Show">
                    <i data-lucide="eye"></i>
                  </button>
                  <button class="btn-icon" data-action="copy" data-value="${escapeHtml(field.value)}" data-label="${escapeHtml(field.label)}" title="Copy">
                    <i data-lucide="clipboard"></i>
                  </button>
                </div>
              </div>
            `;
          }
          return renderDetailField(field.label, field.value, null, field.value, true);
        }).join('')}
      </div>
    `;
  }

  // Catatan
  let notesHtml = '';
  if (item.notes) {
    notesHtml = `
      <div class="detail-section">
        <div class="detail-section-title">Catatan</div>
        <div class="card" style="padding: var(--sp-4)">
          <div class="text-sm text-secondary" style="white-space: pre-wrap;">${escapeHtml(item.notes)}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-back-btn" data-action="go-back">
            <i data-lucide="arrow-left"></i>
          </div>
          <h2 class="page-title">Details</h2>
        </div>
      </div>

      <div class="detail-header">
        <div class="detail-avatar ${getAvatarClass(item.name)}">${getInitials(item.name)}</div>
        <div class="detail-name">${escapeHtml(item.name)}</div>
        ${domain ? `<div class="detail-website">${escapeHtml(domain)}</div>` : ''}
        <button class="btn btn-ghost btn-sm detail-fav-btn" data-action="toggle-favorite" data-id="${item.id}">
          ${item.isFavorite
            ? '<span style="color: var(--warning)">★ Favorite</span>'
            : '<span>☆ Add to Favorites</span>'
          }
        </button>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Login Information</div>
        ${fieldsHtml}
      </div>

      ${customFieldsHtml}

      ${cat ? `
        <div class="detail-section">
          <div class="detail-section-title">Category</div>
          <div class="card" style="padding: var(--sp-4)">
            <span class="tag">${cat.icon} ${escapeHtml(cat.name)}</span>
          </div>
        </div>
      ` : ''}

      ${notesHtml}

      <div class="detail-section">
        <div class="text-xs text-muted" style="text-align:center;">
          Dibuat ${formatDate(item.createdAt)} · Diperbarui ${timeAgo(item.updatedAt)}
          ${item.passwordChangedAt ? `<br>Kata sandi terakhir diubah ${timeAgo(item.passwordChangedAt)}` : ''}
        </div>
      </div>

      <div class="detail-actions">
        <button class="btn btn-secondary" style="flex:1" data-action="navigate" data-page="edit" data-id="${item.id}">
          <i data-lucide="edit-3"></i> Edit
        </button>
        <button class="btn btn-danger" style="flex:1" data-action="delete-item" data-id="${item.id}" data-name="${escapeHtml(item.name)}">
          <i data-lucide="trash-2"></i> Hapus
        </button>
      </div>
    </div>
  `;
}

function renderDetailField(label, displayValue, icon, copyValue, showCopy = true) {
  return `
    <div class="detail-field">
      <div class="detail-field-info">
        <div class="detail-field-label">${escapeHtml(label)}</div>
        <div class="detail-field-value">${escapeHtml(displayValue)}</div>
      </div>
      ${showCopy && copyValue ? `
        <div class="detail-field-actions">
          <button class="btn-icon" data-action="copy" data-value="${escapeHtml(copyValue)}" data-label="${escapeHtml(label)}" title="Copy">
            <i data-lucide="clipboard"></i>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}


/* ==================== ADD / EDIT ==================== */

export function renderAddEditPage(vault, existingItem = null) {
  const isEdit = !!existingItem;
  const item = existingItem || { type: 'login', name: '', username: '', password: '', website: '', category: '', notes: '', customFields: [] };

  const categoriesOptions = vault.categories.map(cat =>
    `<option value="${cat.id}" ${item.category === cat.id ? 'selected' : ''}>${cat.icon} ${escapeHtml(cat.name)}</option>`
  ).join('');

  const customFieldsHtml = (item.customFields || []).map((field, idx) => `
    <div class="custom-field-item" data-field-idx="${idx}">
      <div class="input-group" style="flex:1">
        <label class="input-label">Label</label>
        <input type="text" class="input-field custom-field-label" value="${escapeHtml(field.label)}" placeholder="e.g., Recovery Email">
      </div>
      <div class="input-group" style="flex:1">
        <label class="input-label">Value</label>
        <input type="text" class="input-field custom-field-value" value="${escapeHtml(field.value)}" placeholder="Enter value">
      </div>
      <div class="input-group">
        <label class="input-label">Sensitive</label>
        <label class="checkbox" style="margin-top: 6px;">
          <input type="checkbox" class="custom-field-sensitive" ${field.isSensitive ? 'checked' : ''}>
          <span class="checkbox-box"></span>
        </label>
      </div>
      <button class="btn btn-ghost btn-icon custom-field-remove" data-action="remove-custom-field" data-idx="${idx}" style="margin-top: 24px;">
        <i data-lucide="x"></i>
      </button>
    </div>
  `).join('');

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-back-btn" data-action="go-back">
            <i data-lucide="arrow-left"></i>
          </div>
          <h2 class="page-title">${isEdit ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
        </div>
      </div>

      <form id="item-form">
        <div class="form-section">
          <div class="form-section-title">Informasi Dasar</div>
          <div class="form-grid">
            <div class="input-group">
              <label class="input-label" for="item-name">Nama Akun *</label>
              <input type="text" id="item-name" class="input-field" placeholder="e.g., Facebook" value="${escapeHtml(item.name)}" required>
            </div>

            <div class="input-group">
              <label class="input-label" for="item-category">Category</label>
              <div class="select-wrap">
                <select id="item-category" class="select-field">
                  <option value="">Pilih kategori</option>
                  ${categoriesOptions}
                </select>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label" for="item-username">Nama Pengguna / Email</label>
              <input type="text" id="item-username" class="input-field" placeholder="e.g., user@gmail.com" value="${escapeHtml(item.username)}">
            </div>

            <div class="input-group">
              <label class="input-label" for="item-password">Kata Sandi</label>
              <div class="input-wrap">
                <input type="password" id="item-password" class="input-field" placeholder="Masukkan kata sandi" value="${escapeHtml(item.password)}">
                <div class="input-action">
                  <button type="button" class="btn-icon" data-action="toggle-password-visibility" data-target="item-password" title="Show/Hide">
                    <i data-lucide="eye"></i>
                  </button>
                  <button type="button" class="btn-icon" data-action="generate-inline" title="Buat password" style="color: var(--accent);">
                    <i data-lucide="wand-2"></i>
                  </button>
                </div>
              </div>
              <div class="strength-bar" id="item-strength-bar">
                <div class="strength-bar-fill" id="item-strength-fill"></div>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label" for="item-website">Situs Web</label>
              <input type="text" id="item-website" class="input-field" placeholder="e.g., facebook.com" value="${escapeHtml(item.website)}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Kolom Kustom</div>
          <div id="custom-fields-container" class="form-grid">
            ${customFieldsHtml}
          </div>
          <button type="button" class="btn btn-ghost mt-4" data-action="add-custom-field">
            <i data-lucide="plus"></i> Tambah Kolom Kustom
          </button>
        </div>

        <div class="form-section">
          <div class="form-section-title">Catatan</div>
          <textarea id="item-notes" class="input-field" placeholder="Catatan tambahan..." rows="3">${escapeHtml(item.notes)}</textarea>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="submit" class="btn btn-primary" style="flex:1">
            <i data-lucide="save"></i> ${isEdit ? 'Simpan Perubahan' : 'Simpan Akun'}
          </button>
          <button type="button" class="btn btn-secondary" data-action="go-back">Batal</button>
        </div>

        ${isEdit ? `<input type="hidden" id="item-id" value="${item.id}">` : ''}
      </form>
    </div>
  `;
}


/* ==================== PASSWORD GENERATOR ==================== */

export function renderGeneratorPage(options = null) {
  const opts = options || getDefaultGeneratorOptions();

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <h2 class="page-title">Pembuat Kata Sandi</h2>
      </div>

      <div class="generator-output">
        <div class="generator-password" id="gen-password">Klik Buat</div>
        <button class="btn-icon" data-action="copy-generated" title="Copy password">
          <i data-lucide="clipboard"></i>
        </button>
      </div>

      <div class="card" style="padding: var(--sp-6)">
        <div class="generator-options">
          <div class="generator-length">
            <div class="generator-length-header">
              <span class="input-label">Panjang</span>
              <span class="generator-length-value" id="gen-length-value">${opts.length}</span>
            </div>
            <input type="range" class="range-slider" id="gen-length" min="6" max="64" value="${opts.length}" data-action="gen-update">
          </div>

          <div class="generator-checkboxes">
            <label class="checkbox">
              <input type="checkbox" id="gen-upper" ${opts.uppercase ? 'checked' : ''} data-action="gen-update">
              <span class="checkbox-box"></span>
              ABC Huruf Besar
            </label>
            <label class="checkbox">
              <input type="checkbox" id="gen-lower" ${opts.lowercase ? 'checked' : ''} data-action="gen-update">
              <span class="checkbox-box"></span>
              abc Huruf Kecil
            </label>
            <label class="checkbox">
              <input type="checkbox" id="gen-numbers" ${opts.numbers ? 'checked' : ''} data-action="gen-update">
              <span class="checkbox-box"></span>
              123 Angka
            </label>
            <label class="checkbox">
              <input type="checkbox" id="gen-symbols" ${opts.symbols ? 'checked' : ''} data-action="gen-update">
              <span class="checkbox-box"></span>
              !@# Simbol
            </label>
          </div>

          <label class="checkbox">
            <input type="checkbox" id="gen-ambiguous" ${opts.avoidAmbiguous ? 'checked' : ''} data-action="gen-update">
            <span class="checkbox-box"></span>
            Hindari karakter ambigu (I, l, 1, O, 0)
          </label>

          <button class="btn btn-primary btn-block" data-action="generate-password">
            <i data-lucide="refresh-cw"></i> Buat
          </button>
        </div>
      </div>
    </div>
  `;
}


/* ==================== CATEGORIES ==================== */

export function renderCategoriesPage(vault) {
  const counts = getCategoryCounts(vault);

  const cardsHtml = vault.categories.map(cat => `
    <div class="card category-card card-clickable" data-action="filter-category" data-category-id="${cat.id}">
      <div class="category-card-icon">${cat.icon}</div>
      <div class="category-card-name">${escapeHtml(cat.name)}</div>
      <div class="category-card-count">${counts[cat.id] || 0} accounts</div>
      ${!cat.isDefault ? `<button class="btn btn-ghost btn-sm text-danger mt-2" data-action="delete-category" data-category-id="${cat.id}" data-category-name="${escapeHtml(cat.name)}">Hapus</button>` : ''}
    </div>
  `).join('');

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <h2 class="page-title">Categories</h2>
        <button class="btn btn-primary btn-sm" data-action="show-add-category">
          <i data-lucide="plus"></i> Add
        </button>
      </div>

      <div class="category-grid">
        ${cardsHtml}
      </div>
    </div>
  `;
}


/* ==================== FAVORITES ==================== */

export function renderFavoritesPage(vault) {
  const favorites = getFavorites(vault);

  const content = favorites.length > 0
    ? `<div class="account-list">${favorites.map(i => renderAccountItem(i, vault)).join('')}</div>`
    : `<div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="star"></i></div>
        <div class="empty-state-title">No favorites yet</div>
        <div class="empty-state-desc">Star your most-used accounts for quick access.</div>
      </div>`;

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <h2 class="page-title">⭐ Favorites</h2>
      </div>
      ${content}
    </div>
  `;
}


/* ==================== SECURITY CENTER ==================== */

export function renderSecurityPage(vault) {
  const activeItems = getActiveItems(vault);
  const score = calculateSecurityScore(activeItems);
  const issues = getSecurityIssues(activeItems);
  const strongCount = activeItems.filter(i => i.password && calculatePasswordStrength(i.password) >= 80).length;

  let scoreColorVar;
  let scoreLabel;
  if (score >= 80) { scoreColorVar = 'var(--success)'; scoreLabel = 'Very Good'; }
  else if (score >= 60) { scoreColorVar = 'var(--info)'; scoreLabel = 'Good'; }
  else if (score >= 40) { scoreColorVar = 'var(--warning)'; scoreLabel = 'Needs Work'; }
  else { scoreColorVar = 'var(--danger)'; scoreLabel = 'Critical'; }

  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (score / 100) * circumference;

  const issueCards = issues.map(issue => {
    const severityMap = { danger: 'var(--danger)', warning: 'var(--warning)' };
    const bgMap = { danger: 'var(--danger-bg)', warning: 'var(--warning-bg)' };

    return `
      <div class="card card-clickable" style="border-left: 3px solid ${severityMap[issue.severity]}; margin-bottom: var(--sp-3);" data-action="show-security-detail" data-type="${issue.type}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-md);background:${bgMap[issue.severity]};color:${severityMap[issue.severity]}">
              <i data-lucide="${issue.icon}"></i>
            </div>
            <div>
              <div class="text-sm fw-600">${issue.title}</div>
              <div class="text-xs text-muted">${issue.count} account${issue.count > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div class="text-muted"><i data-lucide="chevron-right"></i></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <h2 class="page-title">Security Center</h2>
      </div>

      <div class="card" style="margin-bottom: var(--sp-6)">
        <div class="score-gauge">
          <div class="score-circle">
            <svg viewBox="0 0 160 160">
              <circle class="bg" cx="80" cy="80" r="68"/>
              <circle class="progress" cx="80" cy="80" r="68"
                stroke="${scoreColorVar}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
              />
            </svg>
            <div class="score-value">
              <div class="score-number" style="color: ${scoreColorVar}">${score}</div>
              <div class="score-label">${scoreLabel}</div>
            </div>
          </div>
        </div>
      </div>

      ${issues.length > 0 ? `
        <div class="mb-6">
          <div class="text-sm fw-600 mb-4" style="color: var(--warning)">⚠ ${issues.reduce((s,i)=>s+i.count,0)} Issues Found</div>
          ${issueCards}
        </div>
      ` : ''}

      <div class="card" style="border-left: 3px solid var(--success); margin-bottom: var(--sp-3);">
        <div class="flex items-center gap-3" style="padding: var(--sp-1)">
          <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-md);background:var(--success-bg);color:var(--success)">
            <i data-lucide="shield-check"></i>
          </div>
          <div>
            <div class="text-sm fw-600">Strong Passwords</div>
            <div class="text-xs text-muted">${strongCount} account${strongCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}


/* ==================== ACTIVITY LOG ==================== */

export function renderActivityPage(vault) {
  const groups = groupActivitiesByDate(vault.activityLog);

  if (groups.length === 0) {
    return `
      <div class="page-inner animate-fadeIn">
        <div class="page-header"><h2 class="page-title">Activity</h2></div>
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="clock"></i></div>
          <div class="empty-state-title">No activity yet</div>
          <div class="empty-state-desc">Your vault activity will appear here.</div>
        </div>
      </div>
    `;
  }

  const timelineHtml = groups.map(group => {
    const items = group.activities.map(act => `
      <div class="timeline-item">
        <div class="timeline-dot ${getActionDotClass(act.action)}">
          <i data-lucide="${getActionIcon(act.action)}"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-action">${getActionLabel(act.action)}</div>
          ${act.itemName ? `<div class="timeline-detail">${escapeHtml(act.itemName)}</div>` : ''}
        </div>
        <div class="timeline-time">${formatTime(act.timestamp)}</div>
      </div>
    `).join('');

    return `
      <div class="timeline-date">${group.label}</div>
      ${items}
    `;
  }).join('');

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header"><h2 class="page-title">Activity</h2></div>
      <div class="timeline">${timelineHtml}</div>
    </div>
  `;
}


/* ==================== RECYCLE BIN ==================== */

export function renderRecyclePage(vault) {
  const deleted = getDeletedItems(vault);

  if (deleted.length === 0) {
    return `
      <div class="page-inner animate-fadeIn">
        <div class="page-header"><h2 class="page-title">Recycle Bin</h2></div>
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="trash-2"></i></div>
          <div class="empty-state-title">Recycle bin is empty</div>
          <div class="empty-state-desc">Akun yang dihapus akan muncul di sini selama 30 hari.</div>
        </div>
      </div>
    `;
  }

  const itemsHtml = deleted.map(item => `
    <div class="recycle-item">
      <div class="account-avatar ${getAvatarClass(item.name)}">${getInitials(item.name)}</div>
      <div class="recycle-item-info">
        <div class="recycle-item-name">${escapeHtml(item.name)}</div>
        <div class="recycle-item-date">Dihapus ${timeAgo(item.deletedAt)}</div>
      </div>
      <div class="recycle-item-actions">
        <button class="btn btn-ghost btn-sm" data-action="restore-item" data-id="${item.id}">
          <i data-lucide="rotate-ccw"></i> Restore
        </button>
        <button class="btn btn-danger btn-sm" data-action="permanent-delete" data-id="${item.id}" data-name="${escapeHtml(item.name)}">
          <i data-lucide="x"></i>
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header">
        <h2 class="page-title">Recycle Bin</h2>
        <span class="text-xs text-muted">Auto-deleted after 30 days</span>
      </div>
      ${itemsHtml}
    </div>
  `;
}


/* ==================== SETTINGS ==================== */

export function renderSettingsPage(vault) {
  const s = vault.settings;
  const autoLockLabel = s.autoLockMinutes === 0 ? 'Tidak pernah' : `${s.autoLockMinutes} menit`;
  const reminderLabel = s.passwordReminderDays === 0 ? 'Tidak pernah' : `${s.passwordReminderDays} hari`;

  return `
    <div class="page-inner animate-fadeIn">
      <div class="page-header"><h2 class="page-title">Pengaturan</h2></div>

      <div class="settings-group">
        <div class="settings-group-title">Keamanan</div>
        <div class="settings-item" data-action="show-change-password">
          <div class="settings-item-left">
            <div class="settings-item-icon"><i data-lucide="key-round"></i></div>
            <div>
              <div class="settings-item-text">Kata Sandi Utama</div>
              <div class="settings-item-desc">Ubah kata sandi utama Anda</div>
            </div>
          </div>
          <div class="settings-item-right"><i data-lucide="chevron-right"></i></div>
        </div>
        <div class="settings-item" data-action="show-autolock-setting">
          <div class="settings-item-left">
            <div class="settings-item-icon"><i data-lucide="timer"></i></div>
            <div>
              <div class="settings-item-text">Kunci Otomatis</div>
              <div class="settings-item-desc">Kunci brankas setelah tidak aktif</div>
            </div>
          </div>
          <div class="settings-item-right">
            <span class="settings-item-value">${autoLockLabel}</span>
            <i data-lucide="chevron-right"></i>
          </div>
        </div>
        <div class="settings-item" data-action="show-reminder-setting">
          <div class="settings-item-left">
            <div class="settings-item-icon"><i data-lucide="bell"></i></div>
            <div>
              <div class="settings-item-text">Pengingat Kata Sandi</div>
              <div class="settings-item-desc">Ingatkan untuk mengubah kata sandi lama</div>
            </div>
          </div>
          <div class="settings-item-right">
            <span class="settings-item-value">${reminderLabel}</span>
            <i data-lucide="chevron-right"></i>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Cadangan Data</div>
        <div class="settings-item" data-action="export-backup">
          <div class="settings-item-left">
            <div class="settings-item-icon"><i data-lucide="download"></i></div>
            <div>
              <div class="settings-item-text">Ekspor Cadangan</div>
              <div class="settings-item-desc">Unduh file brankas terenkripsi</div>
            </div>
          </div>
          <div class="settings-item-right"><i data-lucide="chevron-right"></i></div>
        </div>
        <div class="settings-item" data-action="import-backup">
          <div class="settings-item-left">
            <div class="settings-item-icon"><i data-lucide="upload"></i></div>
            <div>
              <div class="settings-item-text">Impor Cadangan</div>
              <div class="settings-item-desc">Pulihkan dari file cadangan (.pvault / .json)</div>
            </div>
          </div>
          <div class="settings-item-right"><i data-lucide="chevron-right"></i></div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Tentang Aplikasi</div>
        <div class="settings-item" style="cursor:default">
          <div class="settings-item-left">
            <div class="settings-item-icon"><i data-lucide="info"></i></div>
            <div>
              <div class="settings-item-text">Personal Vault</div>
              <div class="settings-item-desc">Versi 1.0 — Semua data disimpan lokal di perangkat ini</div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group mt-6">
        <div class="settings-item" data-action="lock-vault" style="justify-content:center; cursor:pointer;">
          <div class="flex items-center gap-2" style="color: var(--accent);">
            <i data-lucide="lock"></i>
            <span class="fw-600">Kunci Brankas</span>
          </div>
        </div>
      </div>
    </div>
  `;
}


/* ==================== MODALS ==================== */

export function renderConfirmModal(title, message, confirmText, confirmAction, confirmClass = 'btn-danger', iconType = 'danger') {
  return `
    <div class="modal-overlay confirm-dialog" data-action="close-modal">
      <div class="modal">
        <div class="modal-body text-center" style="padding: var(--sp-8) var(--sp-6)">
          <div class="confirm-icon ${iconType}">
            <i data-lucide="${iconType === 'danger' ? 'alert-triangle' : 'alert-circle'}"></i>
          </div>
          <h3 style="margin-bottom: var(--sp-2)">${title}</h3>
          <p class="confirm-message">${message}</p>
          <div class="flex gap-3 justify-center">
            <button class="btn btn-secondary" data-action="close-modal">Batal</button>
            <button class="btn ${confirmClass}" data-action="${confirmAction}">${confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderInputModal(title, fields, submitText, submitAction) {
  const fieldsHtml = fields.map(f => `
    <div class="input-group">
      <label class="input-label">${f.label}</label>
      ${f.type === 'select' ? `
        <div class="select-wrap">
          <select id="modal-${f.id}" class="select-field">
            ${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="${f.type || 'text'}" id="modal-${f.id}" class="input-field" placeholder="${f.placeholder || ''}" value="${f.value || ''}">
      `}
    </div>
  `).join('');

  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" data-action="close-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">${fieldsHtml}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="close-modal">Batal</button>
          <button class="btn btn-primary" data-action="${submitAction}">${submitText}</button>
        </div>
      </div>
    </div>
  `;
}
