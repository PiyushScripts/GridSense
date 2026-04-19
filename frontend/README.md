# Frontend Migration Target

The visual design already exists in the user's prototype HTML/CSS.

This folder will hold the React + TypeScript frontend that:

- preserves the current dashboard layout
- removes prototype-only `app.js` behavior
- consumes the Python backend API
- subscribes to live dashboard updates over WebSocket

Planned frontend modules:

- `components/overview`
- `components/segments`
- `components/network`
- `components/alerts`
- `components/charts`
- `components/control`
- `services/api`
- `services/socket`
