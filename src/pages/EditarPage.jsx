import React from "react";
import { Link } from "react-router-dom";

function EditarPage() {
  return (
    <main className="container">
      <h1>Editar Deudores Morosos</h1>
      <p className="subtitle">Esta seccion estara disponible proximamente.</p>
      <Link to="/" className="card-link">
        Volver a Mi Oficina
      </Link>
    </main>
  );
}

export default EditarPage;
