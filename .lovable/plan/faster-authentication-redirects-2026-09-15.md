# Faster authentication redirects

## Changes
- Make account creation always finish on the sign-in page, even when the auth service returns a session.
- Sign out any automatic signup session before navigating so the global session redirect cannot send new users straight home.
- Navigate directly to the home dashboard immediately after a successful password sign-in.
- Remove duplicate session application that can trigger competing redirects while retaining fast cached-session startup.
- Add short network timeouts and clear retry guidance so temporary backend delays do not leave buttons spinning indefinitely.

## Validation
- Verify signed-out protected pages still open sign-in.
- Verify registration lands on sign-in and password sign-in lands on the home dashboard.
- Check account screens at desktop and mobile widths, plus build and browser errors.

## Technical details
- Keep the existing Lovable Cloud authentication and profile records.
- Coordinate navigation in the form handlers rather than waiting for the root session watcher.
