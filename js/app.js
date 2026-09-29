/* ============================================
   PERSONAL DIGITAL VAULT — Main Application Controller
   Routing, State, Encryption, Auto-Lock, Event Delegation
   ============================================ */

import { generateId, showToast, copyToClipboard, debounce, escapeHtml } from './utils.js';
import {
  isVaultInitialized,
  initializeVault,
  unlockVault,
  saveVault,
  changeMasterPassword,
  exportVault,
  importVault,
  destroyVault
} from './crypto.js';
import {
  createEmptyVault,
  addItem,
  updateItem,
  softDeleteItem,
  restoreItem,
  permanentDeleteItem,
  purgeOldDeleted,
  getActiveItems,
  getDeletedItems,
  getFavorites,
  toggleFavorite,
  getItemsByCategory,
  searchItems,
  addCategory,
  removeCategory,
  getCategoryById,
  addActivityToVault,
  getItemById
} from './vault.js';
import {
  calculatePasswordStrength,
  getStrengthLabel,
  getStrengthClass,
  getStrengthColor,
  findWeakPasswords,
  findReusedPasswords,
  findOldPasswords
} from './security.js';
import { generatePassword, getDefaultGeneratorOptions } from './generator.js';
import { ACTIONS, createActivity } from './activity.js';
import {
  renderSidebar,
  renderBottomNav,
  renderAuthScreen,
  renderDashboard,
  renderVaultPage,
  renderDetailPage,
  renderAddEditPage,
  renderGeneratorPage,
  renderCategoriesPage,
  renderFavoritesPage,
  renderSecurityPage,
  renderActivityPage,
  renderRecyclePage,
  renderSettingsPage,
  renderConfirmModal,
  renderInputModal
} from './ui.js';

/* ---------- APPLICATION STATE ---------- */
let vault = null;
let encryptionKey = null;
let currentPage = 'dashboard';
let pageHistory = [];
let searchQuery = '';
let sortBy = 'name';
let filterCategory = '';
let currentItemId = null;
let autoLockTimer = null;
let clipboardClearTimer = null;
let generatorOptions = getDefaultGeneratorOptions();

/* ---------- INITIALIZATION ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

export function initApp() {
  setupGlobalListeners();
  setupInactivityTracking();

  const isInit = isVaultInitialized();
  const authScreen = document.getElementById('auth-screen');
  const appScreen = document.getElementById('app');

  if (authScreen) {
    authScreen.innerHTML = renderAuthScreen(isInit);
    authScreen.classList.remove('hidden');
  }
  if (appScreen) {
    appScreen.classList.remove('active');
  }

  refreshIcons();
}

/* ---------- AUTO-LOCK & INACTIVITY ---------- */
function setupInactivityTracking() {
  const resetTimer = debounce(() => {
    if (vault && encryptionKey) {
      resetAutoLockTimer();
    }
  }, 500);

  ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
}

function resetAutoLockTimer() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  const minutes = vault?.settings?.autoLockMinutes ?? 5;
  if (minutes > 0) {
    autoLockTimer = setTimeout(() => {
      lockVault(true);
    }, minutes * 60 * 1000);
  }
}

export function lockVault(isAuto = false) {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (vault) {
    addActivityToVault(vault, createActivity(ACTIONS.LOCK, null, isAuto ? 'Auto-locked (timeout)' : 'Manual lock'));
    persistVaultSilently();
  }

  vault = null;
  encryptionKey = null;
  currentItemId = null;
  pageHistory = [];
  searchQuery = '';
  filterCategory = '';

  const appScreen = document.getElementById('app');
  const authScreen = document.getElementById('auth-screen');
  closeModal();

  if (appScreen) appScreen.classList.remove('active');
  if (authScreen) {
    authScreen.classList.remove('hidden');
    authScreen.innerHTML = renderAuthScreen(true);
    refreshIcons();
    const pwInput = document.getElementById('master-password');
    if (pwInput) pwInput.focus();
  }

  if (isAuto) {
    showToast('Vault auto-locked due to inactivity', 'info');
  }
}

/* ---------- VAULT PERSISTENCE ---------- */
async function persistVault() {
  if (!vault || !encryptionKey) return;
  try {
    await saveVault(vault, encryptionKey);
  } catch (err) {
    console.error('Error saving vault:', err);
    showToast('Error saving vault data', 'error');
  }
}

async function persistVaultSilently() {
  if (!vault || !encryptionKey) return;
  try {
    await saveVault(vault, encryptionKey);
  } catch (err) {
    console.warn('Silently failed to save vault on exit:', err);
  }
}

