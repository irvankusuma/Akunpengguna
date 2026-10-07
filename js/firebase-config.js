/* ============================================
   FIREBASE CONFIG — Inisialisasi app, auth, dan Firestore
   Dimuat lewat CDN ESM (situs statis tanpa bundler).
   Config web ini bersifat publik; keamanan dijaga oleh Firestore Rules.
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCgGnbZR4bYIB5ARC4TT27AiGYh92sKiUg',
  authDomain: 'akunpengguna-47d0e.firebaseapp.com',
  projectId: 'akunpengguna-47d0e',
  storageBucket: 'akunpengguna-47d0e.firebasestorage.app',
  messagingSenderId: '752614573876',
  appId: '1:752614573876:web:d9173b71b7786c7ac80761',
  measurementId: 'G-FY0NZSJPEX'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
