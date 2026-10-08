/* ============================================
   CLOUD — Firebase Auth + Firestore (zero-knowledge)
   Hanya blob TERENKRIPSI (salt/vault/check) yang dikirim ke server.
   Kata Sandi Utama & kunci enkripsi tidak pernah meninggalkan perangkat.
   ============================================ */

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const VAULT_COLLECTION = 'vaults';
const CLOUD_TIMEOUT_MS = 10000;

function vaultRef(uid) {
  return doc(db, VAULT_COLLECTION, uid);
}

/* Batasi waktu tunggu operasi Firestore agar UI tidak pernah menggantung lama. */
function withTimeout(promise, ms = CLOUD_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('Waktu koneksi ke cloud habis.');
      err.code = 'cloud/timeout';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Berlangganan perubahan status login. cb(user|null) dipanggil saat load & login/logout. */
export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

/** Pengguna yang sedang login (atau null). */
export function getCurrentUser() {
  return auth.currentUser;
}

/** Daftar akun baru dengan email + password. */
export async function registerAccount(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Login dengan email + password. */
export async function loginAccount(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Keluar dari akun Firebase. */
export async function logoutAccount() {
  await signOut(auth);
}

/**
 * Unggah bundle terenkripsi ke Firestore: vaults/{uid}.
 * bundle = { salt, vault, check }
 */
export async function uploadVaultBundle(bundle) {
  const user = auth.currentUser;
  if (!user) throw new Error('Belum login');
  if (!bundle || !bundle.salt || !bundle.vault) throw new Error('Tidak ada data untuk diunggah');

  await withTimeout(setDoc(vaultRef(user.uid), {
    salt: bundle.salt,
    vault: bundle.vault,
    check: bundle.check || null,
    updatedAt: serverTimestamp()
  }));
  return true;
}

/**
 * Unduh bundle terenkripsi dari Firestore untuk pengguna yang login.
 * Mengembalikan { salt, vault, check } atau null bila belum ada.
 */
export async function downloadVaultBundle() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await withTimeout(getDoc(vaultRef(user.uid)));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d || !d.salt || !d.vault) return null;
  return { salt: d.salt, vault: d.vault, check: d.check || null };
}

/** Hapus dokumen vault di cloud (dipakai saat reset total). */
export async function deleteCloudVault() {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await deleteDoc(vaultRef(user.uid));
    return true;
  } catch (err) {
    console.warn('Gagal menghapus vault cloud:', err);
    return false;
  }
}

/** Terjemahkan kode error Firebase/Auth/Firestore ke pesan Bahasa Indonesia. */
export function friendlyError(err) {
  const code = err?.code || '';
  const map = {
    'auth/configuration-not-found': 'Login Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method → Email/Password → Enable).',
    'auth/operation-not-allowed': 'Login Email/Password belum diaktifkan di Firebase Console.',
    'auth/email-already-in-use': 'Email sudah terdaftar. Silakan login.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter).',
    'auth/user-not-found': 'Akun tidak ditemukan.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/network-request-failed': 'Gagal terhubung ke jaringan/Firebase.',
    'permission-denied': 'Akses ditolak. Pastikan Firestore sudah dibuat & Rules sudah di-publish.',
    'unavailable': 'Layanan Firestore tidak tersedia. Coba lagi.',
    'cloud/timeout': 'Koneksi ke cloud melebihi 10 detik. Data tetap tersimpan aman di perangkat ini; sinkronisasi bisa dicoba lagi dari Pengaturan.'
  };
  return map[code] || err?.message || 'Terjadi kesalahan pada koneksi cloud.';
}