/* ---------- NAVIGATION & ROUTER ---------- */
export function navigateTo(page, params = {}, pushHistory = true) {
  if (pushHistory && currentPage !== page) {
    pageHistory.push({ page: currentPage, params: { id: currentItemId, filterCategory, searchQuery, sortBy } });
  }

  currentPage = page;
  if (params.id !== undefined) currentItemId = params.id;
  if (params.filterCategory !== undefined) filterCategory = params.filterCategory;
  if (params.searchQuery !== undefined) searchQuery = params.searchQuery;
  if (params.sortBy !== undefined) sortBy = params.sortBy;

  // Render Sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar && vault) {
    sidebar.innerHTML = renderSidebar(vault, currentPage);
  }

  // Render Bottom Nav
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    bottomNav.innerHTML = renderBottomNav(currentPage);
  }

  // Render Page
  const container = document.getElementById('page-container');
  if (!container || !vault) return;

  switch (page) {
    case 'dashboard':
      container.innerHTML = renderDashboard(vault);
      break;

    case 'vault':
      container.innerHTML = renderVaultPage(vault, searchQuery, sortBy, filterCategory);
      break;

    case 'favorites':
      container.innerHTML = renderFavoritesPage(vault);
      break;

    case 'categories':
      container.innerHTML = renderCategoriesPage(vault);
      break;

    case 'generator':
      container.innerHTML = renderGeneratorPage(generatorOptions);
      // Generate initial password immediately
      setTimeout(() => updateGeneratedPasswordView(), 0);
      break;

    case 'security':
      container.innerHTML = renderSecurityPage(vault);
      break;

    case 'activity':
      container.innerHTML = renderActivityPage(vault);
      break;

    case 'recycle':
      container.innerHTML = renderRecyclePage(vault);
      break;

    case 'settings':
      container.innerHTML = renderSettingsPage(vault);
      break;

    case 'detail': {
      const item = getItemById(vault, currentItemId);
      if (!item) {
        navigateTo('vault', {}, false);
        return;
      }
      container.innerHTML = renderDetailPage(item, vault);
      break;
    }

    case 'add':
      container.innerHTML = renderAddEditPage(vault, null);
      break;

    case 'edit': {
      const item = getItemById(vault, currentItemId);
      if (!item) {
        navigateTo('vault', {}, false);
        return;
      }
      container.innerHTML = renderAddEditPage(vault, item);
      break;
    }

    default:
      container.innerHTML = renderDashboard(vault);
      break;
  }

  container.scrollTop = 0;
  refreshIcons();
}

function goBack() {
  if (pageHistory.length > 0) {
    const prev = pageHistory.pop();
    navigateTo(prev.page, prev.params || {}, false);
  } else {
    navigateTo('dashboard', {}, false);
  }
}

/* ---------- MODALS ---------- */
function showModal(html) {
  const container = document.getElementById('modal-container');
  if (container) {
    container.innerHTML = html;
    refreshIcons();
  }
}

function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
}

/* ---------- ICONS REFRESH ---------- */
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/* ---------- GENERATOR LOGIC ---------- */
function updateGeneratedPasswordView() {
  const pwEl = document.getElementById('gen-password');
  if (!pwEl) return;

  const lengthInput = document.getElementById('gen-length');
  const upperInput = document.getElementById('gen-upper');
  const lowerInput = document.getElementById('gen-lower');
  const numbersInput = document.getElementById('gen-numbers');
  const symbolsInput = document.getElementById('gen-symbols');
  const ambiguousInput = document.getElementById('gen-ambiguous');
  const lengthVal = document.getElementById('gen-length-value');

  if (lengthInput) {
    generatorOptions.length = parseInt(lengthInput.value, 10);
    if (lengthVal) lengthVal.textContent = lengthInput.value;
  }
  if (upperInput) generatorOptions.uppercase = upperInput.checked;
  if (lowerInput) generatorOptions.lowercase = lowerInput.checked;
  if (numbersInput) generatorOptions.numbers = numbersInput.checked;
  if (symbolsInput) generatorOptions.symbols = symbolsInput.checked;
  if (ambiguousInput) generatorOptions.avoidAmbiguous = ambiguousInput.checked;

  const password = generatePassword(generatorOptions);
  pwEl.textContent = password;
}

/* ---------- LIVE STRENGTH BAR HELPER ---------- */
function updateStrengthBar(fillElementId, password) {
  const fill = document.getElementById(fillElementId);
  if (!fill) return;

  const strength = calculatePasswordStrength(password);
  const className = getStrengthClass(strength);

  fill.className = `strength-bar-fill ${className}`;
}

