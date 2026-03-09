import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam";

const searchInitial = { dni: "", nombre: "", apellido: "" };

const detailFields = [
  { key: "provincia", label: "Provincia" },
  { key: "tribunal", label: "Tribunal" },
  { key: "nombreDeudor", label: "Nombre Deudor" },
  { key: "apellidoDeudor", label: "Apellido Deudor" },
  { key: "tipoDocDeudor", label: "Tipo Doc Deudor" },
  { key: "dniDeudor", label: "DNI Deudor" },
  { key: "numeroExpediente", label: "Numero Expediente" },
  { key: "motivo", label: "Motivo" },
  { key: "monto", label: "Monto" },
  { key: "banco", label: "Banco" },
  { key: "nombreDemandante", label: "Nombre Demandante" },
  { key: "apellidoDemandante", label: "Apellido Demandante" },
  { key: "tipoDocDemandante", label: "Tipo Doc Demandante" },
  { key: "dniDemandante", label: "DNI Demandante" },
  { key: "observaciones", label: "Observaciones" }
];

function ConsultarPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchInitial);
  const [resultados, setResultados] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [noResultados, setNoResultados] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const updateTimeoutRef = useRef(null);
  const deleteTimeoutRef = useRef(null);

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
    };
  }, []);

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (event) => {
    const { name, value } = event.target;
    setResultados((prev) =>
      prev.map((item, index) => (index === indiceActual ? { ...item, [name]: value } : item))
    );
  };

  const handleBuscar = async () => {
    const dni = search.dni.trim();
    const nombre = search.nombre.trim().toUpperCase();
    const apellido = search.apellido.trim().toUpperCase();

    if (!dni || !nombre || !apellido) {
      alert("Todos los campos son obligatorios");
      return;
    }

    setNoResultados(false);
    setMensajeBusqueda("");

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
    } catch {
      setResultados([]);
      setIndiceActual(0);
      setNoResultados(true);
      setMensajeBusqueda("Error al conectar con el servidor");
      setIsEditing(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!registroActual) {
      return;
    }

    for (const field of detailFields) {
      if (!String(registroActual[field.key] ?? "").trim()) {
        alert("No puede haber campos vacios");
        return;
      }
    }

    const datos = detailFields.reduce((acc, field) => {
      acc[field.key] = registroActual[field.key] ?? "";
      return acc;
    }, {});

    try {
      const response = await fetch(`${API_URL}/${registroActual.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      const body = await response.json();

      if (body.flag) {
        setShowUpdateSuccess(true);
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          setShowUpdateSuccess(false);
        }, 3000);
        setIsEditing(false);
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!registroActual) {
      return;
    }

    setShowDeleteModal(false);

    try {
      const response = await fetch(`${API_URL}/${registroActual.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        alert("No se pudo eliminar el registro");
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
        const nuevos = prev.filter((_, index) => index !== indiceActual);
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
      <main className="container">
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
                <label>Documento:</label>
                <input name="dni" type="text" value={search.dni} onChange={handleSearchChange} />
              </div>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  name="nombre"
                  type="text"
                  value={search.nombre}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="form-group">
                <label>Apellido:</label>
                <input
                  name="apellido"
                  type="text"
                  value={search.apellido}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="botones-form">
                <button type="button" onClick={handleBuscar}>
                  Buscar
                </button>
                <button type="button" onClick={() => navigate("/")}>
                  Volver
                </button>
              </div>
            </form>

            {noResultados && (
              <div className="mensaje-no-resultados">
                <div className="mensaje-contenido">
                  <div className="icono-resultado">🔍</div>
                  <h3>No se han encontrado resultados</h3>
                  <p>{mensajeBusqueda || "Verifique los datos ingresados e intente nuevamente."}</p>
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
                onClick={() => setIndiceActual((prev) => prev - 1)}
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
                onClick={() => setIndiceActual((prev) => prev + 1)}
                disabled={indiceActual === resultados.length - 1}
              >
                &#10095;
              </button>
            </div>

            {detailFields.map((field) => (
              <div className="form-group" key={field.key}>
                <label>{field.label}:</label>
                <input
                  name={field.key}
                  type="text"
                  value={registroActual[field.key] ?? ""}
                  onChange={handleDetailChange}
                  readOnly={!isEditing}
                />
              </div>
            ))}

            {showUpdateSuccess && (
              <div id="mensajeExito" className="mensaje-no-resultados">
                <div className="mensaje-contenido exito">
                  <div className="icono-resultado">✔</div>
                  <h3>Registro actualizado correctamente</h3>
                  <p>Los datos fueron modificados con exito.</p>
                </div>
              </div>
            )}

            {showDeleteModal && (
              <div id="modalConfirmarEliminar" className="mensaje-no-resultados" style={{ marginTop: 20 }}>
                <div className="mensaje-contenido">
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

            <div className="botones-form" style={{ marginTop: 30 }}>
              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)}>
                  Modificar datos
                </button>
              )}
              <button type="button" onClick={() => setShowDeleteModal(true)}>
                Eliminar deudor
              </button>
              {isEditing && (
                <button type="button" onClick={handleGuardarCambios}>
                  Guardar cambios
                </button>
              )}
              <button type="button" onClick={() => navigate("/")}>
                Volver
              </button>
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
