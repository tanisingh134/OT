## Operation Scheduler for Hospital Management

A web-based Operation Theater (OT) scheduling and activity tracking application for hospitals. Built with HTML, CSS, JavaScript, and Firebase (Auth, Firestore, Storage, Analytics).

### Features
- Admin and User roles
- Register/Login using Firebase Auth
- Admin: Manage Doctors, Patients
- Admin: Create/Update/Delete Surgery Schedules with statuses (planned, postponed, cancelled, completed, emergency)
- Admin: Upload and list surgical reports (PDF/images) per schedule
- Admin: View basic analytics of OT activity and materials needs
- User: View Doctors and day-wise Surgery information
- Day navigation for past/next schedules
- Centralized client-side logging to Firestore `logs` collection

### Project Structure
```
root/
├─ index.html              # Login & Registration
├─ admin.html              # Admin dashboard
├─ user.html               # User portal
├─ assets/
│  ├─ css/styles.css
│  └─ js/
│     ├─ firebase.js      # Firebase init
│     ├─ logger.js        # Centralized logging
│     ├─ auth.js          # Auth flows
│     ├─ admin.js         # Admin UI logic
│     └─ user.js          # User UI logic
└─ README.md
```

### Firebase Setup
This project is pre-configured with the following Firebase config:
```
const firebaseConfig = {
  apiKey: "AIzaSyBz5zIQMoyk8lmJwN9Fl89_WkMhOluDFJY",
  authDomain: "hospital-316b4.firebaseapp.com",
  projectId: "hospital-316b4",
  storageBucket: "hospital-316b4.firebasestorage.app",
  messagingSenderId: "69655062976",
  appId: "1:69655062976:web:c165b6b22f47abe2494025",
  measurementId: "G-P275SSKC0S"
};
```
Ensure the Firebase project has Firestore and Storage enabled.

#### Suggested Security Rules (Development)
Use locked-down rules in production. For quick testing, you can use permissive rules and then harden them.

Firestore rules (example for dev only):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Storage rules (example for dev only):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Running Locally
- Serve the folder using any static server (recommended to avoid CORS issues with modules).
- On Windows PowerShell:
```
python -m http.server 8000
```
Then open `http://localhost:8000/index.html` in your browser.

### Usage
1. Register a user. Choose role `Admin` for administrative access.
2. Login. Admins go to `admin.html`, users to `user.html`.
3. Admin:
   - Manage Doctors and Patients in respective tabs.
   - Create schedules with all required fields.
   - Use date filter and Prev/Next to navigate daily schedules.
   - Upload surgical reports mapped by Schedule ID.
   - View activity and materials needs in Analytics.
4. User:
   - View Doctors list.
   - View schedules for a specific day.

### Data Model (Firestore)
- `users/{uid}`: { role, createdAt }
- `doctors/{email}`: { name, speciality, email, updatedAt }
- `patients/{patientId}`: { name, patientId, contact, updatedAt }
- `schedules/{id}`: {
  patientId, doctorId, otId, dateTime (ISO string), anesthesiaType,
  anesthesiologist, assistants, orNurses, status, remarks, uniqueNeeds,
  createdAt, updatedAt
}
- `logs/{id}`: { action, level, details, createdAt }

### Logging
All major actions are logged via `assets/js/logger.js` to:
- Browser console (info/warn/error)
- Firestore collection `logs`

### Deployment
- Host on GitHub Pages or Firebase Hosting.
- Ensure rules are secure for production.

### Coding Standards
- Modular JS with clear naming.
- Minimal DOM coupling; pure functions where possible.
- No inline styles; all styles in `assets/css/styles.css`.

### Notes
- Date filtering is done client-side using ISO strings for simplicity. Consider using Firestore `Timestamp` fields and range queries for scale.
- This is a client-side reference implementation; for production, introduce Cloud Functions for role enforcement and secure logging.





