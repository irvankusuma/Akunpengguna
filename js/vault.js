/* ============================================
   VAULT — Data Model & CRUD Operations
   ============================================ */

import { generateId, getCategoryIcon } from './utils.js';

/**
 * Default categories
 */
export function getDefaultCategories() {
  return [
    { id: 'cat_email', name: 'Email', icon: '📧', isDefault: true },
    { id: 'cat_social', name: 'Social Media', icon: '📱', isDefault: true },
    { id: 'cat_finance', name: 'Finance', icon: '💰', isDefault: true },
    { id: 'cat_marketplace', name: 'Marketplace', icon: '🛒', isDefault: true },
    { id: 'cat_gaming', name: 'Gaming', icon: '🎮', isDefault: true },
    { id: 'cat_work', name: 'Work', icon: '💼', isDefault: true },
    { id: 'cat_education', name: 'Education', icon: '🎓', isDefault: true },
    { id: 'cat_website', name: 'Website', icon: '🌐', isDefault: true },
    { id: 'cat_other', name: 'Other', icon: '🔑', isDefault: true },
  ];
}

/**
 * Create an empty vault
 */
export function createEmptyVault(userName = 'User') {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      userName,
      autoLockMinutes: 5,
      passwordReminderDays: 180,
      clipboardClearSeconds: 30,
    },
    categories: getDefaultCategories(),
    items: [],
    activityLog: [],
  };
}

/**
 * Add a new item to the vault
 */
export function addItem(vault, itemData) {
  const now = new Date().toISOString();
  const item = {
    id: generateId('item'),
    type: itemData.type || 'login',
    name: itemData.name || '',
    category: itemData.category || '',
    website: itemData.website || '',
    username: itemData.username || '',
    password: itemData.password || '',
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    passwordChangedAt: now,
    customFields: itemData.customFields || [],
    notes: itemData.notes || '',
    isDeleted: false,
    deletedAt: null,
  };

  vault.items.push(item);
  vault.updatedAt = now;
  return item;
}

/**
 * Update an existing item
 */
export function updateItem(vault, itemId, updates) {
  const item = vault.items.find(i => i.id === itemId);
  if (!item) return null;

  const now = new Date().toISOString();

  // Track if password changed
  if (updates.password && updates.password !== item.password) {
    updates.passwordChangedAt = now;
  }

  Object.assign(item, updates, { updatedAt: now });
  vault.updatedAt = now;
  return item;
}

/**
 * Soft delete an item (move to recycle bin)
 */
export function softDeleteItem(vault, itemId) {
  const item = vault.items.find(i => i.id === itemId);
  if (!item) return false;

  item.isDeleted = true;
  item.deletedAt = new Date().toISOString();
  vault.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Restore a soft-deleted item
 */
export function restoreItem(vault, itemId) {
  const item = vault.items.find(i => i.id === itemId);
  if (!item) return false;

  item.isDeleted = false;
  item.deletedAt = null;
  vault.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Permanently delete an item
 */
export function permanentDeleteItem(vault, itemId) {
  const idx = vault.items.findIndex(i => i.id === itemId);
  if (idx === -1) return false;

  vault.items.splice(idx, 1);
  vault.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Purge items deleted more than N days ago
 */
export function purgeOldDeleted(vault, days = 30) {
  const now = Date.now();
  const threshold = days * 24 * 60 * 60 * 1000;

  vault.items = vault.items.filter(item => {
    if (!item.isDeleted) return true;
    const deletedTime = new Date(item.deletedAt).getTime();
    return (now - deletedTime) < threshold;
  });

  vault.updatedAt = new Date().toISOString();
}

/**
 * Get all active (non-deleted) items
 */
export function getActiveItems(vault) {
  return vault.items.filter(i => !i.isDeleted);
}

/**
 * Get all deleted items
 */
export function getDeletedItems(vault) {
  return vault.items.filter(i => i.isDeleted);
}

/**
 * Get favorite items
 */
export function getFavorites(vault) {
  return vault.items.filter(i => !i.isDeleted && i.isFavorite);
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(vault, itemId) {
  const item = vault.items.find(i => i.id === itemId);
  if (!item) return false;

  item.isFavorite = !item.isFavorite;
  vault.updatedAt = new Date().toISOString();
  return item.isFavorite;
}

/**
 * Get items by category
 */
export function getItemsByCategory(vault, categoryId) {
  return vault.items.filter(i => !i.isDeleted && i.category === categoryId);
}

/**
 * Search items across all fields
 */
export function searchItems(vault, query) {
  if (!query || query.trim() === '') return getActiveItems(vault);

  const q = query.toLowerCase().trim();

  return vault.items.filter(item => {
    if (item.isDeleted) return false;

    // Search in main fields
    if (item.name && item.name.toLowerCase().includes(q)) return true;
    if (item.username && item.username.toLowerCase().includes(q)) return true;
    if (item.website && item.website.toLowerCase().includes(q)) return true;
    if (item.notes && item.notes.toLowerCase().includes(q)) return true;

    // Search in category name
    const cat = vault.categories.find(c => c.id === item.category);
    if (cat && cat.name.toLowerCase().includes(q)) return true;

    // Search in custom fields
    if (item.customFields) {
      for (const field of item.customFields) {
        if (field.label && field.label.toLowerCase().includes(q)) return true;
        if (field.value && !field.isSensitive && field.value.toLowerCase().includes(q)) return true;
      }
    }

    return false;
  });
}

/**
 * Add a custom category
 */
export function addCategory(vault, name, icon) {
  const cat = {
    id: generateId('cat'),
    name,
    icon: icon || getCategoryIcon(name),
    isDefault: false
  };
  vault.categories.push(cat);
  vault.updatedAt = new Date().toISOString();
  return cat;
}

/**
 * Remove a custom category
 */
export function removeCategory(vault, categoryId) {
  const cat = vault.categories.find(c => c.id === categoryId);
  if (!cat || cat.isDefault) return false;

  vault.categories = vault.categories.filter(c => c.id !== categoryId);

  // Move items in this category to 'Other'
  vault.items.forEach(item => {
    if (item.category === categoryId) {
      item.category = 'cat_other';
    }
  });

  vault.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Get a category by ID
 */
export function getCategoryById(vault, categoryId) {
  return vault.categories.find(c => c.id === categoryId);
}

/**
 * Get item count per category
 */
export function getCategoryCounts(vault) {
  const counts = {};
  vault.categories.forEach(cat => { counts[cat.id] = 0; });

  vault.items.forEach(item => {
    if (!item.isDeleted && counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  });

  return counts;
}

/**
 * Sort items by name, date created, or date updated
 */
export function sortItems(items, sortBy = 'name') {
  const sorted = [...items];
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'created':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'updated':
      return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    default:
      return sorted;
  }
}

/**
 * Add an activity to the vault's log
 */
export function addActivityToVault(vault, activity) {
  vault.activityLog.push(activity);
  // Keep only last 500 entries
  if (vault.activityLog.length > 500) {
    vault.activityLog = vault.activityLog.slice(-500);
  }
}

/**
 * Get an item by ID
 */
export function getItemById(vault, itemId) {
  return vault.items.find(i => i.id === itemId);
}