/* ---------- DEMO DATA GENERATOR ---------- */
export function loadSampleData() {
  const now = new Date();
  const past30 = new Date(now - 30 * 86400000).toISOString();
  const past200 = new Date(now - 200 * 86400000).toISOString();

  const samples = [
    {
      id: generateId('item'),
      type: 'login',
      name: 'Google Workspace',
      category: 'cat_work',
      website: 'accounts.google.com',
      username: 'irfan.dev@gmail.com',
      password: 'Tr0ngP@ssw0rd!2026',
      isFavorite: true,
      createdAt: past30,
      updatedAt: past30,
      passwordChangedAt: past30,
      customFields: [
        { id: generateId('field'), label: 'Recovery Email', value: 'backup.irfan@outlook.com', isSensitive: false },
        { id: generateId('field'), label: '2FA Backup Key', value: '4819-2093-1823-9912', isSensitive: true }
      ],
      notes: 'Primary developer account with cloud console access.',
      isDeleted: false,
      deletedAt: null
    },
    {
      id: generateId('item'),
      type: 'login',
      name: 'GitHub Enterprise',
      category: 'cat_work',
      website: 'github.com',
      username: 'irfandev',
      password: 'Tr0ngP@ssw0rd!2026', // Reused password for Security Center detection!
      isFavorite: true,
      createdAt: past200,
      updatedAt: past200,
      passwordChangedAt: past200, // Old password (>180d) for Security Center detection!
      customFields: [
        { id: generateId('field'), label: 'SSH Key Fingerprint', value: 'SHA256:m9xK8...dev', isSensitive: false },
        { id: generateId('field'), label: 'Personal Access Token', value: 'ghp_88x991abc00293km', isSensitive: true }
      ],
      notes: 'Contains private repositories and deployment keys.',
      isDeleted: false,
      deletedAt: null
    },
    {
      id: generateId('item'),
      type: 'login',
      name: 'Spotify Premium',
      category: 'cat_other',
      website: 'spotify.com',
      username: 'irfan_music',
      password: '123456password', // Weak password for Security Center detection!
      isFavorite: false,
      createdAt: past30,
      updatedAt: past30,
      passwordChangedAt: past30,
      customFields: [
        { id: generateId('field'), label: 'Family Plan Admin', value: 'Yes', isSensitive: false }
      ],
      notes: 'Family subscription renewed monthly.',
      isDeleted: false,
      deletedAt: null
    },
    {
      id: generateId('item'),
      type: 'login',
      name: 'Bank Mandiri Online',
      category: 'cat_finance',
      website: 'bankmandiri.co.id',
      username: 'irfan_mandiri',
      password: 'K#9m$2Px!vL8@qZ4',
      isFavorite: true,
      createdAt: past30,
      updatedAt: past30,
      passwordChangedAt: past30,
      customFields: [
        { id: generateId('field'), label: 'Account Number', value: '142-00-1928374-1', isSensitive: true },
        { id: generateId('field'), label: 'Branch', value: 'Sudirman Central', isSensitive: false }
      ],
      notes: 'Main payroll and operational checking account.',
      isDeleted: false,
      deletedAt: null
    }
  ];

  samples.forEach(s => vault.items.push(s));
  addActivityToVault(vault, createActivity(ACTIONS.ADD_ITEM, 'Sample Accounts', 'Loaded realistic demonstration accounts'));
  persistVault();
}

/* ============================================
   GLOBAL EVENT DELEGATION
   ============================================ */
function setupGlobalListeners() {
  // Document click delegation
  document.addEventListener('click', handleGlobalClick);

  // Document input / change delegation
  document.addEventListener('input', handleGlobalInput);
  document.addEventListener('change', handleGlobalChange);

  // Form submit delegation
  document.addEventListener('submit', handleGlobalSubmit);

  // Backup file input change listener
  const backupInput = document.getElementById('backup-file-input');
  if (backupInput) {
    backupInput.addEventListener('change', handleBackupFileSelect);
  }
}

