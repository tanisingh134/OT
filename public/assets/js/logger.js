// Centralized logging module
// Logs to console and persists to Firestore 'logs' collection
import { db, fbLogEvent } from './firebase.js';
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function safeToString(value) {
  try { return typeof value === 'string' ? value : JSON.stringify(value); } catch { return String(value); }
}

export async function logAction(action, details = {}, level = 'info') {
  const payload = {
    action,
    level,
    details,
    userAgent: navigator.userAgent,
    ts: Date.now(),
  };

  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${action} :: ${safeToString(details)}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  try {
    fbLogEvent && fbLogEvent(window.analytics || undefined, action, details);
  } catch {}

  try {
    await addDoc(collection(db, 'logs'), {
      action,
      level,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Failed to persist log:', e);
  }
}

export const logger = {
  info: (a, d) => logAction(a, d, 'info'),
  warn: (a, d) => logAction(a, d, 'warn'),
  error: (a, d) => logAction(a, d, 'error'),
};


