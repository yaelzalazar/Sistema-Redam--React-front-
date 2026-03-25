import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam";
const RENAPER_API_URL =
  "http://10.20.252.226/gateway//api/v1/persons/human/renaper";
const EXTERNAL_SEARCH_API_URL =
  "https://dev-api-drp.jus.mendoza.gov.ar/gateway/api/v1/redam/deudores/detalles-completo";
const EXTERNAL_DELETE_API_URL =
  "https://dev-api-drp.jus.mendoza.gov.ar/gateway/api/v1/redam/deudores";
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

const externalDetailFields = [
  { key: "provincia", label: "Provincia" },
  { key: "tribunal", label: "Tribunal" },
  { key: "dni", label: "DNI" },
  { key: "deudor", label: "Deudor" },
  { key: "demandante", label: "Demandante" },
  { key: "motivo", label: "Motivo" }
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

const normalizeYesNo = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

function ConsultarPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchInitial);
  const [resultados, setResultados] = useState([]);
  const [externalResultados, setExternalResultados] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [externalIndiceActual, setExternalIndiceActual] = useState(0);
  const [visualPageIndex, setVisualPageIndex] = useState(0);
  const [noResultados, setNoResultados] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");
  const [mensajeValidacion, setMensajeValidacion] = useState("");
  const [invalidSearchFields, setInvalidSearchFields] = useState([]);
  const [invalidDetailFields, setInvalidDetailFields] = useState([]);
  const [direccionPaginacion, setDireccionPaginacion] = useState("siguiente");
  const [direccionPaginacionExterna, setDireccionPaginacionExterna] = useState("siguiente");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sexoDeudorEdit, setSexoDeudorEdit] = useState("");
  const [sexoDemandanteEdit, setSexoDemandanteEdit] = useState("");
  const [isCheckingDeudorRenaper, setIsCheckingDeudorRenaper] = useState(false);
  const [isDeudorRenaperValidated, setIsDeudorRenaperValidated] = useState(false);
  const [isCheckingDemandanteRenaper, setIsCheckingDemandanteRenaper] = useState(false);
  const [isDemandanteRenaperValidated, setIsDemandanteRenaperValidated] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExternalDeleteModal, setShowExternalDeleteModal] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showExternalDeleteSuccess, setShowExternalDeleteSuccess] = useState(false);
  const updateTimeoutRef = useRef(null);
  const deleteTimeoutRef = useRef(null);
  const externalDeleteTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const validationTimeoutRef = useRef(null);

  const hasResults = resultados.length > 0;
  const hasExternalResults = externalResultados.length > 0;
  const hasAnyResults = hasResults || hasExternalResults;
  const combinedPages = useMemo(
    () => [
      ...externalResultados.map((item, index) => ({
        source: "external",
        index,
        id: item?.id ?? `external-${index}`
      })),
      ...resultados.map((item, index) => ({
        source: "internal",
        index,
        id: item?.id ?? `internal-${index}`
      }))
    ],
    [externalResultados, resultados]
  );
  const currentPage = useMemo(() => combinedPages[visualPageIndex] || null, [combinedPages, visualPageIndex]);
  const showingExternal = currentPage?.source === "external";
  const showingInternal = currentPage?.source === "internal";
  const registroActual = useMemo(() => resultados[indiceActual] || null, [resultados, indiceActual]);
  const externalRegistroActual = useMemo(
    () => externalResultados[externalIndiceActual] || null,
    [externalResultados, externalIndiceActual]
  );
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
      if (externalDeleteTimeoutRef.current) {
        clearTimeout(externalDeleteTimeoutRef.current);
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
    if (combinedPages.length === 0) {
      setVisualPageIndex(0);
      return;
    }

    setVisualPageIndex((prev) => Math.min(prev, combinedPages.length - 1));
  }, [combinedPages.length]);

  useEffect(() => {
    if (!currentPage) {
      return;
    }

    if (currentPage.source === "external" && externalIndiceActual !== currentPage.index) {
      setExternalIndiceActual(currentPage.index);
    }

    if (currentPage.source === "internal" && indiceActual !== currentPage.index) {
      setIndiceActual(currentPage.index);
    }
  }, [currentPage, externalIndiceActual, indiceActual]);

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

  const handlePaginaAnteriorVisual = () => {
    const nextPage = combinedPages[visualPageIndex - 1];
    if (!nextPage) {
      return;
    }

    if (nextPage.source === "external") {
      setDireccionPaginacionExterna("anterior");
    } else {
      setDireccionPaginacion("anterior");
    }

    setVisualPageIndex((prev) => prev - 1);
    setIsEditing(false);
  };

  const handlePaginaSiguienteVisual = () => {
    const nextPage = combinedPages[visualPageIndex + 1];
    if (!nextPage) {
      return;
    }

    if (nextPage.source === "external") {
      setDireccionPaginacionExterna("siguiente");
    } else {
      setDireccionPaginacion("siguiente");
    }

    setVisualPageIndex((prev) => prev + 1);
    setIsEditing(false);
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
    setShowDeleteModal(false);
    setShowExternalDeleteModal(false);

    try {
      const externalQuery = new URLSearchParams({ dni, nombre, apellido });
      const query = new URLSearchParams({ dni, nombre, apellido });
      const [externalResponse, response] = await Promise.all([
        fetch(`${EXTERNAL_SEARCH_API_URL}?${externalQuery.toString()}`),
        fetch(`${API_URL}?${query.toString()}`)
      ]);
      const [externalBody, body] = await Promise.all([
        externalResponse.json(),
        response.json()
      ]);
      const externalData = Array.isArray(externalBody?.contenido) ? externalBody.contenido : [];
      const externalFound =
        externalResponse.ok &&
        externalBody?.flag === true &&
        normalizeYesNo(externalBody?.esDeudor) === "SI" &&
        externalData.length > 0;
      const normalizedExternalData = externalFound
        ? externalData.map((item, index) => ({
            id: item?.id ?? item?.registro ?? index,
            provincia: String(item?.provincia ?? "").toUpperCase(),
            tribunal: String(item?.juzgado ?? "").toUpperCase(),
            dni: String(item?.dni ?? ""),
            deudor: String(item?.deudor ?? "").toUpperCase(),
            demandante: String(item?.actor ?? "").toUpperCase(),
            motivo: String(item?.sobre ?? "").toUpperCase()
          }))
        : [];
      const data = Array.isArray(body?.data) ? body.data : [];
      const isSuccess = response.ok && body?.flag && Number(body?.status) === 200;

      setExternalResultados(normalizedExternalData);
      setExternalIndiceActual(0);
      setVisualPageIndex(0);

      if (!isSuccess || data.length === 0) {
        setResultados([]);
        setIndiceActual(0);
        const nothingFound = normalizedExternalData.length === 0;
        setNoResultados(nothingFound);
        setMensajeBusqueda(
          nothingFound ? body?.message || body?.mensaje || "No se han encontrado resultados" : ""
        );
        setIsEditing(false);
        return;
      }

      setResultados(data);
      setIndiceActual(0);
      setVisualPageIndex(0);
      setNoResultados(false);
      setMensajeBusqueda("");
      setIsEditing(false);
      setInvalidDetailFields([]);
    } catch {
      setResultados([]);
      setExternalResultados([]);
      setIndiceActual(0);
      setExternalIndiceActual(0);
      setVisualPageIndex(0);
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

      if (!(response.ok && body?.flag)) {
        showValidationMessage(body?.message || body?.mensaje || "No se pudo eliminar el registro");
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
          if (!hasExternalResults) {
            setNoResultados(true);
          }
          return nuevos;
        }
        setIndiceActual((old) => (old >= nuevos.length ? nuevos.length - 1 : old));
        return nuevos;
      });
    } catch {
      showValidationMessage("Error al conectar con el servidor");
    }
  };

  const handlePaginaAnteriorExterna = () => {
    setDireccionPaginacionExterna("anterior");
    setExternalIndiceActual((prev) => prev - 1);
  };

  const handlePaginaSiguienteExterna = () => {
    setDireccionPaginacionExterna("siguiente");
    setExternalIndiceActual((prev) => prev + 1);
  };

  const handleConfirmarEliminarExterno = async () => {
    if (!externalRegistroActual) {
      return;
    }

    const deletingId = externalRegistroActual.id;
    setShowExternalDeleteModal(false);

    try {
      const response = await fetch(`${EXTERNAL_DELETE_API_URL}/${deletingId}`, {
        method: "DELETE"
      });
      const body = await response.json();

      if (!(response.ok && body?.flag)) {
        showValidationMessage(body?.message || body?.mensaje || "No se pudo eliminar el deudor");
        return;
      }

      setShowExternalDeleteSuccess(true);
      if (externalDeleteTimeoutRef.current) {
        clearTimeout(externalDeleteTimeoutRef.current);
      }
      externalDeleteTimeoutRef.current = setTimeout(() => {
        setShowExternalDeleteSuccess(false);
      }, 5000);

      setExternalResultados((prev) => {
        const nuevos = prev.filter((item) => item.id !== deletingId);
        if (nuevos.length === 0) {
          setExternalIndiceActual(0);
          if (!hasResults) {
            setNoResultados(true);
          }
          return nuevos;
        }
        setExternalIndiceActual((old) => (old >= nuevos.length ? nuevos.length - 1 : old));
        return nuevos;
      });
    } catch {
      showValidationMessage("Error al conectar con el servidor");
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

        {!hasAnyResults && (
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

        {showingExternal && externalRegistroActual && (
          <div className="search-card" id="bloqueDetalleExterno">
            <div className="search-title">
              <span>Resultado de Consulta Externa</span>
            </div>

            <div className="paginacion-container">
              <button
                type="button"
                className="btn-paginacion"
                onClick={handlePaginaAnteriorVisual}
                disabled={visualPageIndex === 0}
              >
                &#10094;
              </button>
              <span className="contador-paginacion">
                Resultado {visualPageIndex + 1} de {combinedPages.length}
              </span>
              <button
                type="button"
                className="btn-paginacion"
                onClick={handlePaginaSiguienteVisual}
                disabled={visualPageIndex === combinedPages.length - 1}
              >
                &#10095;
              </button>
            </div>

            <div
              key={`externo-${externalRegistroActual.id ?? externalIndiceActual}`}
              className={`detalle-paginado detalle-${direccionPaginacionExterna}`}
            >
              {externalDetailFields.map((field) => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}:</label>
                  <input type="text" value={externalRegistroActual[field.key] ?? ""} readOnly />
                </div>
              ))}
            </div>

            {showExternalDeleteModal && (
              <div className="mensaje-no-resultados" style={{ marginTop: 20 }}>
                <div className="mensaje-contenido error">
                  <div className="icono-resultado">⚠</div>
                  <h3>Esta seguro que desea eliminar este deudor?</h3>
                  <p>Esta accion no se puede deshacer.</p>
                  <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 15 }}>
                    <button type="button" onClick={handleConfirmarEliminarExterno}>
                      Si, eliminar
                    </button>
                    <button type="button" onClick={() => setShowExternalDeleteModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showExternalDeleteModal && (
              <div className="botones-form" style={{ marginTop: 30 }}>
                <button type="button" onClick={() => setShowExternalDeleteModal(true)}>
                  Eliminar deudor
                </button>
                <button type="button" onClick={handleVolver}>
                  Volver
                </button>
              </div>
            )}
          </div>
        )}

        {showingInternal && registroActual && (
          <div className="search-card" id="bloqueDetalle">
            <div className="search-title">
              <span>Detalle del Registro</span>
            </div>

            <div className="paginacion-container" id="paginacion">
              <button
                type="button"
                className="btn-paginacion"
                onClick={handlePaginaAnteriorVisual}
                disabled={visualPageIndex === 0}
              >
                &#10094;
              </button>
              <span className="contador-paginacion">
                Resultado {visualPageIndex + 1} de {combinedPages.length}
              </span>
              <button
                type="button"
                className="btn-paginacion"
                onClick={handlePaginaSiguienteVisual}
                disabled={visualPageIndex === combinedPages.length - 1}
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

        {showExternalDeleteSuccess && (
          <div className="mensaje-no-resultados" style={{ marginTop: 20 }}>
            <div className="mensaje-contenido exito">
              <div className="icono-resultado">🗑</div>
              <h3>Registro eliminado correctamente</h3>
              <p>El deudor seleccionado fue eliminado del servicio externo.</p>
            </div>
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

