import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam/deudor";
const RENAPER_API_URL =
  "http://10.20.252.226/gateway//api/v1/persons/human/renaper";
const DOCUMENT_TYPE_ID = "5";
const APP_AUDIT_HEADER = "Sistema REDAM - Consulta deudor";
const GENDER_IDS = {
  F: "4",
  M: "5",
  X: "6"
};

const initialForm = {
  tipoDocDeudor: "DNI",
  docDeudor: "",
  nombresDeudor: "",
  apellidosDeudor: "",
  sexo: ""
};

const requiredFields = ["docDeudor"];

function CargarPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isLeaving, setIsLeaving] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]);
  const [isDeudorValidated, setIsDeudorValidated] = useState(false);
  const [isCheckingRenaper, setIsCheckingRenaper] = useState(false);
  const [message, setMessage] = useState({
    visible: false,
    type: "error",
    title: "",
    text: ""
  });
  const timeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const messageRef = useRef(null);

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

  useEffect(() => {
    if (message.visible && message.type === "exito" && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message]);

  const showMessage = (type, title, text) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage({ visible: true, type, title, text });

    if (title === "Datos recuperados correctamente") {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setMessage((prev) => ({ ...prev, visible: false }));
    }, type === "exito" ? 10000 : 8000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "docDeudor" ? value.replace(/\D/g, "") : value.toUpperCase();

    setInvalidFields((prev) => prev.filter((field) => field !== name));
    setForm((prev) => {
      const nextForm = { ...prev, [name]: nextValue };

      if (name === "docDeudor" || name === "sexo") {
        nextForm.nombresDeudor = "";
        nextForm.apellidosDeudor = "";
        setIsDeudorValidated(false);
      }

      return nextForm;
    });
  };

  const handleConsultarRenaper = async () => {
    const dni = form.docDeudor.trim();
    const sexo = form.sexo;
    const missingFields = [];

    if (!dni) {
      missingFields.push("docDeudor");
    }
    if (!sexo) {
      missingFields.push("sexo");
    }

    if (missingFields.length > 0) {
      setInvalidFields(missingFields);
      showMessage("error", "Debe completar el N° DNI", "");
      return;
    }

    const genderId = GENDER_IDS[sexo];
    if (!genderId) {
      showMessage("error", "Sexo invalido", "");
      return;
    }

    setInvalidFields([]);
    setIsCheckingRenaper(true);

    try {
      const query = new URLSearchParams({
        document: dni,
        genderId,
        documentTypeId: DOCUMENT_TYPE_ID
      });
      const response = await fetch(`${RENAPER_API_URL}?${query.toString()}`, {
        headers: {
          app: APP_AUDIT_HEADER
        }
      });
      const body = await response.json();
      const respuesta =
        body?.response?.respuesta ??
        body?.respuesta ??
        body?.response ??
        body;
      const nombres = String(
        respuesta?.nombres ?? respuesta?.nombre ?? respuesta?.firstName ?? ""
      ).trim();
      const apellidos = String(
        respuesta?.apellidos ?? respuesta?.apellido ?? respuesta?.lastName ?? ""
      ).trim();
      const flag = String(body?.response?.flag ?? body?.flag ?? "").trim().toUpperCase();
      const hasPersonData = Boolean(nombres && apellidos);

      if (hasPersonData || flag === "SI") {
        setForm((prev) => ({
          ...prev,
          nombresDeudor: nombres.toUpperCase(),
          apellidosDeudor: apellidos.toUpperCase()
        }));
        setIsDeudorValidated(true);
        showMessage("exito", "Datos recuperados correctamente", "");
        return;
      }

      setIsDeudorValidated(false);
      showMessage(
        "error",
        "No se pudieron recuperar los datos del deudor",
        body?.response?.msjerrores?.[0] || ""
      );
    } catch {
      setIsDeudorValidated(false);
      showMessage("error", "Error al consultar RENAPER", "Intente nuevamente mas tarde.");
    } finally {
      setIsCheckingRenaper(false);
    }
  };

  const handleGuardar = async () => {
    const missingFields = requiredFields.filter((field) => !String(form[field] ?? "").trim());

    if (missingFields.length > 0) {
      setInvalidFields(missingFields);
      showMessage("error", "Debe completar el DNI del deudor", "");
      return;
    }

    if (!isDeudorValidated) {
      showMessage("error", "Debe completar el DNI del deudor", "");
      return;
    }

    setInvalidFields([]);

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
        setIsDeudorValidated(false);
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
              <label className={invalidFields.includes("tipoDocDeudor") ? "label-invalido" : ""}>
                Tipo Doc. Deudor:
              </label>
              <input
                name="tipoDocDeudor"
                type="text"
                value={form.tipoDocDeudor}
                readOnly
                className={invalidFields.includes("tipoDocDeudor") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group form-group-radio">
              <label className={invalidFields.includes("sexo") ? "label-invalido" : ""}>Sexo:</label>
              <div className={`radio-group${invalidFields.includes("sexo") ? " radio-group-invalido" : ""}`}>
                <label className={`radio-option${form.sexo === "MASCULINO" ? " radio-option-activa" : ""}`}>
                  <input
                    name="sexo"
                    type="radio"
                    value="M"
                    checked={form.sexo === "M"}
                    onChange={handleChange}
                  />
                  <span>Masculino</span>
                </label>
                <label className={`radio-option${form.sexo === "F" ? " radio-option-activa" : ""}`}>
                  <input
                    name="sexo"
                    type="radio"
                    value="F"
                    checked={form.sexo === "F"}
                    onChange={handleChange}
                  />
                  <span>Femenino</span>
                </label>
                <label className={`radio-option${form.sexo === "X" ? " radio-option-activa" : ""}`}>
                  <input
                    name="sexo"
                    type="radio"
                    value="X"
                    checked={form.sexo === "X"}
                    onChange={handleChange}
                  />
                  <span>X</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("docDeudor") ? "label-invalido" : ""}>
                DNI Deudor:
              </label>
              <div className="input-action-group">
                <input
                  name="docDeudor"
                  type="text"
                  value={form.docDeudor}
                  onChange={handleChange}
                  inputMode="numeric"
                  className={invalidFields.includes("docDeudor") ? "input-invalido" : ""}
                />
                <button
                  type="button"
                  className="btn-check-inline"
                  aria-label="Confirmar DNI"
                  onClick={handleConsultarRenaper}
                  disabled={isCheckingRenaper || !form.sexo}
                >
                  {isCheckingRenaper ? "..." : "\u2713"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("nombresDeudor") ? "label-invalido" : ""}>
                Nombres Deudor:
              </label>
              <input
                name="nombresDeudor"
                type="text"
                value={form.nombresDeudor}
                onChange={handleChange}
                readOnly
                className={invalidFields.includes("nombresDeudor") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("apellidosDeudor") ? "label-invalido" : ""}>
                Apellidos Deudor:
              </label>
              <input
                name="apellidosDeudor"
                type="text"
                value={form.apellidosDeudor}
                onChange={handleChange}
                readOnly
                className={invalidFields.includes("apellidosDeudor") ? "input-invalido" : ""}
              />
            </div>
            <div className="botones-form">
              <button type="button" onClick={handleGuardar} disabled={!isDeudorValidated}>
                Cargar deudor
              </button>
              <button type="button" onClick={handleVolver}>
                Volver
              </button>
            </div>
          </form>

          {message.visible && (
            <div className="mensaje-no-resultados" ref={messageRef}>
              <div
                className={`mensaje-contenido ${
                  message.type === "exito"
                    ? "exito exito-compacto"
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
