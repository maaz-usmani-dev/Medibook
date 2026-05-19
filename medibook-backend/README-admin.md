# Creating the first Admin

This project prevents public registration as `admin`. To create the initial administrator account run a secure script that inserts an `admin` user into the database.

Usage (environment variables preferred):

Windows PowerShell example:

```powershell
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'YourVeryStrongPassword'
node scripts/create-admin.js
```

Or pass via CLI arguments:

```powershell
node scripts/create-admin.js --email=admin@example.com --password=YourVeryStrongPassword
```

Notes:
- The script will abort if a user with that email already exists.
- Keep the admin password safe and change it after first sign-in.
- For production, consider running this from a secure host or CI with secrets stored in a vault.

Alternative: implement a server-side invite flow (admin-only or secret token) if you prefer creating admins without direct DB access.
