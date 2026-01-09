import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker only in production to avoid interfering during development
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
} else {
  // In development, ensure no stale service worker remains registered
  // (optional) uncomment to auto-unregister during dev
  // serviceWorkerRegistration.unregister();
}
