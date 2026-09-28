import React, { useState, useEffect, useMemo, useRef } from "react";
import * as api from "./api";

/* ===========================================================================
   FLORES E PRESENTES PAIXÃO — Catálogo público
   Navegação para o lado: um produto por vez, como folhear um álbum.
   =========================================================================== */

const ARQUIVOS = "https://qojpijbimbwdxuwjvypf.supabase.co/storage/v1/object/public/paixao/";
const LOGO = ARQUIVOS + "logo-circulo.jpg";   /* selo centralizado sobre o creme da marca */
/* Fotos da abertura: ABERTURA01 a ABERTURA07 no bucket.
   Tenta .jpg e, se não existir, .jpeg — sem precisar renomear nada.   */
const ABERTURAS = [1, 2, 3, 4, 5, 6, 7].map((n) => `${ARQUIVOS}ABERTURA0${n}`);

const C = {
  creme: "#FDF7F4", creme2: "#F7EDE8", branco: "#FFFFFF",
  vinho: "#8E1B2E", vinhoEsc: "#5E101F", rosa: "#C2415A", rosaClaro: "#E8A0AE",
  rosaSoft: "#FDEEF2", linha: "#EDE0DA",
  ink: "#3A2A2E", ink2: "#7A6A6E", ink3: "#A89A9D",
  ok: "#2F855A", zap: "#25D366",
};
const SERIF = `"Playfair Display", Georgia, serif`;
const FONT = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
const brl = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ------------------------ Preço, promoção e WhatsApp ---------------------- */
const soNumeros = (v) => String(v || "").replace(/\D/g, "");
const linkWhats = (tel, texto) => `https://wa.me/${soNumeros(tel)}?text=${encodeURIComponent(texto)}`;
const abrirWhats = (tel, texto) => window.open(linkWhats(tel, texto), "_blank");

/* Promoção só vale para produto de preço único: sem tamanhos e sem "sob consulta". */
const emPromocao = (p) =>
  !p.onRequest && !p.sizes.length && p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price;

/* Preço que vale hoje: a promoção manda quando existe. */
const precoVigente = (p, tam) => {
  if (p.sizes.length) return p.sizes.find((s) => s.name === tam)?.price ?? p.sizes[0].price;
  if (emPromocao(p)) return p.promoPrice;
  return p.price;
};

const CSS = `*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:${C.creme};color:${C.ink};font-family:${FONT};-webkit-font-smoothing:antialiased;overscroll-behavior-x:none}
input,select,textarea,button{font-family:inherit}
@keyframes flFade{from{opacity:0}to{opacity:1}}
@keyframes flSobe{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes flEntra{from{opacity:0;transform:translateX(38px) scale(.97)}to{opacity:1;transform:none}}
@keyframes flSelo{0%{opacity:0;transform:scale(.8)}60%{transform:scale(1.04)}100%{opacity:1;transform:none}}
@keyframes flPetala{0%{transform:translateY(-8%) rotate(0)}100%{transform:translateY(112vh) rotate(320deg)}}
@keyframes flGira{to{transform:rotate(360deg)}}
.fl-x::-webkit-scrollbar{height:0}
.fl-btn{transition:background .16s ease,color .16s ease,border-color .16s ease,transform .12s ease,box-shadow .2s}
.fl-btn:active:not(:disabled){transform:scale(.98)}
.fl-in{transition:border-color .16s ease,box-shadow .16s ease}
.fl-in:focus{outline:none;border-color:${C.vinho};box-shadow:0 0 0 3px rgba(142,27,46,.12)}
`;

const entradaEstilo = {
  width: "100%", padding: "12px 14px", fontSize: 15, borderRadius: 12,
  border: `1px solid ${C.linha}`, background: "#fff", color: C.ink, fontWeight: 500,
};

export default function Catalog() { return <Guarda><Vitrine /></Guarda>; }

class Guarda extends React.Component {
  constructor(p) { super(p); this.state = { caiu: false }; }
  static getDerivedStateFromError() { return { caiu: true }; }
  componentDidCatch(e) { try { console.error(e); }
