# MediBook — Backend

**Express + MySQL REST API | Week 3 Submission**
Student: Muhammad Maaz Usmani | Roll: BSCS51S24R014

---

## Prerequisites
- Node.js v18+
- MySQL 8+
- Postman (for testing)

---

## Setup

### 1. Install dependencies
```bash
cd medibook-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=medibook
JWT_SECRET=medibook_secret_key_2024
```

### 3. Create database & seed data
```bash
mysql -u root -p < schema.sql
```
This creates the `medibook` database, all tables, and inserts:
- 1 Admin
- 2 Patients
- 3 Doctors (with availability slots + sample appointments)

**All seed accounts use password: `password123`**

| Role    | Email                  |
|---------|------------------------|
| Admin   | admin@medibook.com     |
| Patient | ali@example.com        |
| Patient | sara@example.com       |
| Doctor  | kamran@medibook.com    |
| Doctor  | ayesha@medibook.com    |
| Doctor  | bilal@medibook.com     |

### 4. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```
Server runs on **http://localhost:5000**

---

## API Reference

### Auth — `/api/auth`
| Method | Endpoint         | Auth? | Description              |
|--------|------------------|-------|--------------------------|
| POST   | `/register`      | No    | Register patient/doctor  |
| POST   | `/login`         | No    | Login, returns JWT       |
| GET    | `/me`            | Yes   | Get current user profile |

**Register body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient",
  "phone": "03001234567",
  "gender": "Male",
  "date_of_birth": "1995-01-15"
}
```

**Login body:**
```json
{ "email": "ali@example.com", "password": "password123" }
```

**Login response:**
```json
{
  "token": "eyJ...",
  "user": { "id": 2, "full_name": "Ali Hassan", "email": "ali@example.com", "role": "patient" }
}
```

---

### Doctors — `/api/doctors`
| Method | Endpoint                   | Auth?         | Description               |
|--------|----------------------------|---------------|---------------------------|
| GET    | `/`                        | No            | List doctors (filterable) |
| GET    | `/:id`                     | No            | Single doctor profile     |
| GET    | `/:id/availability?date=`  | No            | Available slots for date  |
| POST   | `/`                        | Admin         | Add doctor                |
| PUT    | `/:id`                     | Admin/Doctor  | Update doctor             |
| DELETE | `/:id`                     | Admin         | Remove doctor             |

**Filter params:** `?specialty=Cardiologist&gender=Male&available=Mon`

---

### Appointments — `/api/appointments`
| Method | Endpoint              | Auth            | Description              |
|--------|-----------------------|-----------------|--------------------------|
| POST   | `/`                   | Patient         | Book appointment         |
| GET    | `/my`                 | Patient/Doctor  | View own appointments    |
| PUT    | `/:id/status`         | Doctor/Admin    | Update status            |
| PUT    | `/:id/reschedule`     | Patient         | Reschedule               |

**Book body:**
```json
{
  "doctor_id": 1,
  "appointment_date": "2024-12-20",
  "time_slot": "09:00 AM",
  "type": "In-person",
  "reason": "Chest pain"
}
```

---

### Availability — `/api/availability`
| Method | Endpoint          | Auth   | Description          |
|--------|-------------------|--------|----------------------|
| GET    | `/:doctorId`      | No     | Get doctor's slots   |
| POST   | `/`               | Doctor | Add a slot           |
| DELETE | `/:id`            | Doctor | Remove a slot        |

---

### Admin — `/api/admin`
| Method | Endpoint               | Auth  | Description           |
|--------|------------------------|-------|-----------------------|
| GET    | `/stats`               | Admin | Dashboard stats       |
| GET    | `/users`               | Admin | All patients          |
| PUT    | `/users/:id/block`     | Admin | Block/unblock patient |
| GET    | `/appointments`        | Admin | All appointments      |

---

## Authentication
Pass the JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Email Simulation
Booking confirmation emails are simulated via **Nodemailer + Ethereal**.
No real emails are sent. A preview URL is logged in the server console after each booking — open it to see the rendered email.

---

## Project Structure
```
medibook-backend/
├── server.js               ← Entry point
├── schema.sql              ← DB schema + seed data
├── .env.example            ← Environment template
├── package.json
├── config/
│   ├── db.js               ← MySQL connection pool
│   └── mailer.js           ← Nodemailer (email simulation)
├── middleware/
│   ├── auth.js             ← JWT verify
│   └── role.js             ← Role-based guard
├── routes/
│   ├── auth.js
│   ├── doctors.js
│   ├── appointments.js
│   ├── availability.js
│   └── admin.js
└── controllers/
    ├── authController.js
    ├── doctorController.js
    ├── appointmentController.js
    ├── availabilityController.js
    └── adminController.js
```

---

## Frontend Integration

In your React files, replace mock data with:

```js
const API = 'http://localhost:5000/api';

// Public request
const res  = await fetch(`${API}/doctors?specialty=Cardiologist`);
const data = await res.json();

// Protected request
const res = await fetch(`${API}/appointments/my`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Login and store token
const res  = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// Role-based redirect
if (user.role === 'patient') navigate('/patient-dashboard');
else if (user.role === 'doctor') navigate('/doctor-dashboard');
else navigate('/admin-dashboard');
```
