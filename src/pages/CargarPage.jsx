import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "http://localhost:8089/api/v1/registro-redam";

const initialForm = {
  provincia: "Mendoza",
  tribunal: "",
  nombreDeudor: "",
  apellidoDeudor: "",
  tipoDocDeudor: "",
  dniDeudor: "",
  numeroExpediente: "",
  motivo: "",
  monto: "",
  banco: "",
  nombreDemandante: "",
  apellidoDemandante: "",
  tipoDocDemandante: "",
  dniDemandante: "",
  observaciones: ""
};

const requiredFields = [
  "tribunal",
  "nombreDeudor",
  "apellidoDeudor",
  "tipoDocDeudor",
  "dniDeudor",
  "nombreDemandante",
  "apellidoDemandante",
  "tipoDocDemandante",
  "dniDemandante"
];

function CargarPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState({
    visible: false,
    type: "error",
    title: "",
    text: ""
  });
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
    }, 4000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    for (const field of requiredFields) {
      if (!form[field].trim()) {
        showMessage("error", "Campo obligatorio", `Falta completar el campo: ${field}`);
        return;
      }
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json();

      if (body.flag === true) {
        showMessage(
          "exito",
          "Registro creado correctamente",
          body.message || "El registro fue guardado con exito."
        );
        setForm(initialForm);
        return;
      }

      showMessage("error", "No se pudo crear el registro", body.message || "Ocurrio un error.");
    } catch {
      showMessage("error", "Error de conexion", "No se pudo conectar con el servidor.");
    }
  };

  return (
    <>
      <Header fallbackUsername="Yael Zalazar" />
      <main className="container">
        <h1>Mi Oficina</h1>

        <div className="cards top-cards">
          <div className="card">
            <img src="/img/cargar.png" alt="Cargar" />
            <h3>Cargar deudores alimentarios</h3>
            <p>
              El presente formulario se utiliza para la carga de datos de personas registradas como
              deudores alimentarios, conforme a la normativa vigente.
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
            <span>Cargar Deudor Alimentario</span>
          </div>

          <form className="search-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-group">
              <label>Provincia:</label>
              <input name="provincia" type="text" value={form.provincia} readOnly />
            </div>
            <div className="form-group">
              <label>Tribunal:</label>
              <input name="tribunal" type="text" value={form.tribunal} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Nombres Deudor:</label>
              <input
                name="nombreDeudor"
                type="text"
                value={form.nombreDeudor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Apellidos Deudor:</label>
              <input
                name="apellidoDeudor"
                type="text"
                value={form.apellidoDeudor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Tipo Doc. Deudor:</label>
              <input
                name="tipoDocDeudor"
                type="text"
                value={form.tipoDocDeudor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>DNI Deudor:</label>
              <input name="dniDeudor" type="text" value={form.dniDeudor} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Numero Expediente:</label>
              <input
                name="numeroExpediente"
                type="text"
                value={form.numeroExpediente}
                onChange={handleChange}
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
              <label>Nombre Demandante:</label>
              <input
                name="nombreDemandante"
                type="text"
                value={form.nombreDemandante}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Apellido Demandante:</label>
              <input
                name="apellidoDemandante"
                type="text"
                value={form.apellidoDemandante}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Tipo Doc Demandante:</label>
              <input
                name="tipoDocDemandante"
                type="text"
                value={form.tipoDocDemandante}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>DNI Demandante:</label>
              <input
                name="dniDemandante"
                type="text"
                value={form.dniDemandante}
                onChange={handleChange}
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

            <div className="botones-form">
              <button type="button" onClick={handleGuardar}>
                Cargar deudor
              </button>
              <button type="button" onClick={() => navigate("/")}>
                Volver
              </button>
            </div>
          </form>

          {message.visible && (
            <div className="mensaje-no-resultados">
              <div className={`mensaje-contenido${message.type === "exito" ? " exito" : ""}`}>
                <div className="icono-resultado">{message.type === "exito" ? "✔" : "⚠"}</div>
                <h3>{message.title}</h3>
                <p>{message.text}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default CargarPage;
