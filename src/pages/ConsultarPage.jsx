import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam";
const RENAPER_API_URL =
  "http://10.20.252.226/gateway//api/v1/persons/human/renaper";
const DOCUMENT_TYPE_ID = "5";
const APP_AUDIT_HEADER = "Sistema REDAM - Consulta deudor";
const GENDER_IDS = {
  F: "4",
  M: "5",
  X: "6"
};

const searchInitial = { dni: "", nombre: "", apellido: "" };

const detailFields = [
  { key: "provincia", label: "Provincia" },
  { key: "tribunal", label: "Tribunal" },
  { key: "tipoDocDeudor", label: "Tipo Doc Deudor" },
  { key: "dniDeudor", label: "DNI Deudor" },
  { key: "nombreDeudor", label: "Nombres Deudor" },
  { key: "apellidoDeudor", label: "Apellidos Deudor" },
  { key: "numeroExpediente", label: "Numero Expediente" },
  { key: "motivo", label: "Motivo" },
  { key: "monto", label: "Monto" },
  { key: "banco", label: "Banco" },
  { key: "tipoDocDemandante", label: "Tipo Doc Demandante" },
  { key: "dniDemandante", label: "DNI Demandante" },
  { key: "nombreDemandante", label: "Nombres Demandante" },
  { key: "apellidoDemandante", label: "Apellidos Demandante" },
  { key: "observaciones", label: "Observaciones" }
];

const updatePayloadFields = [
  "provincia",
  "tribunal",
  "tipoDocDeudor",
  "dniDeudor",
  "nombreDeudor",
  "apellidoDeudor",
  "numeroExpediente",
  "motivo",
  "monto",
  "banco",
  "nombreDemandante",
  "apellidoDemandante",
  "tipoDocDemandante",
  "dniDemandante",
  "observaciones"
];

const nonEditableFields = [
  "provincia",
  "tribunal",
  "tipoDocDeudor",
  "nombreDeudor",
  "apellidoDeudor",
  "nombreDemandante",
  "apellidoDemandante",
  "tipoDocDemandante",
  "dniDemandante"
];

function ConsultarPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchInitial);
  const [resultados, setResultados] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [noResultados, setNoResultados] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");
  const [mensajeValidacion, setMensajeValidacion] = useState("");
  const [invalidSearchFields, setInvalidSearchFields] = useState([]);
  const [invalidDetailFields, setInvalidDetailFields] = useState([]);
  const [direccionPaginacion, setDireccionPaginacion] = useState("siguiente");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sexoDeudorEdit, setSexoDeudorEdit] = useState("");
  const [sexoDemandanteEdit, setSexoDemandanteEdit] = useState("");
  const [isCheckingDeudorRenaper, setIsCheckingDeudorRenaper] = useState(false);
  const [isDeudorRenaperValidated, setIsDeudorRenaperValidated] = useState(false);
  const [isCheckingDemandanteRenaper, setIsCheckingDemandanteRenaper] = useState(false);
  const [isDemandanteRenaperValidated, setIsDemandanteRenaperValidated] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const updateTimeoutRef = useRef(null);
  const deleteTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const validationTimeoutRef = useRef(null);

  const hasResults = resultados.length > 0;
  const registroActual = useMemo(() => resultados[indiceActual] || null, [resultados, indiceActual]);
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSexoDeudorEdit("");
    setSexoDemandanteEdit("");
    setIsCheckingDeudorRenaper(false);
    setIsCheckingDemandanteRenaper(false);
    setIsDeudorRenaperValidated(false);
    setIsDemandanteRenaperValidated(false);
  }, [indiceActual, isEditing]);

  const showValidationMessage = (text) => {
    setMensajeValidacion(text);

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      setMensajeValidacion("");
    }, 4500);
  };

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "dni" ? value.replace(/\D/g, "") : value.toUpperCase();
    setInvalidSearchFields((prev) => prev.filter((field) => field !== name));
    setSearch((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleDetailChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "dniDeudor" || name === "dniDemandante" || name === "monto"
        ? value.replace(/\D/g, "")
        : value.toUpperCase();

    setInvalidDetailFields((prev) => prev.filter((field) => field !== name));
    if (name === "dniDeudor") {
      setIsDeudorRenaperValidated(false);
    }
    if (name === "dniDemandante") {
      setIsDemandanteRenaperValidated(false);
    }
    setResultados((prev) =>
      prev.map((item, index) => (index === indiceActual ? { ...item, [name]: nextValue } : item))
    );
  };

  const handleSexoDeudorChange = (event) => {
    const nextSexo = event.target.value;
    setSexoDeudorEdit(nextSexo);
    setIsDeudorRenaperValidated(false);
    setInvalidDetailFields((prev) => prev.filter((field) => field !== "sexoDeudor"));
    setResultados((prev) =>
      prev.map((item, index) =>
        index === indiceActual
          ? {
              ...item,
              dniDeudor: "",
              nombreDeudor: "",
              apellidoDeudor: ""
            }
          : item
      )
    );
  };

  const handleSexoDemandanteChange = (event) => {
    const nextSexo = event.target.value;
    setSexoDemandanteEdit(nextSexo);
    setIsDemandanteRenaperValidated(false);
    setInvalidDetailFields((prev) => prev.filter((field) => field !== "sexoDemandante"));
    setResultados((prev) =>
      prev.map((item, index) =>
        index === indiceActual
          ? {
              ...item,
              dniDemandante: "",
              nombreDemandante: "",
              apellidoDemandante: ""
            }
          : item
      )
    );
  };

  const handlePaginaAnterior = () => {
    setDireccionPaginacion("anterior");
    setIndiceActual((prev) => prev - 1);
  };

  const handlePaginaSiguiente = () => {
    setDireccionPaginacion("siguiente");
    setIndiceActual((prev) => prev + 1);
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

  const handleBuscar = async () => {
    const dni = search.dni.trim();
    const nombre = search.nombre.trim().toUpperCase();
    const apellido = search.apellido.trim().toUpperCase();
    const missingFields = [];

    if (!dni) {
      missingFields.push("dni");
    }
    if (!nombre) {
      missingFields.push("nombre");
    }
    if (!apellido) {
      missingFields.push("apellido");
    }

    if (missingFields.length > 0) {
      setInvalidSearchFields(missingFields);
      showValidationMessage("Todos los campos son obligatorios");
      return;
    }

    setInvalidSearchFields([]);
    setNoResultados(false);
    setMensajeBusqueda("");
    setMensajeValidacion("");

    try {
      const query = new URLSearchParams({ dni, nombre, apellido });
      const response = await fetch(`${API_URL}?${query.toString()}`);
      const body = await response.json();
      const data = Array.isArray(body?.data) ? body.data : [];
      const isSuccess = response.ok && body?.flag && Number(body?.status) === 200;

      if (!isSuccess || data.length === 0) {
        setResultados([]);
        setIndiceActual(0);
        setNoResultados(true);
        setMensajeBusqueda(body?.message || "No se han encontrado resultados");
        setIsEditing(false);
        return;
      }

      setResultados(data);
      setIndiceActual(0);
      setNoResultados(false);
      setMensajeBusqueda("");
      setIsEditing(false);
      setInvalidDetailFields([]);
    } catch {
      setResultados([]);
      setIndiceActual(0);
      setNoResultados(true);
      setMensajeBusqueda("Error al conectar con el servidor");
      setIsEditing(false);
      setInvalidDetailFields([]);
    }
  };

  const handleGuardarCambios = async () => {
    if (!registroActual) {
      return;
    }

    if (sexoDeudorEdit && !isDeudorRenaperValidated) {
      setInvalidDetailFields((prev) => [...new Set([...prev, "dniDeudor", "sexoDeudor"])]);
      showValidationMessage("Debe validar el DNI del deudor con RENAPER");
      return;
    }

    if (sexoDemandanteEdit && !isDemandanteRenaperValidated) {
      setInvalidDetailFields((prev) => [...new Set([...prev, "dniDemandante", "sexoDemandante"])]);
      showValidationMessage("Debe validar el DNI del demandante con RENAPER");
      return;
    }

    const missingFields = updatePayloadFields.filter(
      (field) => !String(registroActual[field] ?? "").trim()
    );

    if (missingFields.length > 0) {
      setInvalidDetailFields(missingFields);
      showValidationMessage("Complete todos los datos requeridos para actualizar el registro");
      return;
    }

    setInvalidDetailFields([]);

    const datos = updatePayloadFields.reduce((acc, field) => {
      acc[field] = registroActual[field] ?? "";
      return acc;
    }, {});

    try {
      const response = await fetch(`${API_URL}/${registroActual.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      const body = await response.json();

      if (response.ok && body.flag) {
        const updatedRegistro = {
          ...registroActual,
          ...(body.data || {}),
          ...datos
        };
        setResultados((prev) =>
          prev.map((item, index) => (index === indiceActual ? updatedRegistro : item))
        );
        setShowUpdateSuccess(true);
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          setShowUpdateSuccess(false);
        }, 10000);
        setIsEditing(false);
        setMensajeValidacion("");
        return;
      }

      showValidationMessage(body.message || "No se pudo actualizar el registro");
    } catch {
      showValidationMessage("No se pudo actualizar el registro. Intente nuevamente mas tarde.");
    }
  };

  const handleConsultarDeudorRenaper = async () => {
    if (!registroActual) {
      return;
    }

    const dni = String(registroActual.dniDeudor ?? "").trim();
    const sexo = sexoDeudorEdit;
    const missingFields = [];

    if (!dni) {
      missingFields.push("dniDeudor");
    }
    if (!sexo) {
      missingFields.push("sexoDeudor");
    }

    if (missingFields.length > 0) {
      setInvalidDetailFields((prev) => [...new Set([...prev, ...missingFields])]);
      showValidationMessage("Debe completar el N° DNI");
      return;
    }

    const genderId = GENDER_IDS[sexo];
    if (!genderId) {
      showValidationMessage("Sexo invalido");
      return;
    }

    setInvalidDetailFields((prev) => prev.filter((field) => field !== "sexoDeudor"));
    setIsCheckingDeudorRenaper(true);

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
        setResultados((prev) =>
          prev.map((item, index) =>
            index === indiceActual
              ? {
                  ...item,
                  nombreDeudor: nombres.toUpperCase(),
                  apellidoDeudor: apellidos.toUpperCase()
                }
              : item
          )
        );
        setIsDeudorRenaperValidated(true);
        showValidationMessage("Datos del deudor recuperados correctamente");
        return;
      }

      setIsDeudorRenaperValidated(false);
      showValidationMessage(
        body?.response?.msjerrores?.[0] || "No se pudieron recuperar los datos del deudor"
      );
    } catch {
      setIsDeudorRenaperValidated(false);
      showValidationMessage("Error al consultar RENAPER");
    } finally {
      setIsCheckingDeudorRenaper(false);
    }
  };

  const handleConsultarDemandanteRenaper = async () => {
    if (!registroActual) {
      return;
    }

    const dni = String(registroActual.dniDemandante ?? "").trim();
    const sexo = sexoDemandanteEdit;
    const missingFields = [];

    if (!dni) {
      missingFields.push("dniDemandante");
    }
    if (!sexo) {
      missingFields.push("sexoDemandante");
    }

    if (missingFields.length > 0) {
      setInvalidDetailFields((prev) => [...new Set([...prev, ...missingFields])]);
      showValidationMessage("Debe completar el N° DNI");
      return;
    }

    const genderId = GENDER_IDS[sexo];
    if (!genderId) {
      showValidationMessage("Sexo invalido");
      return;
    }

    setInvalidDetailFields((prev) => prev.filter((field) => field !== "sexoDemandante"));
    setIsCheckingDemandanteRenaper(true);

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
        setResultados((prev) =>
          prev.map((item, index) =>
            index === indiceActual
              ? {
                  ...item,
                  nombreDemandante: nombres.toUpperCase(),
                  apellidoDemandante: apellidos.toUpperCase()
                }
              : item
          )
        );
        setIsDemandanteRenaperValidated(true);
        showValidationMessage("Datos del demandante recuperados correctamente");
        return;
      }

      setIsDemandanteRenaperValidated(false);
      showValidationMessage(
        body?.response?.msjerrores?.[0] || "No se pudieron recuperar los datos del demandante"
      );
    } catch {
      setIsDemandanteRenaperValidated(false);
      showValidationMessage("Error al consultar RENAPER");
    } finally {
      setIsCheckingDemandanteRenaper(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!registroActual) {
      return;
    }

    const deletingId = registroActual.id;
    setShowDeleteModal(false);

    try {
      const response = await fetch(`${API_URL}/${deletingId}`, {
        method: "DELETE"
      });
      const body = await response.json();

      if (!response.ok || !body?.flag) {
        showValidationMessage(body?.message || "No se pudo eliminar el registro");
        return;
      }

      setShowDeleteSuccess(true);
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
      deleteTimeoutRef.current = setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 5000);

      setResultados((prev) => {
        const nuevos = prev.filter((item) => item.id !== deletingId);
        if (nuevos.length === 0) {
          setIndiceActual(0);
          setIsEditing(false);
          return nuevos;
        }
        setIndiceActual((old) => (old >= nuevos.length ? nuevos.length - 1 : old));
        return nuevos;
      });
    } catch {
      alert("Error al conectar con el servidor");
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
            <h3>Consultar deudores alimentarios</h3>
            <p>
              La consulta a la Base de Datos del Registro de Deudores Alimentarios Morosos es libre
              y de acceso gratuito Ley 8326.
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

        {!hasResults && (
          <div className="search-card" id="bloqueBusqueda">
            <div className="search-title">
              <img src="/img/datos.png" alt="Buscar" />
              <span>Buscar por Documento / Nombre y Apellido</span>
            </div>

            <form className="search-form" onSubmit={(event) => event.preventDefault()}>
              <div className="form-group">
                <label className={invalidSearchFields.includes("dni") ? "label-invalido" : ""}>
                  Documento:
                </label>
                <input
                  name="dni"
                  type="text"
                  value={search.dni}
                  onChange={handleSearchChange}
                  className={invalidSearchFields.includes("dni") ? "input-invalido" : ""}
                />
              </div>
              <div className="form-group">
                <label className={invalidSearchFields.includes("nombre") ? "label-invalido" : ""}>
                  Nombres:
                </label>
                <input
                  name="nombre"
                  type="text"
                  value={search.nombre}
                  onChange={handleSearchChange}
                  className={invalidSearchFields.includes("nombre") ? "input-invalido" : ""}
                />
              </div>
              <div className="form-group">
                <label className={invalidSearchFields.includes("apellido") ? "label-invalido" : ""}>
                  Apellidos:
                </label>
                <input
                  name="apellido"
                  type="text"
                  value={search.apellido}
                  onChange={handleSearchChange}
                  className={invalidSearchFields.includes("apellido") ? "input-invalido" : ""}
                />
              </div>

              <div className="botones-form">
                <button type="button" onClick={handleBuscar}>
                  Buscar
                </button>
                <button type="button" onClick={handleVolver}>
                  Volver
                </button>
              </div>
            </form>

            {mensajeValidacion && (
              <div className="mensaje-no-resultados">
                <div className="mensaje-contenido validacion-obligatoria">
                  <div className="icono-resultado">!</div>
                  <h3>{mensajeValidacion}</h3>
                </div>
              </div>
            )}

            {noResultados && (
              <div className="mensaje-no-resultados">
                <div className="mensaje-contenido no-encontrado">
                  <div className="icono-resultado">🔍</div>
                  <h3>No se han encontrado resultados</h3>
                </div>
              </div>
            )}
          </div>
        )}

        {hasResults && registroActual && (
          <div className="search-card" id="bloqueDetalle">
            <div className="search-title">
              <span>Detalle del Registro</span>
            </div>

            <div className="paginacion-container" id="paginacion">
              <button
                type="button"
                className="btn-paginacion"
                onClick={handlePaginaAnterior}
                disabled={indiceActual === 0}
              >
                &#10094;
              </button>
              <span className="contador-paginacion">
                Resultado {indiceActual + 1} de {resultados.length}
              </span>
              <button
                type="button"
                className="btn-paginacion"
                onClick={handlePaginaSiguiente}
                disabled={indiceActual === resultados.length - 1}
              >
                &#10095;
              </button>
            </div>

            <div
              key={registroActual.id ?? indiceActual}
              className={`detalle-paginado detalle-${direccionPaginacion}`}
            >
              {detailFields.map((field) => (
                <React.Fragment key={field.key}>
                  <div className="form-group">
                    <label className={invalidDetailFields.includes(field.key) ? "label-invalido" : ""}>
                      {field.label}:
                    </label>
                    <input
                      name={field.key}
                      type="text"
                      value={registroActual[field.key] ?? ""}
                      onChange={handleDetailChange}
                      readOnly={
                        !isEditing ||
                        (field.key === "dniDeudor"
                          ? !sexoDeudorEdit
                          : field.key === "dniDemandante"
                            ? !sexoDemandanteEdit
                            : nonEditableFields.includes(field.key))
                      }
                      className={invalidDetailFields.includes(field.key) ? "input-invalido" : ""}
                    />
                  </div>
                  {field.key === "tribunal" && isEditing && (
                    <div className="form-group form-group-radio">
                      <label className={invalidDetailFields.includes("sexoDeudor") ? "label-invalido" : ""}>
                        Sexo:
                      </label>
                      <div className="input-action-group">
                        <div
                          className={`radio-group${
                            invalidDetailFields.includes("sexoDeudor") ? " radio-group-invalido" : ""
                          }`}
                        >
                          <label className={`radio-option${sexoDeudorEdit === "M" ? " radio-option-activa" : ""}`}>
                            <input
                              name="sexoDeudor"
                              type="radio"
                              value="M"
                              checked={sexoDeudorEdit === "M"}
                              onChange={handleSexoDeudorChange}
                            />
                            <span>Masculino</span>
                          </label>
                          <label className={`radio-option${sexoDeudorEdit === "F" ? " radio-option-activa" : ""}`}>
                            <input
                              name="sexoDeudor"
                              type="radio"
                              value="F"
                              checked={sexoDeudorEdit === "F"}
                              onChange={handleSexoDeudorChange}
                            />
                            <span>Femenino</span>
                          </label>
                          <label className={`radio-option${sexoDeudorEdit === "X" ? " radio-option-activa" : ""}`}>
                            <input
                              name="sexoDeudor"
                              type="radio"
                              value="X"
                              checked={sexoDeudorEdit === "X"}
                              onChange={handleSexoDeudorChange}
                            />
                            <span>X</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="btn-check-inline"
                          aria-label="Confirmar DNI deudor"
                          onClick={handleConsultarDeudorRenaper}
                          disabled={isCheckingDeudorRenaper || !sexoDeudorEdit}
                        >
                          {isCheckingDeudorRenaper ? "..." : "\u2713"}
                        </button>
                      </div>
                    </div>
                  )}
                  {field.key === "tipoDocDemandante" && isEditing && (
                    <div className="form-group form-group-radio">
                      <label className={invalidDetailFields.includes("sexoDemandante") ? "label-invalido" : ""}>
                        Sexo:
                      </label>
                      <div className="input-action-group">
                        <div
                          className={`radio-group${
                            invalidDetailFields.includes("sexoDemandante") ? " radio-group-invalido" : ""
                          }`}
                        >
                          <label className={`radio-option${sexoDemandanteEdit === "M" ? " radio-option-activa" : ""}`}>
                            <input
                              name="sexoDemandante"
                              type="radio"
                              value="M"
                              checked={sexoDemandanteEdit === "M"}
                              onChange={handleSexoDemandanteChange}
                            />
                            <span>Masculino</span>
                          </label>
                          <label className={`radio-option${sexoDemandanteEdit === "F" ? " radio-option-activa" : ""}`}>
                            <input
                              name="sexoDemandante"
                              type="radio"
                              value="F"
                              checked={sexoDemandanteEdit === "F"}
                              onChange={handleSexoDemandanteChange}
                            />
                            <span>Femenino</span>
                          </label>
                          <label className={`radio-option${sexoDemandanteEdit === "X" ? " radio-option-activa" : ""}`}>
                            <input
                              name="sexoDemandante"
                              type="radio"
                              value="X"
                              checked={sexoDemandanteEdit === "X"}
                              onChange={handleSexoDemandanteChange}
                            />
                            <span>X</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="btn-check-inline"
                          aria-label="Confirmar DNI demandante"
                          onClick={handleConsultarDemandanteRenaper}
                          disabled={isCheckingDemandanteRenaper || !sexoDemandanteEdit}
                        >
                          {isCheckingDemandanteRenaper ? "..." : "\u2713"}
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {mensajeValidacion && (
              <div className="mensaje-no-resultados">
                <div className="mensaje-contenido validacion-obligatoria">
                  <div className="icono-resultado">!</div>
                  <h3>{mensajeValidacion}</h3>
                </div>
              </div>
            )}

            {showUpdateSuccess && (
              <div id="mensajeExito" className="mensaje-no-resultados">
                <div className="mensaje-contenido exito exito-compacto">
                  <div className="icono-resultado">✔</div>
                  <h3>Registro actualizado correctamente</h3>
                </div>
              </div>
            )}

            {showDeleteModal && (
              <div id="modalConfirmarEliminar" className="mensaje-no-resultados" style={{ marginTop: 20 }}>
                <div className="mensaje-contenido error">
                  <div className="icono-resultado">⚠</div>
                  <h3>Esta seguro que desea eliminar este deudor?</h3>
                  <p>Esta accion no se puede deshacer.</p>
                  <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 15 }}>
                    <button type="button" onClick={handleConfirmarEliminar}>
                      Si, eliminar
                    </button>
                    <button type="button" onClick={() => setShowDeleteModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showDeleteModal && (
              <div className="botones-form" style={{ marginTop: 30 }}>
              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)}>
                  Modificar datos
                </button>
              )}
              {!isEditing && (
                <button type="button" onClick={() => setShowDeleteModal(true)}>
                  Eliminar deudor
                </button>
              )}
              {isEditing && (
                <button type="button" onClick={handleGuardarCambios}>
                  Guardar datos
                </button>
              )}
              <button type="button" onClick={handleVolver}>
                Volver
              </button>
              </div>
            )}
          </div>
        )}

        {showDeleteSuccess && (
          <div id="mensajeEliminadoGlobal" className="mensaje-no-resultados" style={{ marginTop: 20 }}>
            <div className="mensaje-contenido exito">
              <div className="icono-resultado">🗑</div>
              <h3>Registro eliminado correctamente</h3>
              <p>El deudor seleccionado fue eliminado del sistema.</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default ConsultarPage;
