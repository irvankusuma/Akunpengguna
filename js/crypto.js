/* ============================================
   CRYPTO — Encryption & Key Derivation
   Uses Web Crypto API (AES-256-GCM + PBKDF2)
   ============================================ */

const STORAGE_SALT_KEY = 'pv_salt';
const STORAGE_VAULT_KEY = 'pv_vault';
const STORAGE_CHECK_KEY = 'pv_check';
const PBKDF2_ITERATIONS = 100000;

/**
 * Generate a random salt (16 bytes)
 */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random IV (12 bytes for GCM)
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derive an AES-256-GCM key from a password using PBKDF2
 */
export async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-256-GCM
 * Returns: { iv: base64, data: base64 }
 */
export async function encrypt(plaintext, key) {
  const encoder = new TextEncoder();
  const iv = generateIV();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(ciphertext)
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decrypt(encrypted, key) {
  const iv = base64ToArrayBuffer(encrypted.iv);
  const data = base64ToArrayBuffer(encrypted.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if vault has been initialized
 */
export function isVaultInitialized() {
  return localStorage.getItem(STORAGE_SALT_KEY) !== null
    && localStorage.getItem(STORAGE_VAULT_KEY) !== null;
}

/**
 * Initialize a new vault with a master password
 */
export async function initializeVault(password, vaultData) {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);

  // Encrypt vault data
  const json = JSON.stringify(vaultData);
  const encrypted = await encrypt(json, key);

  // Encrypt a known check string to verify password later
  const check = await encrypt('vault_check_ok', key);

  // Store salt and encrypted vault
  localStorage.setItem(STORAGE_SALT_KEY, arrayBufferToBase64(salt));
  localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(encrypted));
  localStorage.setItem(STORAGE_CHECK_KEY, JSON.stringify(check));

  return key;
}

/**
 * Unlock the vault with a master password
 * Returns: { key, vault } or throws on wrong password
 */
export async function unlockVault(password) {
  const saltB64 = localStorage.getItem(STORAGE_SALT_KEY);
  const vaultB64 = localStorage.getItem(STORAGE_VAULT_KEY);
  const checkB64 = localStorage.getItem(STORAGE_CHECK_KEY);

  if (!saltB64 || !vaultB64) {
    throw new Error('No vault found');
  }

  const salt = base64ToArrayBuffer(saltB64);
  const key = await deriveKey(password, new Uint8Array(salt));

  // Verify password by decrypting check string
  if (checkB64) {
    try {
      const checkEncrypted = JSON.parse(checkB64);
      const checkResult = await decrypt(checkEncrypted, key);
      if (checkResult !== 'vault_check_ok') {
        throw new Error('Wrong password');
      }
    } catch (e) {
      throw new Error('Wrong password');
    }
  }

  // Decrypt vault
  try {
    const encryptedVault = JSON.parse(vaultB64);
    const json = await decrypt(encryptedVault, key);
    const vault = JSON.parse(json);
    return { key, vault };
  } catch (e) {
    throw new Error('Wrong password');
  }
}

/**
 * Save the vault (encrypt and persist)
 */
export async function saveVault(vaultData, key) {
  const json = JSON.stringify(vaultData);
  const encrypted = await encrypt(json, key);
  localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(encrypted));
}

/**
 * Change master password
 */
export async function changeMasterPassword(newPassword, vaultData) {
  const salt = generateSalt();
  const key = await deriveKey(newPassword, salt);

  const json = JSON.stringify(vaultData);
  const encrypted = await encrypt(json, key);
  const check = await encrypt('vault_check_ok', key);

  localStorage.setItem(STORAGE_SALT_KEY, arrayBufferToBase64(salt));
  localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(encrypted));
  localStorage.setItem(STORAGE_CHECK_KEY, JSON.stringify(check));

  return key;
}

/**
 * Export vault as encrypted backup file
 */
export function exportVault() {
  const salt = localStorage.getItem(STORAGE_SALT_KEY);
  const vault = localStorage.getItem(STORAGE_VAULT_KEY);
  const check = localStorage.getItem(STORAGE_CHECK_KEY);

  const backup = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'PersonalVault',
    salt, vault, check
  });

  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `personal-vault-backup-${new Date().toISOString().slice(0, 10)}.pvault`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import vault from backup file
 */
export async function importVault(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (backup.app !== 'PersonalVault') {
          reject(new Error('Invalid backup file'));
          return;
        }
        localStorage.setItem(STORAGE_SALT_KEY, backup.salt);
        localStorage.setItem(STORAGE_VAULT_KEY, backup.vault);
        localStorage.setItem(STORAGE_CHECK_KEY, backup.check);
        resolve(true);
      } catch (err) {
        reject(new Error('Could not read backup file'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

/**
 * Completely wipe vault data
 */
export function destroyVault() {
  localStorage.removeItem(STORAGE_SALT_KEY);
  localStorage.removeItem(STORAGE_VAULT_KEY);
  localStorage.removeItem(STORAGE_CHECK_KEY);
}


/* ---------- Helpers ---------- */

function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
