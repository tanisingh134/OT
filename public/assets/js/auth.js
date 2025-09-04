import { auth, db } from './firebase.js';
import { logger } from './logger.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

async function ensureRoleClaim(uid, role) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { role, createdAt: new Date().toISOString() });
  }
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await logger.info('auth_login_success', { uid: res.user.uid, email });
    const userDoc = await getDoc(doc(db, 'users', res.user.uid));
    const role = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';
    if (role === 'admin') window.location.href = 'admin.html';
    else window.location.href = 'user.html';
  } catch (err) {
    logger.error('auth_login_failed', { email, message: err?.message });
    alert('Login failed: ' + (err?.message || 'Unknown error'));
  }
});

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    await ensureRoleClaim(res.user.uid, role);
    await logger.info('auth_register_success', { uid: res.user.uid, role });
    if (role === 'admin') window.location.href = 'admin.html';
    else window.location.href = 'user.html';
  } catch (err) {
    logger.error('auth_register_failed', { email, message: err?.message });
    alert('Registration failed: ' + (err?.message || 'Unknown error'));
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await logger.info('auth_state_signed_in', { uid: user.uid });
  }
});

window.logout = async () => {
  try { await signOut(auth); logger.info('auth_logout', {}); } catch (e) {}
};


