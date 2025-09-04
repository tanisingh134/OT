import { auth, db } from './firebase.js';
import { logger } from './logger.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  await logger.info('user_enter', { uid: user.uid });
  await Promise.all([listDoctors(), listSchedulesForDay()]);
});

const doctorsListBody = document.querySelector('#doctorsList tbody');
async function listDoctors() {
  const snap = await getDocs(collection(db, 'doctors'));
  doctorsListBody.innerHTML = '';
  snap.forEach(d => {
    const data = d.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${data.name}</td><td>${data.speciality}</td><td>${data.email}</td>`;
    doctorsListBody.appendChild(tr);
  });
}

const userSchedulesBody = document.querySelector('#userSchedules tbody');
async function listSchedulesForDay(targetDateStr) {
  const dateInput = document.getElementById('userDate');
  const baseDate = targetDateStr ? new Date(targetDateStr) : (dateInput.value ? new Date(dateInput.value) : new Date());
  const dayStart = new Date(baseDate); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(baseDate); dayEnd.setHours(23,59,59,999);
  const snap = await getDocs(query(collection(db, 'schedules'), orderBy('dateTime')));
  userSchedulesBody.innerHTML = '';
  snap.forEach(s => {
    const sc = s.data();
    const dt = new Date(sc.dateTime);
    if (dt >= dayStart && dt <= dayEnd) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${dt.toLocaleString()}</td><td>${sc.otId}</td><td>${sc.doctorId}</td><td>${sc.status}</td><td>${sc.remarks || ''}</td>`;
      userSchedulesBody.appendChild(tr);
    }
  });
}

document.getElementById('userDate')?.addEventListener('change', () => listSchedulesForDay());
document.getElementById('userPrev')?.addEventListener('click', () => {
  const d = new Date(document.getElementById('userDate').value || new Date());
  d.setDate(d.getDate() - 1);
  document.getElementById('userDate').valueAsDate = d;
  listSchedulesForDay();
});
document.getElementById('userNext')?.addEventListener('click', () => {
  const d = new Date(document.getElementById('userDate').value || new Date());
  d.setDate(d.getDate() + 1);
  document.getElementById('userDate').valueAsDate = d;
  listSchedulesForDay();
});


