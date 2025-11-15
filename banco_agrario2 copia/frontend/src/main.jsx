import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/index.css";
import App from "./App.jsx";
import HomePage from "./pages/HomePage.jsx";
import CapacityPage from "./pages/CapacityPage.jsx";
import ResourcesVsPage from "./pages/ResourcesVsPage.jsx";
import AssignmentPage from "./pages/AssignmentPage.jsx";

console.log("main.jsx loaded");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/capacidad" element={<CapacityPage />} />
          <Route path="/recursos-vs" element={<ResourcesVsPage />} />
          <Route path="/asignacion" element={<AssignmentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
