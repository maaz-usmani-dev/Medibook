# MediBook – Planned Fixes (Non-code documentation)

This README documents what will be changed to address the issues described: 
1) Homepage showing mock data
2) FCP/LCP/UX optimization (remove heavy mock assets & improve loading)
3) Navbar login/signup vs avatar/profile redirect for logged-in users
4) Replace placeholder doctor/patient images with user-uploaded avatars, stored via Cloudinary; fallback to initials when absent.

> Note: The code changes are intentionally not included yet. This file is a “do-first” plan so the implementation work is explicit and traceable.

---

## 1. Homepage still shows mock data

### What is happening now
- `medibook-frontend/src/pages/Home.jsx` imports:
  - `doctors`, `specialties`, `testimonials` from `medibook-frontend/src/data/mockData.js`.
- The homepage sections “Featured Doctors” and “Patient Stories” are rendering from this mock dataset.

### What will be changed
- Replace `mockData` usage in `Home.jsx` with real API calls.
- Identify appropriate backend endpoints:
  - Doctors listing likely exists (used already by `DoctorListing` via `api.getDoctors()`).
- For homepage sections:
  1. **Featured Doctors**: fetch a small “top rated” subset from the real doctors API.
  2. **Specialties**: build from the real doctors dataset (like `DoctorListing` already does) or add a dedicated endpoint if needed.
  3. **Testimonials**: if the backend does not support testimonials, either:
     - keep testimonials as static marketing copy (acceptable), but remove “mock patient avatars” from the cards, OR
     - create a testimonials API + DB table (bigger change).

### Deliverable
- `Home.jsx` will render no mock “doctor cards” or mock “patient photos”.

---

## 2. Frontend performance (FCP / LCP optimization)

### What is happening now
The homepage currently includes multiple large remote images and mock-based content:
- Hero image + float cards (`Home.jsx`) use large Unsplash images.
- Featured doctors and testimonial avatars are also remote images.

Remote images can significantly delay LCP because the browser must fetch and decode them before painting the main content.

### What will be changed
- Keep hero layout, but optimize how images load:
  - Ensure the main hero image uses:
    - `loading="eager"` for the LCP candidate
    - `fetchPriority="high"` (where supported)
  - Add `loading="lazy"` and smaller sizes for non-LCP images (doctor cards, testimonial avatars, etc.).
  - Consider preloading only the hero image (not every image).
- Ensure React renders less “immediately-blocking” content:
  - Fetch doctors after initial paint (or use skeletons) so FCP is not delayed by data fetching.
  - If the featured doctors are fetched, render them after the first paint.

### Deliverable
- Noticeable improvement in FCP/LCP by:
  - reducing the number of network-heavy remote images at first render
  - deferring non-critical image work

---

## 3. Navbar behavior for logged-in users (avatar + profile redirect)

### What is happening now
- `medibook-frontend/src/components/Navbar.jsx` always renders:
  - `Login` and `Sign Up` buttons (desktop + mobile).
- User identity exists in other pages via `api.getMe()` and `localStorage`.

### What will be changed
- Make `Navbar` authentication-aware:
  - On mount, call `api.getMe()` (or rely on cached token/me) to determine if the user is logged in.
  - If logged in:
    - hide login/signup buttons
    - show a clickable avatar (image if available, otherwise initials circle)
    - on click, redirect:
      - patients → `/patient-dashboard` (or `/patient-profile` if you add one)
      - doctors → `/doctor-dashboard`
      - admin → `/admin-dashboard`
- The avatar UI should reuse a consistent component (or minimal inline logic) to avoid duplicate fallback code.

### Deliverable
- Navbar changes from “Auth CTA” state to “User avatar” state automatically.

---

## 4. User-uploaded avatar via Cloudinary (no more placeholder doctor/patient images)

### What is happening now
- Doctor photos come from `doctor.photo` or `doctor.avatar`.
  - In `medibook-frontend/src/utils/normalizeDoctor.js`, there is a fallback to Unsplash if missing.
