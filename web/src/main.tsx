import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@xyflow/react/dist/style.css";
import "./atlas.css";
import "./desk.css";
import "./components/evidence-document.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
