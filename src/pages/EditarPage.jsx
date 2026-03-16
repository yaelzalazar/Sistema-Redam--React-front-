import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam";
const RENAPER_API_URL =
  "http://10.20.252.226/gateway//api/v1/persons/human/renaper";
const DOCUMENT_TYPE_ID = "5";
const APP_AUDIT_HEADER = "Sistema REDAM - Consulta demandante";
const GENDER_IDS = {
  F: "4",
  M: "5",
  X: "6"
};

const initialForm = {
  provincia: "MENDOZA",
  tribunal: "",
  dniDeudor: "",
  nombresDeudor: "",
  apellidosDeudor: "",
  numeroExpediente: "",
  motivo: "",
  monto: "",
  banco: "",
  sexoDemandante: "",
  nombreDemandante: "",
  apellidoDemandante: "",
  tipoDocDemandante: "DNI",
  dniDemandante: "",
  observaciones: ""
};

const requiredFields = [
  "dniDeudor",
  "numeroExpediente",
  "tipoDocDemandante",
  "dniDemandante"
];

function EditarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLeaving, setIsLeaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [tribunales, setTribunales] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);
  const [isDemandanteValidated, setIsDemandanteValidated] = useState(false);
  const [isCheckingRenaper, setIsCheckingRenaper] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({
    visible: false,
    type: "error",
    title: "",
    text: ""
  });
  const leaveTimeoutRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cargarTribunales = async () => {
      try {
        const response = await fetch(`${API_URL}/tribunales`);
        const body = await response.json();
        const rawTribunales = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];
        const parsedTribunales = rawTribunales
          .map((item) => {
            if (typeof item === "string") {
              return item.trim().toUpperCase();
            }

            return String(
              item?.tribunal ?? item?.nombre ?? item?.descripcion ?? item?.value ?? ""
            )
              .trim()
              .toUpperCase();
          })
          .filter(Boolean);

        if (isMounted) {
          setTribunales([...new Set(parsedTribunales)]);
        }
      } catch {
        if (isMounted) {
          setTribunales([]);
        }
      }
    };

    cargarTribunales();

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    const storedDeudorData = JSON.parse(sessionStorage.getItem("redamDeudorData") || "null");
    const dniDeudor = location.state?.dniDeudor ?? storedDeudorData?.dniDeudor;
    const nombresDeudor = location.state?.nombresDeudor ?? storedDeudorData?.nombresDeudor;
    const apellidosDeudor = location.state?.apellidosDeudor ?? storedDeudorData?.apellidosDeudor;

    if (!dniDeudor && !nombresDeudor && !apellidosDeudor) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      dniDeudor: dniDeudor ? String(dniDeudor) : prev.dniDeudor,
      nombresDeudor: nombresDeudor ? String(nombresDeudor).toUpperCase() : prev.nombresDeudor,
      apellidosDeudor: apellidosDeudor
        ? String(apellidosDeudor).toUpperCase()
        : prev.apellidosDeudor
    }));
  }, [location.state]);

  useEffect(() => {
    if (message.visible && message.type === "exito" && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message]);

  const showMessage = (type, title, text) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage({ visible: true, type, title, text });

    if (title === "Datos del demandante recuperados correctamente") {
      return;
    }

    messageTimeoutRef.current = setTimeout(() => {
      setMessage((prev) => ({ ...prev, visible: false }));
    }, type === "exito" ? 10000 : 8000);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "dniDeudor" || name === "dniDemandante" || name === "monto") {
      nextValue = value.replace(/\D/g, "");
    } else {
      nextValue = value.toUpperCase();
    }

    setInvalidFields((prev) => prev.filter((field) => field !== name));
    setForm((prev) => {
      const nextForm = { ...prev, [name]: nextValue };

      if (name === "dniDemandante" || name === "sexoDemandante") {
        nextForm.nombreDemandante = "";
        nextForm.apellidoDemandante = "";
        setIsDemandanteValidated(false);
      }

      return nextForm;
    });
  };

  const handleConsultarDemandante = async () => {
    const dni = form.dniDemandante.trim();
    const sexo = form.sexoDemandante;
    const missingFields = [];

    if (!dni) {
      missingFields.push("dniDemandante");
    }
    if (!sexo) {
      missingFields.push("sexoDemandante");
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
          nombreDemandante: nombres.toUpperCase(),
          apellidoDemandante: apellidos.toUpperCase()
        }));
        setIsDemandanteValidated(true);
        showMessage("exito", "Datos del demandante recuperados correctamente", "");
        return;
      }

      setIsDemandanteValidated(false);
      showMessage(
        "error",
        "No se pudieron recuperar los datos del demandante",
        body?.response?.msjerrores?.[0] || ""
      );
    } catch {
      setIsDemandanteValidated(false);
      showMessage("error", "Error al consultar RENAPER", "Intente nuevamente mas tarde.");
    } finally {
      setIsCheckingRenaper(false);
    }
  };

  const handleGuardar = async () => {
    const missingFields = requiredFields.filter((field) => !String(form[field] ?? "").trim());

    if (missingFields.length > 0) {
      setInvalidFields(missingFields);
      showMessage(
        "error",
        "Complete todos los datos requeridos para cargar el demandante.",
        "Complete todos los datos requeridos para cargar el demandante."
      );
      return;
    }

    if (!isDemandanteValidated) {
      showMessage("error", "Debe validar el DNI del demandante", "");
      return;
    }

    setInvalidFields([]);
    setIsSubmitting(true);

    const payload = {
      provincia: form.provincia.trim(),
      tribunal: form.tribunal.trim(),
      dniDeudor: form.dniDeudor.trim(),
      numeroExpediente: form.numeroExpediente.trim().toUpperCase(),
      motivo: form.motivo.trim(),
      monto: form.monto.trim(),
      banco: form.banco.trim(),
      nombreDemandante: form.nombreDemandante.trim(),
      apellidoDemandante: form.apellidoDemandante.trim(),
      tipoDocDemandante: form.tipoDocDemandante.trim(),
      dniDemandante: form.dniDemandante.trim(),
      observaciones: form.observaciones.trim()
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
          "Datos del demandante cargados correctamente",
          body.message || "Datos del demandante cargados correctamente"
        );
        setIsDemandanteValidated(false);
        setForm(initialForm);
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          setIsLeaving(true);
          if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
          }
          leaveTimeoutRef.current = setTimeout(() => {
            navigate("/");
          }, 280);
        }, 4000);
        return;
      }

      showMessage(
        "error",
        "No se pudo cargar el demandante",
        body.message || "No se pudo cargar el demandante. Intente nuevamente mas tarde."
      );
      setIsSubmitting(false);
    } catch {
      showMessage(
        "error",
        "Error de conexion",
        "No se pudo cargar el demandante en este momento. Intente nuevamente mas tarde."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header fallbackUsername="Yael Zalazar" />
      <main className={`container${isLeaving ? " page-leaving" : ""}`}>
        <h1>Mi Oficina</h1>

        <div className="cards top-cards">
          <div className="card">
            <img src="/img/consulta.png" alt="Consultar" />
            <h3>Registro del demandante</h3>
            <p>
              Este formulario registra al demandante con sus datos basicos para la nueva version
              del servicio REDAM.
            </p>
          </div>

          <div className="card">
            <img src="/img/ayuda.png" alt="Normativa" />
            <h3>Normativa</h3>
            <p>
              - Ley 6897. 26 de febrero del 2001
              <br />
              - Ley 8326. 27 de julio de 2011
              <br />- Acordada 24.325. 19 de junio de 2012
            </p>
          </div>
        </div>

        <div className="search-card">
          <div className="search-title">
            <img src="/img/datos.png" alt="Formulario" />
            <span>Cargar Demandante</span>
          </div>

          <form className="search-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-group">
              <label>Provincia:</label>
              <input name="provincia" type="text" value={form.provincia} readOnly />
            </div>
            <div className="form-group">
              <label>Tribunal:</label>
              <input
                name="tribunal"
                type="text"
                value={form.tribunal}
                onChange={handleChange}
                list="tribunales-lista"
                autoComplete="off"
              />
              <datalist id="tribunales-lista">
                {tribunales.map((tribunal) => (
                  <option key={tribunal} value={tribunal} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("dniDeudor") ? "label-invalido" : ""}>
                DNI Deudor:
              </label>
              <input
                name="dniDeudor"
                type="text"
                value={form.dniDeudor}
                readOnly
                className={invalidFields.includes("dniDeudor") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group">
              <label>Nombres Deudor:</label>
              <input name="nombresDeudor" type="text" value={form.nombresDeudor} readOnly />
            </div>
            <div className="form-group">
              <label>Apellidos Deudor:</label>
              <input name="apellidosDeudor" type="text" value={form.apellidosDeudor} readOnly />
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("numeroExpediente") ? "label-invalido" : ""}>
                Numero Expediente:
              </label>
              <input
                name="numeroExpediente"
                type="text"
                value={form.numeroExpediente}
                onChange={handleChange}
                className={invalidFields.includes("numeroExpediente") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group">
              <label>Motivo:</label>
              <input name="motivo" type="text" value={form.motivo} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Monto:</label>
              <input name="monto" type="text" value={form.monto} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Banco:</label>
              <input name="banco" type="text" value={form.banco} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("tipoDocDemandante") ? "label-invalido" : ""}>
                Tipo Doc Demandante:
              </label>
              <input
                name="tipoDocDemandante"
                type="text"
                value={form.tipoDocDemandante}
                readOnly
                className={invalidFields.includes("tipoDocDemandante") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group form-group-radio">
              <label className={invalidFields.includes("sexoDemandante") ? "label-invalido" : ""}>
                Sexo:
              </label>
              <div className={`radio-group${invalidFields.includes("sexoDemandante") ? " radio-group-invalido" : ""}`}>
                <label className={`radio-option${form.sexoDemandante === "M" ? " radio-option-activa" : ""}`}>
                  <input
                    name="sexoDemandante"
                    type="radio"
                    value="M"
                    checked={form.sexoDemandante === "M"}
                    onChange={handleChange}
                  />
                  <span>Masculino</span>
                </label>
                <label className={`radio-option${form.sexoDemandante === "F" ? " radio-option-activa" : ""}`}>
                  <input
                    name="sexoDemandante"
                    type="radio"
                    value="F"
                    checked={form.sexoDemandante === "F"}
                    onChange={handleChange}
                  />
                  <span>Femenino</span>
                </label>
                <label className={`radio-option${form.sexoDemandante === "X" ? " radio-option-activa" : ""}`}>
                  <input
                    name="sexoDemandante"
                    type="radio"
                    value="X"
                    checked={form.sexoDemandante === "X"}
                    onChange={handleChange}
                  />
                  <span>X</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("dniDemandante") ? "label-invalido" : ""}>
                DNI Demandante:
              </label>
              <div className="input-action-group">
                <input
                  name="dniDemandante"
                  type="text"
                  value={form.dniDemandante}
                  onChange={handleChange}
                  className={invalidFields.includes("dniDemandante") ? "input-invalido" : ""}
                />
                <button
                  type="button"
                  className="btn-check-inline"
                  aria-label="Confirmar DNI demandante"
                  onClick={handleConsultarDemandante}
                  disabled={isCheckingRenaper || !form.sexoDemandante}
                >
                  {isCheckingRenaper ? "..." : "\u2713"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("nombreDemandante") ? "label-invalido" : ""}>
                Nombres Demandante:
              </label>
              <input
                name="nombreDemandante"
                type="text"
                value={form.nombreDemandante}
                onChange={handleChange}
                readOnly
                className={invalidFields.includes("nombreDemandante") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group">
              <label className={invalidFields.includes("apellidoDemandante") ? "label-invalido" : ""}>
                Apellidos Demandante:
              </label>
              <input
                name="apellidoDemandante"
                type="text"
                value={form.apellidoDemandante}
                onChange={handleChange}
                readOnly
                className={invalidFields.includes("apellidoDemandante") ? "input-invalido" : ""}
              />
            </div>
            <div className="form-group">
              <label>Observaciones:</label>
              <input
                name="observaciones"
                type="text"
                value={form.observaciones}
                onChange={handleChange}
              />
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

          <div className="botones-form">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={!isDemandanteValidated || isSubmitting}
            >
              Cargar demandante
            </button>
            <button type="button" onClick={handleVolver} disabled={isSubmitting}>
              Volver
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default EditarPage;
