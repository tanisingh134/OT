import { auth, db, storage } from './firebase.js';
import { logger } from './logger.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Tabs
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
}));

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// Guards
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  await logger.info('admin_enter', { uid: user.uid });
  await refreshAll();
});

// Doctors CRUD
const doctorForm = document.getElementById('doctorForm');
const doctorsTableBody = document.querySelector('#doctorsTable tbody');

doctorForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('docName').value.trim();
  const speciality = document.getElementById('docSpeciality').value.trim();
  const email = document.getElementById('docEmail').value.trim();
  if (!email) return;
  await setDoc(doc(db, 'doctors', email), { name, speciality, email, updatedAt: serverTimestamp() }, { merge: true });
  await logger.info('doctor_upsert', { email, name });
  doctorForm.reset();
  await listDoctors();
});

async function listDoctors() {
  const snap = await getDocs(collection(db, 'doctors'));
  doctorsTableBody.innerHTML = '';
  snap.forEach(d => {
    const data = d.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${data.name}</td><td>${data.speciality}</td><td>${data.email}</td>
      <td>
        <button class="btn" data-action="edit" data-id="${data.email}">Edit</button>
        <button class="btn" data-action="delete" data-id="${data.email}">Delete</button>
      </td>`;
    doctorsTableBody.appendChild(tr);
  });

  doctorsTableBody.querySelectorAll('button').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'delete') {
      await deleteDoc(doc(db, 'doctors', id));
      await logger.warn('doctor_deleted', { id });
      await listDoctors();
    } else {
      // load into form
      const ds = await getDocs(query(collection(db, 'doctors'), where('email', '==', id)));
      ds.forEach(s => {
        const v = s.data();
        document.getElementById('docName').value = v.name;
        document.getElementById('docSpeciality').value = v.speciality;
        document.getElementById('docEmail').value = v.email;
      });
    }
  }));
}

// Patients CRUD
const patientForm = document.getElementById('patientForm');
const patientsTableBody = document.querySelector('#patientsTable tbody');

patientForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('patName').value.trim();
  const patientId = document.getElementById('patId').value.trim();
  const contact = document.getElementById('patContact').value.trim();
  if (!patientId) return;
  await setDoc(doc(db, 'patients', patientId), { name, patientId, contact, updatedAt: serverTimestamp() }, { merge: true });
  await logger.info('patient_upsert', { patientId, name });
  patientForm.reset();
  await listPatients();
});

async function listPatients() {
  const snap = await getDocs(collection(db, 'patients'));
  patientsTableBody.innerHTML = '';
  snap.forEach(d => {
    const data = d.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${data.name}</td><td>${data.patientId}</td><td>${data.contact}</td>
      <td>
        <button class="btn" data-action="edit" data-id="${data.patientId}">Edit</button>
        <button class="btn" data-action="delete" data-id="${data.patientId}">Delete</button>
      </td>`;
    patientsTableBody.appendChild(tr);
  });

  patientsTableBody.querySelectorAll('button').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'delete') {
      await deleteDoc(doc(db, 'patients', id));
      await logger.warn('patient_deleted', { id });
      await listPatients();
    } else {
      // load into form
      document.getElementById('patId').value = id;
      // fetch by id not necessary as key contains data, but keep simple
    }
  }));
}

// Schedules CRUD
const scheduleForm = document.getElementById('scheduleForm');
const schedulesTableBody = document.querySelector('#schedulesTable tbody');

scheduleForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    patientId: document.getElementById('schPatientId').value.trim(),
    doctorId: document.getElementById('schDoctorId').value.trim(),
    otId: document.getElementById('schOTId').value.trim(),
    dateTime: new Date(document.getElementById('schDate').value).toISOString(),
    anesthesiaType: document.getElementById('schAnesthesia').value.trim(),
    anesthesiologist: document.getElementById('schAnesthesiologist').value.trim(),
    assistants: document.getElementById('schAssistants').value.trim(),
    orNurses: document.getElementById('schORNurses').value.trim(),
    status: document.getElementById('schStatus').value,
    remarks: document.getElementById('schRemarks').value.trim(),
    uniqueNeeds: document.getElementById('schUniqueNeeds').value.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'schedules'), payload);
  await logger.info('schedule_created', { id: ref.id });
  scheduleForm.reset();
  await listSchedulesForDay();
});