- Patient avatars in `PatientDashboard` are also placeholders:
  - `PatientDashboard.jsx` sets `fallbackImg` to an Unsplash image.
  - `mapProfile()` sets `img: fallbackImg` unconditionally.
- Sidebar already supports showing initials if `user.img` exists or not, but current code always gives an `img` fallback.

### What will be changed
#### 4.1 Database + backend support
To support real avatars, the backend needs to store an avatar URL per user (and likely per doctor/patient since both are users in `users`).

There are two reasonable approaches:
1. Add `users.avatar_url` (recommended, simplest)
2. Add separate profile tables (more work)

**Plan for option (1):**
- Update schema:
  - Add `avatar_url VARCHAR(255)` to `users`.
- Add backend route:
  - `POST /api/auth/upload-avatar` (authenticated)
  - This route:
    - accepts an uploaded file (or base64)
    - uploads to Cloudinary
    - stores `avatar_url` in `users`
    - returns updated `me` payload

Cloudinary requires:
- env vars in backend: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (and upload preset or folder behavior)

#### 4.2 Frontend upload UI
- In patient + doctor profile pages (or at least one account settings area), add an “Upload avatar” UI:
  - file input (accept image/*)
  - upload via API
  - show the returned avatar immediately

Where to integrate:
- Patient: `PatientDashboard.jsx` already has “Edit profile”; we can add avatar upload near it.
- Doctor: `DoctorDashboard.jsx` or a doctor profile settings area.

#### 4.3 Remove placeholder photo fallbacks
- Remove/stop using Unsplash fallbacks in:
  - `normalizeDoctor.js` (`doctor.photo` fallback to unsplash)
  - `PatientDashboard.jsx` (`fallbackImg`)
- Instead:
  - If a user has `avatar_url`, use it.
  - If not, show initials in a circle.

#### 4.4 Initials fallback logic
- Use consistent initials logic:
  - create helper (if missing) for deriving initials from full name.
- Display:
  - a colored circle with initials
  - no network image for the fallback

### Deliverable
- Users can upload an avatar.
- If a user has no avatar, UI uses initials.
- No default placeholder image remains for doctor/patient profile photos.

---

## 5. Acceptance criteria (how to verify)

### Homepage
- `Home.jsx` renders doctors/specialties from backend (no `mockData` for doctor cards).
- Featured doctor cards show real doctor images / avatars.

### Navbar
- When logged out: shows Login + Sign Up.
- When logged in: shows avatar, and clicking it redirects to the correct dashboard.

### Avatars
- After uploading an avatar:
  - it appears in the navbar avatar
  - it appears in profile pages and sidebars
- When a user has no avatar:
  - initials circle is shown (no placeholder Unsplash images)

---

## 6. Implementation sequencing (recommended)
1. **Navbar auth state** (fast UX win; requires only frontend changes + `api.getMe()`)
2. **Avatar plumbing** (DB + backend route + frontend upload UI)
3. **Remove placeholder fallbacks** in doctor/patient rendering
4. **Homepage replace mock doctors** with real API data
5. **FCP/LCP image loading tweaks** after visuals are correct

---

## 7. Files most likely to be changed

Frontend:
- `medibook-frontend/src/pages/Home.jsx`
- `medibook-frontend/src/components/Navbar.jsx`
- `medibook-frontend/src/pages/PatientDashboard.jsx`
- `medibook-frontend/src/pages/DoctorDashboard.jsx` (if doctor settings live there)
- `medibook-frontend/src/utils/normalizeDoctor.js`
- potentially `medibook-frontend/src/components/Sidebar.jsx` (to ensure consistent fallback rendering)
- `medibook-frontend/src/services/api.js` (add upload-avatar request)

Backend:
- `medibook-backend/schema.sql` (add `avatar_url`)
- `medibook-backend/controllers/authController.js` (avatar upload handler)
- `medibook-backend/routes/auth.js` (upload avatar endpoint)
- `medibook-backend/server.js` (Cloudinary upload config if needed)

---

## 8. Status
- This README is the “document everything first” step.
- Next step is to ask for your explicit approval before any code edits start.