/* ---------- CLICK HANDLER ---------- */
async function handleGlobalClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch (action) {
    case 'navigate': {
      e.preventDefault();
      const page = target.dataset.page;
      const id = target.dataset.id;
      navigateTo(page, { id });
      break;
    }

    case 'go-back': {
      e.preventDefault();
      goBack();
      break;
    }

    case 'lock-vault': {
      e.preventDefault();
      lockVault(false);
      break;
    }

    case 'toggle-password-visibility': {
      e.preventDefault();
      const targetId = target.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        target.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
        refreshIcons();
      }
      break;
    }

    case 'reveal-password': {
      e.preventDefault();
      const id = target.dataset.id;
      const displayEl = document.getElementById(`pw-display-${id}`);
      if (displayEl) {
        const isBlurred = displayEl.classList.contains('password-blurred');
        displayEl.classList.toggle('password-blurred', !isBlurred);
        displayEl.classList.toggle('password-masked', !isBlurred);
        target.innerHTML = `<i data-lucide="${isBlurred ? 'eye-off' : 'eye'}"></i>`;
        refreshIcons();

        if (isBlurred && vault) {
          addActivityToVault(vault, createActivity(ACTIONS.VIEW_PASSWORD, getItemById(vault, id)?.name, 'Viewed password'));
          persistVaultSilently();
        }
      }
      break;
    }

    case 'reveal-custom-field': {
      e.preventDefault();
      const fieldId = target.dataset.fieldId;
      const displayEl = document.getElementById(`cf-display-${fieldId}`);
      if (displayEl) {
        const isBlurred = displayEl.classList.contains('password-blurred');
        displayEl.classList.toggle('password-blurred', !isBlurred);
        displayEl.classList.toggle('password-masked', !isBlurred);
        target.innerHTML = `<i data-lucide="${isBlurred ? 'eye-off' : 'eye'}"></i>`;
        refreshIcons();
      }
      break;
    }

    case 'copy': {
      e.preventDefault();
      const value = target.dataset.value;
      const label = target.dataset.label || 'Value';
      const itemName = target.dataset.itemName;
      if (value) {
        const ok = await copyToClipboard(value);
        if (ok) {
          showToast(`${label} copied! (Clipboard auto-clears in 30s)`, 'success');

          // 30-second clipboard security wipe
          if (clipboardClearTimer) clearTimeout(clipboardClearTimer);
          clipboardClearTimer = setTimeout(async () => {
            try {
              await navigator.clipboard.writeText('');
            } catch (err) {
              // Ignore clipboard permissions
            }
          }, 30000);

          if (vault && label.toLowerCase().includes('password')) {
            addActivityToVault(vault, createActivity(ACTIONS.COPY_PASSWORD, itemName, 'Copied password'));
            persistVaultSilently();
          } else if (vault) {
            addActivityToVault(vault, createActivity(ACTIONS.COPY_FIELD, itemName, `Copied ${label}`));
            persistVaultSilently();
          }
        }
      }
      break;
    }

    case 'copy-generated': {
      e.preventDefault();
      const pwEl = document.getElementById('gen-password');
      if (pwEl && pwEl.textContent && pwEl.textContent !== 'Click Generate') {
        const ok = await copyToClipboard(pwEl.textContent);
        if (ok) {
          showToast('Generated password copied to clipboard!', 'success');
        }
      }
      break;
    }

    case 'generate-password': {
      e.preventDefault();
      updateGeneratedPasswordView();
      break;
    }

    case 'generate-inline': {
      e.preventDefault();
      const generated = generatePassword(generatorOptions);
      const pwInput = document.getElementById('item-password');
      if (pwInput) {
        pwInput.value = generated;
        pwInput.type = 'text'; // Reveal generated password so user can see it
        updateStrengthBar('item-strength-fill', generated);
        showToast('Strong password generated!', 'success');
      }
      break;
    }

    case 'toggle-favorite': {
      e.preventDefault();
      const id = target.dataset.id;
      if (!vault || !id) return;
      const isFav = toggleFavorite(vault, id);
      await persistVault();
      const item = getItemById(vault, id);
      showToast(isFav ? `Added "${item?.name}" to Favorites` : `Removed "${item?.name}" from Favorites`, 'info');
      navigateTo(currentPage, { id }, false);
      break;
    }

    case 'delete-item': {
      e.preventDefault();
      const id = target.dataset.id;
      const name = target.dataset.name || 'this account';
      showModal(renderConfirmModal(
        'Move to Recycle Bin',
        `Are you sure you want to move <strong>${escapeHtml(name)}</strong> to the Recycle Bin? You can restore it anytime within 30 days.`,
        'Move to Bin',
        `confirm-soft-delete" data-id="${id}" data-name="${escapeHtml(name)}`
      ));
      break;
    }

    case 'confirm-soft-delete': {
      e.preventDefault();
      const id = target.dataset.id;
      const name = target.dataset.name;
      if (vault && id) {
        softDeleteItem(vault, id);
        addActivityToVault(vault, createActivity(ACTIONS.DELETE_ITEM, name, 'Moved to Recycle Bin'));
        await persistVault();
        closeModal();
        showToast(`"${name}" moved to Recycle Bin`, 'info');
        navigateTo('vault', {}, false);
      }
      break;
    }

    case 'restore-item': {
      e.preventDefault();
      const id = target.dataset.id;
      if (vault && id) {
        restoreItem(vault, id);
        const item = getItemById(vault, id);
        addActivityToVault(vault, createActivity(ACTIONS.RESTORE_ITEM, item?.name, 'Restored from Recycle Bin'));
        await persistVault();
        showToast(`"${item?.name || 'Item'}" restored`, 'success');
        navigateTo('recycle', {}, false);
      }
      break;
    }

    case 'permanent-delete': {
      e.preventDefault();
      const id = target.dataset.id;
      const name = target.dataset.name || 'this account';
      showModal(renderConfirmModal(
        'Permanently Delete',
        `Are you sure you want to permanently destroy <strong>${escapeHtml(name)}</strong>? <span style="color:var(--danger)">This action cannot be reversed.</span>`,
        'Permanently Delete',
        `confirm-permanent-delete" data-id="${id}" data-name="${escapeHtml(name)}`
      ));
      break;
    }

    case 'confirm-permanent-delete': {
      e.preventDefault();
      const id = target.dataset.id;
      const name = target.dataset.name;
      if (vault && id) {
        permanentDeleteItem(vault, id);
        addActivityToVault(vault, createActivity(ACTIONS.PERMANENT_DELETE, name, 'Permanently erased'));
        await persistVault();
        closeModal();
        showToast(`"${name}" permanently deleted`, 'info');
        navigateTo('recycle', {}, false);
      }
      break;
    }

    case 'filter-category': {
      e.preventDefault();
      const catId = target.dataset.categoryId;
      navigateTo('vault', { filterCategory: catId });
      break;
    }

    case 'clear-category-filter': {
      e.preventDefault();
      filterCategory = '';
      navigateTo('vault', { filterCategory: '' }, false);
      break;
    }

    case 'show-add-category': {
      e.preventDefault();
      showModal(renderInputModal(
        'Add New Category',
        [
          { id: 'name', label: 'Category Name', placeholder: 'e.g., Subscriptions' },
          { id: 'icon', label: 'Icon / Emoji', placeholder: 'e.g., 💳, 🚀, 💼' }
        ],
        'Add Category',
        'submit-new-category'
      ));
      break;
    }

    case 'submit-new-category': {
      e.preventDefault();
      const nameInput = document.getElementById('modal-name');
      const iconInput = document.getElementById('modal-icon');
      const name = nameInput?.value.trim();
      const icon = iconInput?.value.trim() || '📁';

      if (!name) {
        showToast('Please enter a category name', 'warning');
        return;
      }

      addCategory(vault, name, icon);
      addActivityToVault(vault, createActivity(ACTIONS.ADD_CATEGORY, name, `Added category ${icon} ${name}`));
      await persistVault();
      closeModal();
      showToast(`Category "${name}" created!`, 'success');
      navigateTo('categories', {}, false);
      break;
    }

    case 'delete-category': {
      e.stopPropagation();
      e.preventDefault();
      const catId = target.dataset.categoryId;
      const catName = target.dataset.categoryName || 'Category';
      showModal(renderConfirmModal(
        'Remove Category',
        `Are you sure you want to remove <strong>${escapeHtml(catName)}</strong>? Accounts in this category will not be deleted.`,
        'Remove',
        `confirm-delete-category" data-category-id="${catId}" data-category-name="${escapeHtml(catName)}`
      ));
      break;
    }

    case 'confirm-delete-category': {
      e.preventDefault();
      const catId = target.dataset.categoryId;
      const catName = target.dataset.categoryName;
      if (vault && catId) {
        removeCategory(vault, catId);
        await persistVault();
        closeModal();
        showToast(`Category "${catName}" removed`, 'info');
        navigateTo('categories', {}, false);
      }
      break;
    }

    case 'show-security-detail': {
      e.preventDefault();
      const type = target.dataset.type;
      const active = getActiveItems(vault);
      let issueItems = [];
      let issueTitle = 'Security Issue';

      if (type === 'weak') {
        issueItems = findWeakPasswords(active);
        issueTitle = 'Weak Passwords';
      } else if (type === 'reused') {
        issueItems = findReusedPasswords(active).flatMap(g => g.items);
        issueTitle = 'Reused Passwords';
      } else if (type === 'old') {
        issueItems = findOldPasswords(active, vault?.settings?.passwordReminderDays || 180);
        issueTitle = 'Old Passwords (> 180 days)';
      }

      const listHtml = issueItems.length > 0
        ? issueItems.map(item => `
          <div class="account-item card-clickable" data-action="navigate" data-page="detail" data-id="${item.id}" onclick="document.getElementById('modal-container').innerHTML=''" style="margin-bottom:var(--sp-2);">
            <div class="account-info">
              <div class="account-name">${escapeHtml(item.name)}</div>
              <div class="account-meta">${escapeHtml(item.username || item.website || '')}</div>
            </div>
            <i data-lucide="chevron-right" class="text-muted"></i>
          </div>
        `).join('')
        : '<p class="text-muted text-center">No affected accounts found.</p>';

      showModal(`
        <div class="modal-overlay" data-action="close-modal">
          <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">⚠️ ${issueTitle} (${issueItems.length})</h3>
              <button class="btn-icon" data-action="close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
              <p class="text-xs text-secondary mb-4">Click any account below to update its password to a stronger, unique one.</p>
              ${listHtml}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-action="close-modal">Close</button>
            </div>
          </div>
        </div>
      `);
      break;
    }

    case 'add-custom-field': {
      e.preventDefault();
      const container = document.getElementById('custom-fields-container');
      if (!container) return;
      const idx = container.querySelectorAll('.custom-field-item').length;
      const div = document.createElement('div');
      div.className = 'custom-field-item';
      div.dataset.fieldIdx = idx;
      div.innerHTML = `
        <div class="input-group" style="flex:1">
          <label class="input-label">Label</label>
          <input type="text" class="input-field custom-field-label" placeholder="e.g., PIN, Recovery Key">
        </div>
        <div class="input-group" style="flex:1">
          <label class="input-label">Value</label>
          <input type="text" class="input-field custom-field-value" placeholder="Enter value">
        </div>
        <div class="input-group">
          <label class="input-label">Sensitive</label>
          <label class="checkbox" style="margin-top: 6px;">
            <input type="checkbox" class="custom-field-sensitive">
            <span class="checkbox-box"></span>
          </label>
        </div>
        <button type="button" class="btn btn-ghost btn-icon custom-field-remove" data-action="remove-custom-field" data-idx="${idx}" style="margin-top: 24px;">
          <i data-lucide="x"></i>
        </button>
      `;
      container.appendChild(div);
      refreshIcons();
      break;
    }

    case 'remove-custom-field': {
      e.preventDefault();
      const row = target.closest('.custom-field-item');
      if (row) row.remove();
      break;
    }

    case 'export-backup': {
      e.preventDefault();
      exportVault();
      if (vault) {
        addActivityToVault(vault, createActivity(ACTIONS.EXPORT_BACKUP, null, 'Exported encrypted vault file'));
        persistVaultSilently();
      }
      showToast('Encrypted backup downloaded successfully!', 'success');
      break;
    }

    case 'import-backup': {
      e.preventDefault();
      const fileInput = document.getElementById('backup-file-input');
      if (fileInput) fileInput.click();
      break;
    }

    case 'show-change-password': {
      e.preventDefault();
      showModal(renderInputModal(
        'Change Master Password',
        [
          { id: 'curr-pass', label: 'Current Master Password', type: 'password', placeholder: 'Enter current password' },
          { id: 'new-pass', label: 'New Master Password', type: 'password', placeholder: 'At least 8 characters' },
          { id: 'conf-pass', label: 'Confirm New Password', type: 'password', placeholder: 'Confirm new password' }
        ],
        'Update Password',
        'submit-change-password'
      ));
      break;
    }

    case 'submit-change-password': {
      e.preventDefault();
      const curr = document.getElementById('modal-curr-pass')?.value;
      const newP = document.getElementById('modal-new-pass')?.value;
      const conf = document.getElementById('modal-conf-pass')?.value;

      if (!curr || !newP || !conf) {
        showToast('Please fill in all password fields', 'warning');
        return;
      }
      if (newP.length < 8) {
        showToast('New password must be at least 8 characters', 'warning');
        return;
      }
      if (newP !== conf) {
        showToast('New passwords do not match', 'error');
        return;
      }

      try {
        // Verify current password
        await unlockVault(curr);

        // Derive and re-encrypt
        encryptionKey = await changeMasterPassword(newP, vault);
        addActivityToVault(vault, createActivity(ACTIONS.CHANGE_PASSWORD, null, 'Changed master password'));
        await persistVault();

        closeModal();
        showToast('Master password changed successfully!', 'success');
      } catch (err) {
        showToast('Current master password is incorrect', 'error');
      }
      break;
    }

    case 'show-autolock-setting': {
      e.preventDefault();
      const currentVal = vault?.settings?.autoLockMinutes ?? 5;
      showModal(renderInputModal(
        'Auto Lock Timeout',
        [
          {
            id: 'autolock-val',
            label: 'Inactivity Duration',
            type: 'select',
            options: [
              { value: '1', label: '1 minute' },
              { value: '5', label: '5 minutes (Recommended)' },
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '0', label: 'Never (Not recommended)' }
            ],
            value: String(currentVal)
          }
        ],
        'Save Timeout',
        'submit-autolock-setting'
      ));
      const select = document.getElementById('modal-autolock-val');
      if (select) select.value = String(currentVal);
      break;
    }

    case 'submit-autolock-setting': {
      e.preventDefault();
      const select = document.getElementById('modal-autolock-val');
      const val = parseInt(select?.value || '5', 10);
      if (vault) {
        vault.settings.autoLockMinutes = val;
        await persistVault();
        resetAutoLockTimer();
        closeModal();
        showToast(`Auto-lock set to ${val === 0 ? 'Never' : `${val} minutes`}`, 'success');
        navigateTo('settings', {}, false);
      }
      break;
    }

    case 'show-reminder-setting': {
      e.preventDefault();
      const currentVal = vault?.settings?.passwordReminderDays ?? 180;
      showModal(renderInputModal(
        'Password Age Reminder',
        [
          {
            id: 'reminder-val',
            label: 'Remind me to change passwords after:',
            type: 'select',
            options: [
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: '180', label: '180 days (Recommended)' },
              { value: '365', label: '1 year' },
              { value: '0', label: 'Never' }
            ],
            value: String(currentVal)
          }
        ],
        'Save Reminder',
        'submit-reminder-setting'
      ));
      const select = document.getElementById('modal-reminder-val');
      if (select) select.value = String(currentVal);
      break;
    }

    case 'submit-reminder-setting': {
      e.preventDefault();
      const select = document.getElementById('modal-reminder-val');
      const val = parseInt(select?.value || '180', 10);
      if (vault) {
        vault.settings.passwordReminderDays = val;
        await persistVault();
        closeModal();
        showToast(`Reminder interval set to ${val === 0 ? 'Never' : `${val} days`}`, 'success');
        navigateTo('settings', {}, false);
      }
      break;
    }

    case 'load-sample-data': {
      e.preventDefault();
      loadSampleData();
      showToast('Loaded 4 realistic demo accounts!', 'success');
      navigateTo('dashboard', {}, false);
      break;
    }

    case 'close-modal': {
      e.preventDefault();
      closeModal();
      break;
    }
  }
}

