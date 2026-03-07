import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import CargarPage from "./pages/CargarPage";
import ConsultarPage from "./pages/ConsultarPage";
import EditarPage from "./pages/EditarPage";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/consultar" element={<ConsultarPage />} />
      <Route path="/cargar" element={<CargarPage />} />
      <Route path="/editar" element={<EditarPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
