import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";

function HomePage() {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = (event, path) => {
    event.preventDefault();
    setIsLeaving(true);

    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    leaveTimeoutRef.current = setTimeout(() => {
      navigate(path);
    }, 280);
  };

  return (
    <>
      <Header />
      <main className={`container${isLeaving ? " page-leaving" : ""}`}>
        <h1>Mi Oficina</h1>
        <p className="subtitle">Accede a los diferentes procesos y servicios de tu oficina</p>

        <div className="cards">
          <Link to="/consultar" className="card-link" onClick={(event) => handleCardClick(event, "/consultar")}>
            <div className="card">
              <img src="/img/consulta.png" alt="Consultar" />
              <h3>Consultar deudores alimentarios</h3>
              <p>
                La consulta a la Base de Datos del Registro de Deudores Alimentarios Morosos es
                libre y de acceso gratuito Ley 8326.
              </p>
              <span className="link">Click para abrir</span>
            </div>
          </Link>

          <Link to="/cargar" className="card-link" onClick={(event) => handleCardClick(event, "/cargar")}>
            <div className="card">
              <img src="/img/cargar.png" alt="Cargar" />
              <h3>Cargar deudores alimentarios</h3>
              <p>
                El presente formulario se utiliza para la carga de datos de personas registradas
                como deudores alimentarios, conforme a la normativa vigente.
              </p>
              <span className="link">Click para abrir</span>
            </div>
          </Link>

          <Link to="/editar" className="card-link cargar-card" onClick={(event) => handleCardClick(event, "/editar")}>
            <div className="card">
              <img src="/img/editar.png" alt="Editar" />
              <h3>Editar Deudores Morosos</h3>
              <p>
                Autoriza a la persona a cargar y eliminar datos del Registro de Deudores
                Alimentarios.
              </p>
              <span className="link">Click para abrir</span>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}

export default HomePage;
