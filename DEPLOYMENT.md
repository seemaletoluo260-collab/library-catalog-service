# Deployment

## Status

The production deployment is **not live yet**. Render and Vercel are the selected hosts, with MongoDB Atlas as the database. The Render and Vercel dashboards currently require sign-in, so no services or live URLs could be created or verified from this session.

## Hosting configuration

The backend Render Blueprint is in [`render.yaml`](./render.yaml). Create a Render Web Service from the backend repository and use the Blueprint; it builds from `api-service` and starts with `npm start`.

The frontend Vercel configuration is in `vercel.json` at the frontend repository root. Import that repository as a Vite project with its repository root as the project root.

Set these variables in the hosting dashboards; do not commit secrets:

| Service | Variable | Value |
| --- | --- | --- |
| Render API | `Database_URL` | MongoDB Atlas connection string |
| Render API | `JWT_SECRET` | Unique random secret, at least 32 characters |
| Render API | `NODE_ENV` | `production` |
| Render API | `CORS_ORIGINS` | Exact deployed frontend origin, with no trailing slash |
| Render API | `PORT` | Supplied by Render |
| Vercel frontend | `VITE_API_BASE_URL` | `https://<render-service>.onrender.com/api` |

After both services deploy, verify `GET https://<render-service>.onrender.com/api/genres` returns the catalog data, then test a catalog search from the Vercel URL. For browser authentication, the API uses a `Secure; SameSite=None` cookie in production and only permits credentialed CORS from the configured frontend origin.

## Production-readiness issue found and resolved

While preparing the separate frontend and API origins, the existing production auth cookie was `SameSite=Strict`. That would prevent the Vercel-hosted frontend from sending the cookie to the Render API. Production cookies now use `SameSite=None; Secure`; CORS remains limited to the exact `CORS_ORIGINS` allowlist, and state-changing requests with an unlisted `Origin` are rejected. This issue was caught during deployment preparation, before a provider deployment; no live-provider incident is being claimed.

No hosting-provider deployment issue or resolution can be truthfully recorded until an authenticated Render/Vercel deployment is completed.

## Live URLs

- Frontend: not deployed yet
- Backend: not deployed yet
