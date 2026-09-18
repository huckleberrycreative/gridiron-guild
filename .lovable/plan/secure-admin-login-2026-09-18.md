# Secure Admin Login

## What will change
- Keep the existing email/password admin login and password-reset flow.
- Restrict every admin page to accounts with the existing admin role, not merely any signed-in account.
- Add a private profile record for each account, with display name and optional avatar support.
- Automatically create a profile when an account is created.
- Remove public admin self-registration so new accounts cannot request admin access from the login page.
- Show a clear access-denied state to signed-in users without an admin role.

## Technical details
- Add a `profiles` table with row-level access so users can read and update only their own profile.
- Retain roles exclusively in the existing separate `user_roles` table.
- Validate the current account and admin role before rendering protected admin pages.
- Keep logout and password recovery available.

## Verification
- Confirm signed-out visitors are redirected to the admin login.
- Confirm non-admin accounts cannot enter the admin area.
- Confirm an admin can sign in, use the admin pages, reset their password, and sign out.