/* ---------- INPUT HANDLER ---------- */
function handleGlobalInput(e) {
  const target = e.target;

  // Master password setup live strength
  if (target.id === 'setup-password') {
    updateStrengthBar('setup-strength-fill', target.value);
  }

  // Add/Edit item live password strength
  if (target.id === 'item-password') {
    updateStrengthBar('item-strength-fill', target.value);
  }

  // Live Password generator slider
  if (target.dataset.action === 'gen-update') {
    updateGeneratedPasswordView();
  }

  // Dashboard global search
  if (target.id === 'dashboard-search') {
    debounceSearch(target.value);
  }

  // Vault search
  if (target.id === 'vault-search') {
    debounceVaultSearch(target.value);
  }
}

const debounceSearch = debounce((query) => {
  searchQuery = query;
  navigateTo('vault', { searchQuery: query });
}, 250);

const debounceVaultSearch = debounce((query) => {
  searchQuery = query;
  const container = document.getElementById('page-container');
  if (container && vault) {
    container.innerHTML = renderVaultPage(vault, searchQuery, sortBy, filterCategory);
    refreshIcons();
    const input = document.getElementById('vault-search');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}, 250);

/* ---------- CHANGE HANDLER ---------- */
function handleGlobalChange(e) {
  const target = e.target;

  // Vault Sort change
  if (target.id === 'vault-sort') {
    sortBy = target.value;
    navigateTo('vault', { sortBy }, false);
  }

  // Vault Category filter select
  if (target.id === 'vault-category-filter') {
    filterCategory = target.value;
    navigateTo('vault', { filterCategory }, false);
  }
}

/* ---------- FORM SUBMIT HANDLER ---------- */
async function handleGlobalSubmit(e) {
  e.preventDefault();
  const form = e.target;

  // 1. UNLOCK VAULT
  if (form.id === 'auth-form') {
    const pwInput = document.getElementById('master-password');
    const errEl = document.getElementById('auth-error');
    const cardEl = document.getElementById('auth-card');
    const iconEl = document.getElementById('auth-icon');
    const password = pwInput?.value;

    if (!password) {
      if (errEl) errEl.textContent = 'Please enter your master password';
      return;
    }

    try {
      const result = await unlockVault(password);
      vault = result.vault;
      encryptionKey = result.key;

      if (iconEl) iconEl.classList.add('unlocked');

      // Purge old soft-deleted items (> 30 days)
      purgeOldDeleted(vault, 30);

      // Log login
      addActivityToVault(vault, createActivity(ACTIONS.UNLOCK, null, 'Vault unlocked successfully'));
      await persistVaultSilently();

      // Fade out auth screen and reveal app
      const authScreen = document.getElementById('auth-screen');
      const appScreen = document.getElementById('app');

      setTimeout(() => {
        if (authScreen) authScreen.classList.add('hidden');
        if (appScreen) appScreen.classList.add('active');
        resetAutoLockTimer();
        navigateTo('dashboard', {}, false);
        showToast(`Welcome back, ${vault.settings.userName || 'User'}!`, 'success');
      }, 300);

    } catch (err) {
      if (errEl) errEl.textContent = 'Incorrect master password. Please try again.';
      if (cardEl) {
        cardEl.classList.add('shake');
        setTimeout(() => cardEl.classList.remove('shake'), 400);
      }
      if (pwInput) {
        pwInput.value = '';
        pwInput.focus();
      }
    }
  }

  // 2. SETUP FIRST-TIME VAULT
  else if (form.id === 'setup-form') {
    const nameInput = document.getElementById('setup-name');
    const passInput = document.getElementById('setup-password');
    const confInput = document.getElementById('setup-confirm');
    const errEl = document.getElementById('auth-error');
    const cardEl = document.getElementById('auth-card');

    const name = nameInput?.value.trim() || 'User';
    const password = passInput?.value || '';
    const confirm = confInput?.value || '';

    if (password.length < 8) {
      if (errEl) errEl.textContent = 'Password must be at least 8 characters long';
      return;
    }

    if (password !== confirm) {
      if (errEl) errEl.textContent = 'Passwords do not match';
      if (cardEl) {
        cardEl.classList.add('shake');
        setTimeout(() => cardEl.classList.remove('shake'), 400);
      }
      return;
    }

    try {
      vault = createEmptyVault(name);
      encryptionKey = await initializeVault(password, vault);

      // Automatically load demo sample items so the app is instantly rich and demonstrative!
      loadSampleData();

      const authScreen = document.getElementById('auth-screen');
      const appScreen = document.getElementById('app');

      if (authScreen) authScreen.classList.add('hidden');
      if (appScreen) appScreen.classList.add('active');

      resetAutoLockTimer();
      navigateTo('dashboard', {}, false);
      showToast(`Personal Vault initialized! Welcome, ${name}.`, 'success');

    } catch (err) {
      console.error('Error creating vault:', err);
      if (errEl) errEl.textContent = 'Failed to create vault: ' + err.message;
    }
  }

  // 3. ADD / EDIT ACCOUNT ITEM
  else if (form.id === 'item-form') {
    const isEdit = !!document.getElementById('item-id');
    const itemId = document.getElementById('item-id')?.value;
    const name = document.getElementById('item-name')?.value.trim();
    const category = document.getElementById('item-category')?.value || '';
    const username = document.getElementById('item-username')?.value.trim() || '';
    const password = document.getElementById('item-password')?.value || '';
    const website = document.getElementById('item-website')?.value.trim() || '';
    const notes = document.getElementById('item-notes')?.value || '';

    if (!name) {
      showToast('Account name is required', 'warning');
      return;
    }

    // Collect custom fields
    const customFields = [];
    document.querySelectorAll('.custom-field-item').forEach(el => {
      const label = el.querySelector('.custom-field-label')?.value.trim();
      const value = el.querySelector('.custom-field-value')?.value || '';
      const isSensitive = el.querySelector('.custom-field-sensitive')?.checked || false;
      if (label) {
        customFields.push({ id: generateId('field'), label, value, isSensitive });
      }
    });

    const itemData = {
      name,
      category,
      username,
      password,
      website,
      notes,
      customFields
    };

    if (isEdit && itemId) {
      const updated = updateItem(vault, itemId, itemData);
      addActivityToVault(vault, createActivity(ACTIONS.EDIT_ITEM, name, 'Updated account information'));
      await persistVault();
      showToast(`"${name}" updated successfully!`, 'success');
      navigateTo('detail', { id: itemId });
    } else {
      const newItem = addItem(vault, itemData);
      addActivityToVault(vault, createActivity(ACTIONS.ADD_ITEM, name, 'Added new account'));
      await persistVault();
      showToast(`"${name}" added to your vault!`, 'success');
      navigateTo('detail', { id: newItem.id });
    }
  }
}

/* ---------- BACKUP RESTORE HANDLER ---------- */
async function handleBackupFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    await importVault(file);
    showToast('Backup successfully imported! Please unlock with the backup master password.', 'success');
    lockVault();
  } catch (err) {
    showToast('Failed to import backup: ' + err.message, 'error');
  } finally {
    e.target.value = ''; // Reset input
  }
}
