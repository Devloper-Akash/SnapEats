# Backend setup

Copy `.env.example` to `.env` and set `MONGODB_URL` and a long, private `JWT_SECRET` before starting the API.

## Admin panel

The admin interface is built with the existing frontend and served at `/admin.html`. It uses the same backend origin configured by `VITE_SERVER_URL` (defaults to the current SnapEats API URL).

Create the first superadmin once from the `backend` directory:

1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12 or more characters), and `ADMIN_MOBILE` in the backend environment.
2. Run `npm run seed:superadmin`.
3. Open `/admin.html` on the deployed frontend and sign in with that email and password.

The seed command does not overwrite an existing account. Keep the admin password and production environment values private. Admin login is limited to five attempts per IP in a 15-minute window.

Roles are `customer` (`user` in the existing database), `shopOwner` (`owner`), `deliveryBoy`, and `admin`. Admin sub-roles are `superadmin`, `manager`, `support`, and `finance`. Every `/api/admin/*` endpoint requires an active admin session. Admin session endpoints are `/api/admin/session/signin` and `/api/admin/session/signout`.

Current admin endpoints:

- `GET /api/admin/me` — current admin session.
- `GET /api/admin/dashboard` — platform metrics and dashboard lists.
- `GET /api/admin/shops?status=pending&search=&page=1&limit=10` — searchable, paginated shop queue.
- `PATCH /api/admin/shops/:shopId` — approval, suspension, or commission updates.

Shop updates are recorded in the `AdminAudit` collection. Shop commission defaults to 10% for older records that do not yet have a saved rate.

## Deploying the admin page

Build the frontend with `npm run build` from `frontend`; the output contains both `dist/index.html` (customer site) and `dist/admin.html` (admin page). Deploy the same `dist` directory using the existing frontend static-site service. Set `VITE_SERVER_URL` to the deployed backend URL before building. The backend deployment must include the admin routes and the MongoDB user/shop schema changes. Set the admin seed environment values on the backend service and run the seed command once from a release shell or local terminal connected to the production database.
