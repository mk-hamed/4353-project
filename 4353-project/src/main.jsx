import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueueProvider } from "./context/QueueContext.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueueProvider>
        <App />
      </QueueProvider>
    </BrowserRouter>
  </StrictMode>,
);
