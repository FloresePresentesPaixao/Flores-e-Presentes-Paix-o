import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Catalog from "./Catalog.jsx";

/* /catalogo abre a vitrine pública. Qualquer outro endereço abre o app. */
const publico = window.location.pathname.toLowerCase().includes("catalogo");

createRoot(document.getElementById("root")).render(publico ? <Catalog /> : <App />);