async function listSchedulesForDay(targetDateStr) {
  const dateInput = document.getElementById('filterDate');
  const baseDate = targetDateStr ? new Date(targetDateStr) : (dateInput.value ? new Date(dateInput.value) : new Date());
  const dayStart = new Date(baseDate);
  dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(baseDate);
  dayEnd.setHours(23,59,59,999);

  // naive client filter, Firestore range requires timestamp fields; using ISO strings for demo simplicity
  const snap = await getDocs(query(collection(db, 'schedules'), orderBy('dateTime')));
  schedulesTableBody.innerHTML = '';
  snap.forEach(s => {
    const sc = s.data();
    const dt = new Date(sc.dateTime);
    if (dt >= dayStart && dt <= dayEnd) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${dt.toLocaleString()}</td><td>${sc.otId}</td><td>${sc.patientId}</td><td>${sc.doctorId}</td><td>${sc.status}</td>
        <td>
          <button class="btn" data-action="mark" data-id="${s.id}">Update Status</button>
          <button class="btn" data-action="delete" data-id="${s.id}">Delete</button>
        </td>`;
      schedulesTableBody.appendChild(tr);
    }
  });

  schedulesTableBody.querySelectorAll('button').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'delete') {
      await deleteDoc(doc(db, 'schedules', id));
      await logger.warn('schedule_deleted', { id });
      await listSchedulesForDay(dateInput.value);
    } else {
      const newStatus = prompt('Enter new status (planned, postponed, cancelled, completed, emergency):');
      if (!newStatus) return;
      await setDoc(doc(db, 'schedules', id), { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
      await logger.info('schedule_status_updated', { id, newStatus });
      await listSchedulesForDay(dateInput.value);
    }
  }));
}

document.getElementById('filterDate')?.addEventListener('change', () => listSchedulesForDay());
document.getElementById('viewPrev')?.addEventListener('click', () => {
  const d = new Date(document.getElementById('filterDate').value || new Date());
  d.setDate(d.getDate() - 1);
  document.getElementById('filterDate').valueAsDate = d;
  listSchedulesForDay();
});
document.getElementById('viewNext')?.addEventListener('click', () => {
  const d = new Date(document.getElementById('filterDate').value || new Date());
  d.setDate(d.getDate() + 1);
  document.getElementById('filterDate').valueAsDate = d;
  listSchedulesForDay();
});

// Reports upload/list
const reportForm = document.getElementById('reportForm');
const reportsList = document.getElementById('reportsList');

reportForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const scheduleId = document.getElementById('repScheduleId').value.trim();
  const file = document.getElementById('repFile').files[0];
  if (!file || !scheduleId) return;
  const path = `reports/${scheduleId}/${Date.now()}_${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  await logger.info('report_uploaded', { scheduleId, path });
  alert('Uploaded');
  await listReports(scheduleId);
});

async function listReports(scheduleId) {
  reportsList.innerHTML = '';
  const base = ref(storage, `reports/${scheduleId}`);
  try {
    const res = await listAll(base);
    for (const item of res.items) {
      const url = await getDownloadURL(item);
      const li = document.createElement('li');
      li.innerHTML = `<a href="${url}" target="_blank">${item.name}</a>`;
      reportsList.appendChild(li);
    }
  } catch (e) {
    // ignore if folder empty
  }
}

// Analytics (basic)
async function loadAnalytics() {
  const schedulesSnap = await getDocs(collection(db, 'schedules'));
  let planned = 0, postponed = 0, cancelled = 0, completed = 0, emergency = 0;
  const needs = new Map();
  schedulesSnap.forEach(s => {
    const d = s.data();
    if (d.status === 'planned') planned++;
    if (d.status === 'postponed') postponed++;
    if (d.status === 'cancelled') cancelled++;
    if (d.status === 'completed') completed++;
    if (d.status === 'emergency') emergency++;
    if (d.uniqueNeeds) {
      d.uniqueNeeds.split(',').map(x => x.trim()).filter(Boolean).forEach(n => {
        needs.set(n, (needs.get(n) || 0) + 1);
      });
    }
  });
  document.getElementById('analyticsSummary').innerHTML =
    `<strong>Planned:</strong> ${planned} | <strong>Postponed:</strong> ${postponed} | <strong>Cancelled:</strong> ${cancelled} | <strong>Completed:</strong> ${completed} | <strong>Emergency:</strong> ${emergency}`;

  const needsList = Array.from(needs.entries()).map(([k,v]) => `${k} (${v})`).join(', ');
  document.getElementById('materialsNeeds').innerHTML = `<strong>Materials Needs:</strong> ${needsList || 'None'}`;
}

async function refreshAll() {
  await Promise.all([listDoctors(), listPatients(), listSchedulesForDay(), loadAnalytics()]);
}


