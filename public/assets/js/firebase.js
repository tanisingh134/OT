// Firebase initialization and exports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, logEvent as fbLogEvent } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBz5zIQMoyk8lmJwN9Fl89_WkMhOluDFJY",
  authDomain: "hospital-316b4.firebaseapp.com",
  projectId: "hospital-316b4",
  storageBucket: "hospital-316b4.firebasestorage.app",
  messagingSenderId: "69655062976",
  appId: "1:69655062976:web:c165b6b22f47abe2494025",
  measurementId: "G-P275SSKC0S",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage, fbLogEvent };


