import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam/deudor";

const initialForm = {
  tipoDocDeudor: "DNI",
  docDeudor: "",
  nombresDeudor: "",
  apellidosDeudor: ""
};

const requiredFields = ["tipoDocDeudor", "docDeudor", "nombresDeudor", "apellidosDeudor"];

function CargarPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState({
    visible: false,
    type: "error",
    title: "",
    text: ""
  });
  const timeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const showMessage = (type, title, text) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage({ visible: true, type, title, text });

    timeoutRef.current = setTimeout(() => {
      setMessage((prev) => ({ ...prev, visible: false }));
    }, type === "exito" ? 10000 : 8000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "docDeudor" ? value.replace(/\D/g, "") : value.toUpperCase();

    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleGuardar = async () => {
    for (const field of requiredFields) {
      if (!String(form[field] ?? "").trim()) {
        showMessage(
          "error",
          "Todos los campos son obligatorios",
          "Complete todos los datos requeridos para cargar el deudor."
        );
        return;
      }
    }

    const payload = {
      tipoDocDeudor: form.tipoDocDeudor,
      docDeudor: form.docDeudor.trim(),
      nombresDeudor: form.nombresDeudor.trim(),
      apellidosDeudor: form.apellidosDeudor.trim()
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      if (response.ok && body.flag === true) {
        showMessage(
          "exito",
          "Deudor creado correctamente",
          body.message || "El deudor fue creado correctamente."
        );
        setForm(initialForm);
        return;
      }

      showMessage(
        "error",
        "No se pudo crear el deudor",
        body.message || "No se pudo crear el deudor. Intente nuevamente mas tarde."
      );
    } catch {
      showMessage(
        "error",
        "Error de conexion",
        "No se pudo crear el deudor en este momento. Intente nuevamente mas tarde."
      );
    }
  };

  const handleVolver = () => {
    setIsLeaving(true);

    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    leaveTimeoutRef.current = setTimeout(() => {
      navigate("/");
    }, 280);
  };

  return (
    <>
      <Header fallbackUsername="Yael Zalazar" />
      <main className={`container${isLeaving ? " page-leaving" : ""}`}>
        <h1>Mi Oficina</h1>

        <div className="cards top-cards">
          <div className="card">
            <img src="/img/cargar.png" alt="Cargar" />
            <h3>Alta de deudor</h3>
            <p>
              Este formulario registra un deudor con sus datos basicos para la nueva version del
              servicio REDAM.
            </p>
          </div>

          <div className="card">
            <img src="/img/ayuda.png" alt="Normativa" />
            <h3>Datos requeridos</h3>
            <p>
              Complete tipo de documento, DNI, nombres y apellidos del deudor para generar el alta
              inicial.
            </p>
          </div>
        </div>

        <div className="search-card">
          <div className="search-title">
            <img src="/img/datos.png" alt="Formulario" />
            <span>Cargar Deudor</span>
          </div>

          <form className="search-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-group">
              <label>Tipo Doc. Deudor:</label>
              <input name="tipoDocDeudor" type="text" value={form.tipoDocDeudor} readOnly />
            </div>
            <div className="form-group">
              <label>DNI Deudor:</label>
              <input
                name="docDeudor"
                type="text"
                value={form.docDeudor}
                onChange={handleChange}
                inputMode="numeric"
              />
            </div>
            <div className="form-group">
              <label>Nombres Deudor:</label>
              <input
                name="nombresDeudor"
                type="text"
                value={form.nombresDeudor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Apellidos Deudor:</label>
              <input
                name="apellidosDeudor"
                type="text"
                value={form.apellidosDeudor}
                onChange={handleChange}
              />
            </div>

            <div className="botones-form">
              <button type="button" onClick={handleGuardar}>
                Cargar deudor
              </button>
              <button type="button" onClick={handleVolver}>
                Volver
              </button>
            </div>
          </form>

          {message.visible && (
            <div className="mensaje-no-resultados">
              <div
                className={`mensaje-contenido ${
                  message.type === "exito"
                    ? "exito tarjeta-exito-3d"
                    : "error validacion-obligatoria"
                }`}
              >
                <div className="icono-resultado">{message.type === "exito" ? "\u2713" : "!"}</div>
                <h3>{message.title}</h3>
                {message.text && message.text !== message.title && <p>{message.text}</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default CargarPage;
