# Sistema Re.D.A.M - Front (React)

Migracion del frontend original en HTML/CSS/JS a React usando Vite.

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Instalacion

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abrir en navegador: `http://localhost:5173`

## Build de produccion

```bash
npm run build
```

La salida se genera en `dist/`.

## Estructura principal

```text
src/
  App.jsx
  main.jsx
  components/
    Header.jsx
  pages/
    HomePage.jsx
    ConsultarPage.jsx
    CargarPage.jsx
    EditarPage.jsx
public/
  img/
css/
  styles.css
```

## Rutas disponibles

- `/` -> Inicio (Mi Oficina)
- `/consultar` -> Consulta, modificacion y eliminacion de deudores
- `/cargar` -> Alta de deudores
- `/editar` -> Pantalla placeholder

## API backend usada

Base URL:

`http://localhost:8089/api/v1/registro-redam`

Operaciones implementadas:

- `GET` con query params `dni`, `nombre`, `apellido`
- `POST` para alta
- `PUT /:id` para actualizacion
- `DELETE /:id` para eliminacion
