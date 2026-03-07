import React from "react";

function Header({ fallbackUsername = "Usuario" }) {
  const username = localStorage.getItem("username") || fallbackUsername;

  return (
    <header className="header">
      <div className="header-left">
        <img
          src="https://rpd-testing.jus.mendoza.gov.ar/vub/pres/imagenes/logo-drp.png"
          alt="Poder Judicial Mendoza"
        />
      </div>
      <div className="header-right">
        <span>
          Bienvenido: <strong>{username}</strong>
        </span>
      </div>
    </header>
  );
}

export default Header;
