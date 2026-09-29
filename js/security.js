/* ============================================
   SECURITY — Password Strength & Vault Scoring
   ============================================ */

import { daysBetween } from './utils.js';

/**
 * Calculate password strength score (0–100)
 */
export function calculatePasswordStrength(password) {
  if (!password) return 0;

  let score = 0;

  // Length score (up to 30 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;
  if (password.length >= 20) score += 5;

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Unique characters ratio (up to 15 points)
  const uniqueRatio = new Set(password.split('')).size / password.length;
  score += Math.round(uniqueRatio * 15);

  // Penalty for common patterns (up to -20 points)
  if (/^[a-z]+$/i.test(password)) score -= 10; // only letters
  if (/^[0-9]+$/.test(password)) score -= 15; // only numbers
  if (/(.)\1{2,}/.test(password)) score -= 10; // repeated chars
  if (/^(123|abc|qwerty|password|admin)/i.test(password)) score -= 20;
  if (password.length < 6) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get strength label from score
 */
export function getStrengthLabel(score) {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Weak';
}

/**
 * Get strength CSS class from score
 */
export function getStrengthClass(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'weak';
}

/**
 * Get strength color from score
 */
export function getStrengthColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--info)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

/**
 * Calculate overall vault security score (0–100)
 */
export function calculateSecurityScore(items) {
  if (!items || items.length === 0) return 100;

  // Only score items that have passwords
  const withPasswords = items.filter(i => i.password && !i.isDeleted);
  if (withPasswords.length === 0) return 100;

  // Average password strength (60% weight)
  const avgStrength = withPasswords.reduce((sum, item) =>
    sum + calculatePasswordStrength(item.password), 0) / withPasswords.length;

  // Reuse penalty (25% weight) — more reuse = lower score
  const reused = findReusedPasswords(items);
  const reusedCount = reused.reduce((sum, group) => sum + group.items.length, 0);
  const reusePenalty = withPasswords.length > 0
    ? (reusedCount / withPasswords.length) * 100
    : 0;

  // Age penalty (15% weight)
  const old = findOldPasswords(items, 180);
  const agePenalty = withPasswords.length > 0
    ? (old.length / withPasswords.length) * 100
    : 0;

  const score = (avgStrength * 0.6) + ((100 - reusePenalty) * 0.25) + ((100 - agePenalty) * 0.15);

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Find items with weak passwords (score < 40)
 */
export function findWeakPasswords(items) {
  return (items || [])
    .filter(i => !i.isDeleted && i.password)
    .filter(i => calculatePasswordStrength(i.password) < 40);
}

/**
 * Find groups of items that share the same password
 */
export function findReusedPasswords(items) {
  const active = (items || []).filter(i => !i.isDeleted && i.password);
  const groups = {};

  active.forEach(item => {
    const pw = item.password;
    if (!groups[pw]) groups[pw] = [];
    groups[pw].push(item);
  });

  return Object.values(groups)
    .filter(group => group.length > 1)
    .map(group => ({
      password: '●'.repeat(8),
      items: group,
      count: group.length
    }));
}

/**
 * Find items with old passwords (not changed in N days)
 */
export function findOldPasswords(items, thresholdDays = 180) {
  const now = new Date().toISOString();
  return (items || [])
    .filter(i => !i.isDeleted && i.password)
    .filter(i => {
      const changed = i.passwordChangedAt || i.createdAt;
      return daysBetween(changed, now) > thresholdDays;
    });
}

/**
 * Get all security issues for the vault
 */
export function getSecurityIssues(items) {
  const weak = findWeakPasswords(items);
  const reused = findReusedPasswords(items);
  const old = findOldPasswords(items, 180);

  const issues = [];

  if (weak.length > 0) {
    issues.push({
      type: 'weak',
      severity: 'danger',
      title: 'Weak Passwords',
      count: weak.length,
      items: weak,
      icon: 'shield-alert'
    });
  }

  if (reused.length > 0) {
    const totalReused = reused.reduce((sum, g) => sum + g.count, 0);
    issues.push({
      type: 'reused',
      severity: 'warning',
      title: 'Reused Passwords',
      count: totalReused,
      items: reused.flatMap(g => g.items),
      icon: 'copy'
    });
  }

  if (old.length > 0) {
    issues.push({
      type: 'old',
      severity: 'warning',
      title: 'Old Passwords',
      count: old.length,
      items: old,
      icon: 'clock'
    });
  }

  return issues;
}
