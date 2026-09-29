/* ============================================
   ACTIVITY — Activity Logging
   ============================================ */

import { formatDateGroup, formatTime } from './utils.js';

/**
 * Activity action types
 */
export const ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  VIEW_PASSWORD: 'view_password',
  COPY_PASSWORD: 'copy_password',
  COPY_FIELD: 'copy_field',
  ADD_ITEM: 'add_item',
  EDIT_ITEM: 'edit_item',
  DELETE_ITEM: 'delete_item',
  RESTORE_ITEM: 'restore_item',
  PERMANENT_DELETE: 'permanent_delete',
  ADD_CATEGORY: 'add_category',
  CHANGE_PASSWORD: 'change_master',
  EXPORT_BACKUP: 'export_backup',
  IMPORT_BACKUP: 'import_backup',
};

/**
 * Create an activity log entry
 */
export function createActivity(action, itemName = null, details = '') {
  return {
    id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    itemName,
    details
  };
}

/**
 * Get action display label
 */
export function getActionLabel(action) {
  const labels = {
    [ACTIONS.LOGIN]: 'Vault created',
    [ACTIONS.LOGOUT]: 'Logged out',
    [ACTIONS.LOCK]: 'Vault locked',
    [ACTIONS.UNLOCK]: 'Vault unlocked',
    [ACTIONS.VIEW_PASSWORD]: 'Password viewed',
    [ACTIONS.COPY_PASSWORD]: 'Password copied',
    [ACTIONS.COPY_FIELD]: 'Field copied',
    [ACTIONS.ADD_ITEM]: 'Account added',
    [ACTIONS.EDIT_ITEM]: 'Account updated',
    [ACTIONS.DELETE_ITEM]: 'Account deleted',
    [ACTIONS.RESTORE_ITEM]: 'Account restored',
    [ACTIONS.PERMANENT_DELETE]: 'Account permanently deleted',
    [ACTIONS.ADD_CATEGORY]: 'Category added',
    [ACTIONS.CHANGE_PASSWORD]: 'Master password changed',
    [ACTIONS.EXPORT_BACKUP]: 'Backup exported',
    [ACTIONS.IMPORT_BACKUP]: 'Backup imported',
  };
  return labels[action] || action;
}

/**
 * Get the Lucide icon name for an action
 */
export function getActionIcon(action) {
  const icons = {
    [ACTIONS.LOGIN]: 'key-round',
    [ACTIONS.LOGOUT]: 'log-out',
    [ACTIONS.LOCK]: 'lock',
    [ACTIONS.UNLOCK]: 'lock-open',
    [ACTIONS.VIEW_PASSWORD]: 'eye',
    [ACTIONS.COPY_PASSWORD]: 'clipboard-check',
    [ACTIONS.COPY_FIELD]: 'clipboard',
    [ACTIONS.ADD_ITEM]: 'plus-circle',
    [ACTIONS.EDIT_ITEM]: 'edit-3',
    [ACTIONS.DELETE_ITEM]: 'trash-2',
    [ACTIONS.RESTORE_ITEM]: 'rotate-ccw',
    [ACTIONS.PERMANENT_DELETE]: 'x-circle',
    [ACTIONS.ADD_CATEGORY]: 'folder-plus',
    [ACTIONS.CHANGE_PASSWORD]: 'shield-check',
    [ACTIONS.EXPORT_BACKUP]: 'download',
    [ACTIONS.IMPORT_BACKUP]: 'upload',
  };
  return icons[action] || 'activity';
}

/**
 * Get timeline dot CSS class for an action
 */
export function getActionDotClass(action) {
  const classes = {
    [ACTIONS.LOGIN]: 'login',
    [ACTIONS.UNLOCK]: 'login',
    [ACTIONS.LOGOUT]: 'lock',
    [ACTIONS.LOCK]: 'lock',
    [ACTIONS.VIEW_PASSWORD]: 'view',
    [ACTIONS.COPY_PASSWORD]: 'copy',
    [ACTIONS.COPY_FIELD]: 'copy',
    [ACTIONS.ADD_ITEM]: 'add',
    [ACTIONS.EDIT_ITEM]: 'edit',
    [ACTIONS.DELETE_ITEM]: 'delete',
    [ACTIONS.RESTORE_ITEM]: 'add',
    [ACTIONS.PERMANENT_DELETE]: 'delete',
    [ACTIONS.ADD_CATEGORY]: 'add',
    [ACTIONS.CHANGE_PASSWORD]: 'login',
    [ACTIONS.EXPORT_BACKUP]: 'copy',
    [ACTIONS.IMPORT_BACKUP]: 'add',
  };
  return classes[action] || '';
}

/**
 * Group activities by date for timeline display
 */
export function groupActivitiesByDate(activities) {
  if (!activities || activities.length === 0) return [];

  // Sort newest first
  const sorted = [...activities].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const groups = [];
  let currentLabel = null;

  sorted.forEach(activity => {
    const label = formatDateGroup(activity.timestamp);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, activities: [] });
    }
    groups[groups.length - 1].activities.push(activity);
  });

  return groups;
}
