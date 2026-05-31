# React Boilerplate

Vite + React 18 + Tailwind CSS + Axios starter, built to pair with the Django rfh-api backend.

## Stack

| Tool | Version |
|---|---|
| React | 18 |
| Vite | 5 |
| Tailwind CSS | 3 |
| Axios | 1.6 |
| React Router | 6 |
| clsx | 2 |

## Quick start

```bash
# Install dependencies
npm install

# Copy env file
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS/Linux

# Edit VITE_API_BASE_URL in .env.local to point at your Django server

# Start dev server (http://localhost:3000)
npm run dev
```

## Folder structure

```
src/
├── components/
│   ├── ui/             ← Atomic: Button, Card, Input, Spinner, Alert
│   ├── layout/         ← Navbar, Footer, MainLayout (Outlet wrapper)
│   └── common/         ← Shared widgets: StatsCard, DataTable
│
├── pages/              ← One file per route
│   ├── HomePage.jsx    ← Dashboard with stats + live API table
│   ├── AboutPage.jsx
│   └── NotFoundPage.jsx
│
├── services/
│   ├── api.js          ← Axios instance + JWT interceptors
│   ├── authService.js  ← login / logout / register / getProfile
│   ├── exampleService.js  ← CRUD for ExampleRecord (mirrors Django API)
│   └── index.js        ← re-exports
│
├── hooks/
│   ├── useApi.js       ← wraps any service call with loading/error state
│   ├── useDebounce.js  ← debounce a value
│   └── index.js
│
├── context/
│   ├── AuthContext.jsx ← user, login(), logout(), isAuthenticated
│   └── ThemeContext.jsx← theme ('light'|'dark'), toggleTheme()
│
├── utils/
│   └── index.js        ← cn(), formatDate(), formatNumber(), getErrorMessage()
│
├── assets/icons/       ← SVG icon files
├── App.jsx             ← Router + providers
├── main.jsx            ← ReactDOM.createRoot
└── index.css           ← Tailwind directives + base layer
```

## Adding a new resource

1. **Service** — `src/services/myResourceService.js` (copy exampleService.js)
2. **Page** — `src/pages/MyResourcePage.jsx`, use `useApi(MyResourceService.list)`
3. **Route** — add `<Route path="/my-resource" element={<MyResourcePage />} />` in `App.jsx`
4. **Nav link** — add to the `NAV_LINKS` array in `Navbar.jsx`

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Django API base URL |

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```
