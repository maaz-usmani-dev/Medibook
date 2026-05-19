# MediBook Frontend Current Structure

This document describes the current structure of `medibook-frontend`, the data sources it uses today, what it expects from the backend, and where backend integration is still needed.

## Folder structure

```
medibook-frontend/
├── public/
├── src/
│   ├── api.js
│   ├── App.js
│   ├── index.js
│   ├── components/
│   ├── data/
│   │   └── mockData.js
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Auth.jsx
│   │   ├── BookingConfirmation.jsx
│   │   ├── DoctorDashboard.jsx
│   │   ├── DoctorListing.jsx
│   │   ├── DoctorProfile.jsx
│   │   ├── Home.jsx
│   │   ├── PatientDashboard.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.css
│   ├── index.css
│   ├── setupTests.js
├── package.json
└── README-frontend-api-endpoints.md
```

## App routing

`src/App.js` defines the main routes:

- `/` → `Home`
- `/doctors` → `DoctorListing`
- `/doctors/:id` → `DoctorProfile`
- `/signup` → `SignUp`
- `/login` → `Login`
- `/patient-dashboard` → `PatientDashboard`
- `/doctor-dashboard` → `DoctorDashboard`
- `/admin-dashboard` → `AdminDashboard`
- `/booking-confirmation` → `BookingConfirmation`

## Current backend connection files

- `src/api.js`
  - Exports `API = 'http://localhost:5000/api'`
  - This is the backend base URL used by the service helpers.

- `src/services/api.js`
  - Defines a complete API client for auth, doctors, appointments, availability, and admin endpoints.
  - Includes `authHeaders()` and `handleResponse()` helpers.
  - Covers endpoints such as:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `GET /api/auth/me`
    - `GET /api/doctors`
    - `GET /api/doctors/:id`
    - `GET /api/doctors/:id/availability?date=`
    - `POST /api/appointments`
    - `GET /api/appointments/my`
    - `PUT /api/appointments/:id/status`
    - `PUT /api/appointments/:id/reschedule`
    - `GET /api/availability/:doctorId?date=`
    - `POST /api/availability`
    - `DELETE /api/availability/:id`
    - `GET /api/admin/stats`
    - `GET /api/admin/users`
    - `PUT /api/admin/users/:id/block`
    - `GET /api/admin/appointments`

## Current data source usage

### Mock data

The frontend currently renders UI using `src/data/mockData.js` in several pages.

Pages using mock data:
- `Home.jsx` imports `doctors`, `specialties`, `testimonials`
- `DoctorListing.jsx` imports `doctors`, `specialties`
- `DoctorProfile.jsx` imports `doctors`, `timeSlots`
- `PatientDashboard.jsx` imports `patientAppointments`
- `DoctorDashboard.jsx` imports `doctorSchedule`
- `AdminDashboard.jsx` imports `doctors`, `patientAppointments`

Other mock-driven data flows:
- `DoctorCard.jsx` uses doctor object fields like `photo`, `title`, `available`, `nextSlot`, `experience`, `fee`, `tags`, `rating`
- `BookingConfirmation.jsx` receives booking details via location state, not a backend response

### No actual backend calls in pages

There are currently no imports of `src/services/api.js` in the page components.
The app still relies on local mock data and local navigation logic.

## What the frontend expects from the backend

Based on current page behavior and `README-frontend-api-endpoints.md`, the frontend expects the backend to provide:

### Authentication
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Current user: `GET /api/auth/me`

### Doctor discovery
- List doctors: `GET /api/doctors`
- Doctor profile: `GET /api/doctors/:id`
- Availability by date: `GET /api/doctors/:id/availability?date=` or `GET /api/availability/:doctorId?date=`

### Booking and appointments
- Book appointment: `POST /api/appointments`
- My appointments: `GET /api/appointments/my`
- Update status: `PUT /api/appointments/:id/status`
- Reschedule: `PUT /api/appointments/:id/reschedule`

### Doctor availability management
- Get slots: `GET /api/availability/:doctorId?date=` (or without date)
- Add slot: `POST /api/availability`
- Delete slot: `DELETE /api/availability/:id`

### Admin dashboard
- Platform stats: `GET /api/admin/stats`
- Users list: `GET /api/admin/users`
- Block/unblock user: `PUT /api/admin/users/:id/block`
- All appointments: `GET /api/admin/appointments`

## Integration needs

### 1. Use `src/services/api.js` in page components

The service file is ready, but not wired into the UI.
Use it in place of mock data in these pages:
- `Auth.jsx`
- `DoctorListing.jsx`
- `DoctorProfile.jsx`
- `PatientDashboard.jsx`
- `DoctorDashboard.jsx`
- `AdminDashboard.jsx`
- `BookingConfirmation.jsx`

### 2. Replace mock state with API state

Examples:
- Load doctor list from `api.getDoctors()` instead of `doctors` mock array.
- Load doctor details from `api.getDoctorById(id)` instead of finding in mock data.
- Load appointment lists from `api.getMyAppointments()` instead of `patientAppointments` or `doctorSchedule`.
- Use `api.bookAppointment()` on booking confirmation.

### 3. Persist authentication

Current login/signup forms only navigate locally:
- `Auth.jsx` does not call the backend service.
- The app does not store a JWT token.
- Use `localStorage` to save token and restore session on reload.

### 4. Normalize backend object shapes

Mock data fields and backend response fields are not identical.
Map backend fields to UI fields, for example:
- `full_name` → `name`
- `experience_years` → `experience`
- `bio` → `bio`
- `fee` → `fee`

### 5. Add loading/error handling

Because all current pages use static data, they do not handle network loading or failures.
Add state for `loading`, `error`, and fallback UI when the backend call fails.

## Page-specific integration notes

### `Home.jsx`
- Currently only renders mock cards, specialties, and testimonials.
- Could use backend `GET /api/doctors` for featured doctors and specialty counts.

### `DoctorListing.jsx`
- Uses mock filtering only.
- Needs server-side filters for specialty, gender, and availability.
- Should call `api.getDoctors({ specialty, gender, available: true })`.

### `DoctorProfile.jsx`
- Currently loads doctor data from mock list and mock availability slots.
- Needs `api.getDoctorById(id)` and `api.getDoctorAvailability(id, selectedDate)`.

### `BookingConfirmation.jsx`
- Displays booking details from navigation state.
- Better integration: use backend booking response or appointment fetch after booking.

### `PatientDashboard.jsx`
- Uses `patientAppointments` mock data.
- Should fetch `api.getMyAppointments()` and handle actions with `api.updateAppointmentStatus()` and `api.rescheduleAppointment()`.

### `DoctorDashboard.jsx`
- Uses `doctorSchedule` mock data.
- Should fetch `api.getMyAppointments()` for doctor view.
- Manage availability with `api.getSlots()`, `api.addSlot()`, and `api.deleteSlot()`.

### `AdminDashboard.jsx`
- Uses mock platform stats, doctors, appointments, and users.
- Should fetch real data with admin endpoints and show live admin control actions.

## Conclusion

The frontend is structurally ready for integration, but it is still running in mock mode.
The highest-value improvements are:
- wire `src/services/api.js` into the page components,
- replace mock arrays with API state,
- add auth token persistence,
- normalize backend data shapes,
- and add request error/loading handling.
