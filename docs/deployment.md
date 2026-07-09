# Railway Deployment

## Project

Railway project:

```text
https://railway.com/project/91ce093b-1fed-44da-8dc2-ae88e0031d10
```

## Runtime

The app deploys as a single Next.js service.

Railway uses:

- `npm run build`
- `npm run start`
- healthcheck path: `/api/session`

The `start` script binds Next.js to Railway's injected `PORT`.

## Environment

Anonymous archive play does not require environment variables.

Portal launch support should set:

```text
SESSION_SECRET=<32+ character secret>
MODULE_LAUNCH_SECRET=<shared Portal module launch secret>
PORTAL_ISSUER=<Portal JWT issuer>
MODULE_SLUG=<Portal module slug>
PORTAL_MODULES_URL=https://portal.raidguild.org/modules
```

## Storage

No persistent storage is required for the current archive demo.

If Daily Cipher or server-side progress is added later, use SQLite on a Railway persistent volume.
