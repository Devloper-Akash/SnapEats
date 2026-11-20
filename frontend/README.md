# React + Vite

## Open the admin page locally

Run `npm run dev:admin` from the `frontend` directory. Vite will serve the app and open `http://localhost:5173/admin.html`. During local development, the admin page connects to `http://localhost:5000`; if your backend uses another address, set `VITE_ADMIN_SERVER_URL` in the frontend environment before starting Vite.

Do not open `admin.html` from File Explorer as a `file://` page. The admin UI is a React module app and needs to be served by Vite (locally) or by your deployed static site. In production, set `VITE_ADMIN_SERVER_URL` to the deployed backend before building, deploy the `dist` folder, and open `/admin.html` on the site URL.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
