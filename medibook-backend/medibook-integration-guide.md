# MediBook — Integration & Run Guide

## Prerequisites
- Node.js v18+
- MySQL 8+
- Your React frontend already built (Week 2)

---

## 1. Run the Backend

```bash
cd medibook-backend
npm install
cp .env.example .env        # fill in your MySQL password
mysql -u root -p < schema.sql
npm run dev                  # runs on http://localhost:5000
```

Test: open http://localhost:5000 — should return `{ "message": "MediBook API is running 🚀" }`

---

## 2. Run the Frontend

```bash
cd medibook               # your React project
npm install               # if not already done
npm start                 # runs on http://localhost:3000
```

---

## 3. Frontend Changes Required

### A. Add this constant (one place, e.g. `src/api.js` — create this file)

```js
export const API = 'http://localhost:5000/api';
```

---

### B. Auth.jsx — Login

Replace mock login logic with:

```js
import { API } from '../api';

// Inside your login submit handler:
const res  = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();

if (!res.ok) { alert(data.error); return; }

localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// Redirect based on role
if (data.user.role === 'patient') navigate('/patient-dashboard');
else if (data.user.role === 'doctor') navigate('/doctor-dashboard');
else navigate('/admin-dashboard');
```

---

### C. Auth.jsx — Register

```js
const res = await fetch(`${API}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ full_name, email, password, role: 'patient' }),
});
const data = await res.json();
if (!res.ok) { alert(data.error); return; }
navigate('/login');
```

---

### D. DoctorListing.jsx — Replace mockData with real doctors

```js
import { API } from '../api';

useEffect(() => {
  const fetchDoctors = async () => {
    const res  = await fetch(`${API}/doctors`);
    const data = await res.json();
    setDoctors(data);
  };
  fetchDoctors();
}, []);

// With filters (specialty, gender):
// fetch(`${API}/doctors?specialty=Cardiologist&gender=Male`)
```

---

### E. DoctorProfile.jsx — Single doctor + availability

```js
// Doctor profile
const res  = await fetch(`${API}/doctors/${id}`);
const data = await res.json();

// Available slots for a selected date
const res2  = await fetch(`${API}/doctors/${id}/availability?date=2024-12-20`);
const slots = await res2.json();
```

---

### F. BookingConfirmation.jsx — Book appointment

```js
const token = localStorage.getItem('token');

const res = await fetch(`${API}/appointments`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    doctor_id,
    appointment_date,   // "YYYY-MM-DD"
    time_slot,          // "09:00 AM"
    type,               // "In-person" or "Video"
    reason,
  }),
});
const data = await res.json();
```

---

### G. PatientDashboard.jsx — Patient's appointments

```js
const token = localStorage.getItem('token');

const res  = await fetch(`${API}/appointments/my`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json(); // array of appointments
```

---

### H. DoctorDashboard.jsx — Doctor's appointments + availability

```js
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user'));

// Appointments
const res = await fetch(`${API}/appointments/my`, {
  headers: { Authorization: `Bearer ${token}` },
});

// Update appointment status (confirm / cancel / complete)
await fetch(`${API}/appointments/${id}/status`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ status: 'confirmed' }), // or 'cancelled' / 'completed'
});
```

---

### I. AdminDashboard.jsx

```js
const token = localStorage.getItem('token');
const h     = { Authorization: `Bearer ${token}` };

// Stats
const stats = await (await fetch(`${API}/admin/stats`, { headers: h })).json();
// { totalUsers, totalDoctors, totalAppointments, revenue }

// All users (patients)
const users = await (await fetch(`${API}/admin/users`, { headers: h })).json();

// All appointments
const appts = await (await fetch(`${API}/admin/appointments`, { headers: h })).json();

// Block/unblock a user
await fetch(`${API}/admin/users/${userId}/block`, { method: 'PUT', headers: h });
```

---

### J. Protect dashboard routes (App.js)

Wrap dashboard routes so unauthenticated users can't access them:

```js
// Simple guard component
const Protected = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// In your routes:
<Route path="/patient-dashboard" element={<Protected><PatientDashboard /></Protected>} />
<Route path="/doctor-dashboard"  element={<Protected><DoctorDashboard /></Protected>} />
<Route path="/admin-dashboard"   element={<Protected><AdminDashboard /></Protected>} />
```

---

### K. Logout (wherever your logout button is)

```js
localStorage.removeItem('token');
localStorage.removeItem('user');
navigate('/login');
```

---

## 4. Seed Test Accounts

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@medibook.com  | password123 |
| Patient | ali@example.com     | password123 |
| Patient | sara@example.com    | password123 |
| Doctor  | kamran@medibook.com | password123 |
| Doctor  | ayesha@medibook.com | password123 |
| Doctor  | bilal@medibook.com  | password123 |

---

## 5. Key Notes for the Next AI

- Backend is Express + MySQL, runs on port **5000**
- Frontend is React + Tailwind, runs on port **3000**
- CORS is already configured on the backend for `http://localhost:3000`
- Auth uses **JWT** stored in `localStorage` under key `token`
- User info stored in `localStorage` under key `user` (JSON: `{ id, full_name, email, role }`)
- All protected routes need header: `Authorization: Bearer <token>`
- Doctor's `id` in the `doctors` table ≠ their `user_id` — doctor profile has its own `id`
- The `mockData.js` file in `src/data/` should be fully replaced by the API calls above
- Email confirmation is simulated — a preview URL appears in the backend terminal on each booking
