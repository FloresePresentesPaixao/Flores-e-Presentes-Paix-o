import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import * as api from "./api";

/* ===========================================================================
   FLORES E PRESENTES PAIXÃO — Gestão de pedidos, entregas, produtos e clientes
   =========================================================================== */

const T = {
  bg: "#FDF7F4", bg2: "#F7EDE8", card: "#FFFFFF",
  ink: "#3A2A2E", ink2: "#7A6A6E", ink3: "#A89A9D", line: "#EDE0DA",
  vinho: "#8E1B2E", vinhoHover: "#761525", vinhoSoft: "#FBEEF0",
  rosa: "#C2415A", rosaSoft: "#FDEEF2",
  ok: "#2F855A", okSoft: "#E9F6EF",
  warn: "#B7791F", warnSoft: "#FDF5E7",
  err: "#C53030", errSoft: "#FDECEC",
  zap: "#25D366",
};
const SERIF = `"Playfair Display", Georgia, serif`;
const FONT = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
const SOMBRA = "0 1px 2px rgba(58,42,46,.04), 0 2px 6px rgba(58,42,46,.04)";
const SOMBRA_ALTA = "0 12px 40px rgba(58,42,46,.16)";
const ARQUIVOS = "https://qojpijbimbwdxuwjvypf.supabase.co/storage/v1/object/public/paixao/";

const brl = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n) => (Number(n) || 0).toLocaleString("pt-BR");
const hojeISO = () => new Date().toISOString().slice(0, 10);
const amanhaISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const diaCurto = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—");
const dia = (d) => (d ? new Date(typeof d === "string" && d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—");
const diaHora = (d) => (d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");
const diaSemana = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" }) : "");
const JANELAS = ["Manhã (8h às 12h)", "Tarde (12h às 18h)", "Horário combinado"];

/* Promoção vale só para produto de preço único: sem tamanhos e sem "sob consulta".
   O preço de tabela nunca é apagado — tirar da promoção devolve o valor original. */
const temPromo = (p) => !p.onRequest && !p.sizes.length && p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price;
const precoAtual = (p) => (temPromo(p) ? p.promoPrice : p.sizes.length ? p.sizes[0].price : p.price);
const podePromo = (p) => !p.onRequest && !p.sizes.length && Number(p.price) > 0;
const PAGAMENTOS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "A combinar"];

/* --------------------------------- Ícones --------------------------------- */
const ICONES = {
  inicio: "M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1h4v-6h3v6h4a1 1 0 0 0 1-1V9.5",
  pedidos: "M15 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM15 3v5h5M9 13h6M9 17h4",
  produtos: "M12 21s-7-4.4-7-9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7 3.5C19 16.6 12 21 12 21z",
  clientes: "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1.5a4 4 0 0 0-3-3.85",
  relatorios: "M3 3v16a2 2 0 0 0 2 2h16M7.5 15.5v-3M12 15.5v-7M16.5 15.5v-5",
  ajustes: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19.4 14a1.5 1.5 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.5 1.5 0 0 0-2.5 1v.3a2 2 0 1 1-4 0V19a1.5 1.5 0 0 0-2.6-1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.5 1.5 0 0 0-1-2.5H4a2 2 0 1 1 0-4h.2a1.5 1.5 0 0 0 1-2.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.5 1.5 0 0 0 2.5-1V4a2 2 0 1 1 4 0v.2a1.5 1.5 0 0 0 2.5 1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.5 1.5 0 0 0 1 2.5h.2a2 2 0 1 1 0 4H20a1.5 1.5 0 0 0-1.4 1z",
  mais: "M12 5v14M5 12h14",
  busca: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3",
  voltar: "m15 18-6-6 6-6",
  avancar: "m9 18 6-6-6-6",
  fechar: "M18 6 6 18M6 6l12 12",
  check: "m20 6-11 11-5-5",
  lixo: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6",
  editar: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5-5 5 5M12 4v12",
  dinheiro: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  relogio: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
  alerta: "M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0",
  saida: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  moto: "M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8 15h8l-2.5-5H17l-2-4h-3M5 12l2-4h4",
  cartao: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M7 10h10M7 14h6",
  whats: "M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.5 8.5 0 1 1 21 11.5",
  local: "M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
  promocoes: "M19 5 5 19M7 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M17 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
  presente: "M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M3 8h18v4H3zM12 8v13M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5",
};
function Icone({ n, s = 18, cor = "currentColor", w = 1.75, style }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} aria-hidden="true">
      <path d={ICONES[n] || ICONES.pedidos} />
    </svg>
  );
}

const NAV = [
  { id: "inicio", label: "Hoje" },
  { id: "pedidos", label: "Pedidos" },
  { id: "produtos", label: "Produtos" },
  { id: "clientes", label: "Clientes" },
  { id: "promocoes", label: "Promoções" },
  { id: "relatorios", label: "Relatórios" },
  { id: "ajustes", label: "Ajustes" },
];

/* ------------------- Voltar do celular fecha a tela aberta ----------------- */
const pilha = [];
function useVoltar(ativo, aoFechar) {
  const ref = useRef(aoFechar);
  ref.current = aoFechar;
  useEffect(() => {
    if (!ativo) return;
    const fn = () => { if (ref.current) ref.current(); };
    pilha.push(fn);
    return () => { const i = pilha.lastIndexOf(fn); if (i >= 0) pilha.splice(i, 1); };
  }, [ativo]);
}

/* ---------------------------------- CSS ----------------------------------- */
const CSS = `*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:${T.bg};color:${T.ink};font-family:${FONT};-webkit-font-smoothing:antialiased}
input,select,textarea,button{font-family:inherit}
@keyframes pxFade{from{opacity:0}to{opacity:1}}
@keyframes pxUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pxSheet{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes pxGira{to{transform:rotate(360deg)}}
.px-up{animation:pxUp .24s cubic-bezier(.16,1,.3,1)}
.px-fade{animation:pxFade .2s ease both}
.px-scroll::-webkit-scrollbar{width:8px;height:8px}
.px-scroll::-webkit-scrollbar-thumb{background:#E2CFC8;border-radius:99px}
.px-x::-webkit-scrollbar{height:0}
.px-btn{transition:background .16s ease,border-color .16s ease,color .16s ease,transform .12s ease,box-shadow .18s ease}
.px-btn:active:not(:disabled){transform:scale(.985)}
.px-card{transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease}
.px-click:hover{border-color:#E0C9C2;box-shadow:0 6px 18px rgba(58,42,46,.07)}
.px-in{transition:border-color .16s ease,box-shadow .16s ease}
.px-in:focus{outline:none;border-color:${T.vinho};box-shadow:0 0 0 3px rgba(142,27,46,.12)}
.px-linha:hover{background:${T.bg2}}
.px-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.px-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:560px){.px-2col{grid-template-columns:1fr}.px-3col{grid-template-columns:1fr 1fr}}
`;

/* -------------------------------- UI base --------------------------------- */
const estiloEntrada = {
  width: "100%", padding: "11px 13px", fontSize: 14.5, borderRadius: 11,
  border: `1px solid ${T.line}`, background: "#fff", color: T.ink, fontWeight: 500,
};
function Entrada(p) { return <input {...p} className="px-in" style={{ ...estiloEntrada, ...p.style }} />; }
function Selecao(p) { return <select {...p} className="px-in" style={{ ...estiloEntrada, ...p.style }} />; }
function Area(p) { return <textarea {...p} className="px-in" style={{ ...estiloEntrada, minHeight: 84, resize: "vertical", ...p.style }} />; }

function Campo({ label, children, dica, obrigatorio }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>
        {label}{obrigatorio && <span style={{ color: T.err }}> *</span>}
      </span>
      {children}
      {dica && <span style={{ display: "block", fontSize: 12, color: T.ink3, marginTop: 5 }}>{dica}</span>}
    </label>
  );
}

function Botao({ children, onClick, tipo = "primario", icone, tamanho = "m", disabled, style, type }) {
  const tamanhos = { s: { padding: "7px 12px", fontSize: 13 }, m: { padding: "10px 16px", fontSize: 14 }, g: { padding: "13px 20px", fontSize: 15 } };
  const tipos = {
    primario: { background: T.vinho, color: "#fff", border: "1px solid transparent" },
    suave: { background: T.vinhoSoft, color: T.vinho, border: "1px solid transparent" },
    neutro: { background: "#fff", color: T.ink, border: `1px solid ${T.line}` },
    fantasma: { background: "transparent", color: T.ink2, border: "1px solid transparent" },
    zap: { background: T.zap, color: "#fff", border: "1px solid transparent" },
    perigo: { background: "#fff", color: T.err, border: "1px solid #F3C9C9" },
  };
  return (
    <button type={type || "button"} onClick={onClick} disabled={disabled} className="px-btn"
      onMouseEnter={(e) => { if (!disabled && tipo === "primario") e.currentTarget.style.background = T.vinhoHover; }}
      onMouseLeave={(e) => { if (!disabled && tipo === "primario") e.currentTarget.style.background = T.vinho; }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 11,
        fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap", ...tamanhos[tamanho], ...tipos[tipo], ...style,
      }}>
      {icone && <Icone n={icone} s={tamanho === "s" ? 15 : 17} />}
      {children}
    </button>
  );
}

function Cartao({ children, style, onClick }) {
  return (
    <div onClick={onClick} className={`px-card ${onClick ? "px-click" : ""}`}
      style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: SOMBRA, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function Selo({ children, cor = T.ink2, fundo = T.bg2, ponto }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: fundo, color: cor, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {ponto && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />}
      {children}
    </span>
  );
}

function Titulo({ children, sub, acao }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, margin: "4px 0 18px" }}>
      <div>
        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, letterSpacing: -0.2, margin: 0 }}>{children}</h2>
        {sub && <div style={{ fontSize: 13.5, color: T.ink2, marginTop: 3 }}>{sub}</div>}
      </div>
      {acao}
    </div>
  );
}

function Vazio({ children, icone = "produtos" }) {
  return (
    <div style={{ padding: "44px 20px", textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: T.vinhoSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icone n={icone} s={20} cor={T.rosa} />
      </div>
      <div style={{ fontSize: 14, color: T.ink2 }}>{children}</div>
    </div>
  );
}

function Carregando({ texto = "Carregando" }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: T.ink3, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${T.line}`, borderTopColor: T.vinho, animation: "pxGira .7s linear infinite" }} />
      {texto}…
    </div>
  );
}

function Modal({ aberto, aoFechar, titulo, sub, children, largo, rodape }) {
  useVoltar(!!aberto, aoFechar);
  if (!aberto) return null;
  /* Desenhada direto no corpo da página: assim ela se ancora na tela, e não no
     bloco que tem a animação de troca de aba (um transform ali fazia o rodapé
     com os botões cair para fora do visível no celular).                      */
  return createPortal(
    <div className="px-fade" onClick={aoFechar}
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(58,42,46,.45)", zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      {/* altura fixa: o miolo rola por dentro e os botões ficam sempre à vista */}
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: largo ? 760 : 520,
          height: "92dvh", maxHeight: "92dvh", display: "flex", flexDirection: "column",
          borderRadius: "22px 22px 0 0", boxShadow: SOMBRA_ALTA,
          animation: "pxSheet .26s cubic-bezier(.16,1,.3,1) both", overflow: "hidden",
        }}>
        <div style={{ flexShrink: 0, padding: "18px 20px 14px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 19, fontWeight: 600 }}>{titulo}</h3>
              {sub && <div style={{ fontSize: 13, color: T.ink2, marginTop: 3 }}>{sub}</div>}
            </div>
            <button onClick={aoFechar} aria-label="Fechar" className="px-btn"
              style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: T.bg2, color: T.ink2, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icone n="fechar" s={16} />
            </button>
          </div>
        </div>

        <div className="px-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", padding: "18px 20px 22px" }}>
          {children}
        </div>

        {rodape && (
          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.line}`, background: "#fff", padding: "14px 20px", paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))", display: "flex", gap: 10 }}>
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function Aviso({ msg }) {
  if (!msg) return null;
  const cores = { ok: [T.ok, T.okSoft], erro: [T.err, T.errSoft], info: [T.vinho, T.vinhoSoft], alerta: [T.warn, T.warnSoft] };
  const [cor, fundo] = cores[msg.tipo] || cores.info;
  return (
    <div className="px-up" style={{ position: "fixed", left: 12, right: 12, bottom: 84, zIndex: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ background: "#fff", borderLeft: `3px solid ${cor}`, color: T.ink, padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: SOMBRA_ALTA, maxWidth: 440, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: fundo, color: cor, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icone n={msg.tipo === "erro" ? "alerta" : "check"} s={13} />
        </span>
        {msg.texto}
      </div>
    </div>
  );
}

function Marca({ s = 36 }) {
  const [falhou, setFalhou] = useState(false);
  const base = { width: s, height: s, borderRadius: "50%", flexShrink: 0, objectFit: "cover", background: "#F5EEE3", border: `1px solid ${T.line}` };
  if (falhou) {
    return <div style={{ ...base, background: T.vinho, border: "none", display: "grid", placeItems: "center", color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: s * 0.42 }}>P</div>;
  }
  return <img src={ARQUIVOS + "logo-circulo.jpg"} alt="Paixão" onError={() => setFalhou(true)} style={base} />;
}

/* ============================== Aplicativo ================================ */
export default function App() {
  const [abrindo, setAbrindo] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("inicio");
  const [meta, setMeta] = useState({
    categories: [], occasions: [], zones: [], statuses: [], customers: [], users: [],
    settings: { storeName: "Flores e Presentes Paixão", whatsapp: "", instagram: "", address: "", hours: "", pixKey: "", pixName: "", pixType: "CNPJ", paymentNote: "", cardNote: "" },
  });
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [msg, setMsg] = useState(null);
  const [largo, setLargo] = useState(typeof window !== "undefined" && window.innerWidth >= 1000);

  const avisar = useCallback((texto, tipo = "ok") => {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 3400);
  }, []);

  useEffect(() => {
    const r = () => setLargo(window.innerWidth >= 1000);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const recarregar = useCallback(async () => {
    try {
      const [m, p, ped] = await Promise.all([api.loadMeta(), api.loadProducts(), api.loadOrders({})]);
      setMeta(m); setProdutos(p); setPedidos(ped);
    } catch (e) { avisar(e.message, "erro"); }
  }, [avisar]);

  const recarregarPedidos = useCallback(async () => {
    try { setPedidos(await api.loadOrders({})); } catch (e) { avisar(e.message, "erro"); }
  }, [avisar]);

  const recarregarMeta = useCallback(async () => {
    try { setMeta(await api.loadMeta()); } catch (e) { avisar(e.message, "erro"); }
  }, [avisar]);

  useEffect(() => {
    let vivo = true;
    const entrar = async (sessao) => {
      if (!sessao) { if (vivo) { setUser(null); setAbrindo(false); } return; }
      const perfil = await api.getProfile();
      if (!vivo) return;
      setUser(perfil);
      await recarregar();
      setAbrindo(false);
    };
    api.supabase.auth.getSession().then(({ data }) => entrar(data.session));
    const { data: sub } = api.onAuthChange((s) => entrar(s));
    return () => { vivo = false; sub?.subscription?.unsubscribe?.(); };
  }, [recarregar]);

  const tabRef = useRef(tab); tabRef.current = tab;
  const sairArmado = useRef(false);
  useEffect(() => {
    const trava = () => window.history.pushState({ px: true }, "");
    trava();
    const aoVoltar = () => {
      const fn = pilha[pilha.length - 1];
      if (fn) { pilha.pop(); fn(); trava(); return; }
      if (tabRef.current !== "inicio") { setTab("inicio"); trava(); return; }
      if (sairArmado.current) { window.removeEventListener("popstate", aoVoltar); window.history.back(); return; }
      sairArmado.current = true;
      avisar("Toque em voltar de novo para sair.", "info");
      setTimeout(() => { sairArmado.current = false; }, 2500);
      trava();
    };
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, [avisar]);

  if (abrindo) {
    return (
      <div style={{ fontFamily: FONT, background: T.bg, height: "100vh", display: "grid", placeItems: "center" }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center" }}>
          <Marca s={48} />
          <div style={{ color: T.ink3, marginTop: 14, fontSize: 13.5 }}>Carregando…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Login avisar={avisar} />;

  const ctx = {
    user, meta, produtos, pedidos, largo, avisar,
    recarregar, recarregarPedidos, recarregarMeta, setTab,
    categoria: (id) => meta.categories.find((c) => c.id === id),
    status: (id) => meta.statuses.find((s) => s.id === id),
    zona: (id) => meta.zones.find((z) => z.id === id),
  };

  const telas = {
    inicio: <Hoje ctx={ctx} />, pedidos: <Pedidos ctx={ctx} />, produtos: <Produtos ctx={ctx} />,
    clientes: <Clientes ctx={ctx} />, promocoes: <Promocoes ctx={ctx} />,
    relatorios: <Relatorios ctx={ctx} />, ajustes: <Ajustes ctx={ctx} />,
  };

  return (
    <div style={{ fontFamily: FONT, background: T.bg, minHeight: "100vh", display: "flex" }}>
      <style>{CSS}</style>
      {largo && <Lateral tab={tab} setTab={setTab} meta={meta} user={user} />}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {!largo && <TopoMobile tab={tab} setTab={setTab} meta={meta} />}
        <main className="px-scroll" style={{ flex: 1, padding: largo ? "26px 30px 40px" : "16px 14px 92px", maxWidth: 1180, width: "100%", margin: "0 auto" }}>
          <div key={tab} className="px-up">{telas[tab]}</div>
        </main>
      </div>
      {!largo && <BarraMobile tab={tab} setTab={setTab} />}
      <Aviso msg={msg} />
    </div>
  );
}

/* ------------------------------- Navegação -------------------------------- */
function Lateral({ tab, setTab, meta, user }) {
  return (
    <aside style={{ width: 232, flexShrink: 0, background: "#fff", borderRight: `1px solid ${T.line}`, height: "100vh", position: "sticky", top: 0, display: "flex", flexDirection: "column", padding: "18px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 18px" }}>
        <Marca s={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 15.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Paixão</div>
          <div style={{ fontSize: 11.5, color: T.ink3 }}>Flores e Presentes</div>
        </div>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const on = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} className="px-btn"
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 14, fontWeight: on ? 600 : 500, background: on ? T.vinhoSoft : "transparent", color: on ? T.vinho : T.ink2, textAlign: "left" }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = T.bg2; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <Icone n={n.id} s={18} />{n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.rosaSoft, color: T.rosa, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>
          {(user.name || "U").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ fontSize: 11.5, color: T.ink3 }}>{user.role === "admin" ? "Administrador" : "Atendente"}</div>
        </div>
        <button onClick={() => api.signOut()} aria-label="Sair" className="px-btn"
          style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", color: T.ink3, cursor: "pointer", display: "grid", placeItems: "center" }}>
          <Icone n="saida" s={16} />
        </button>
      </div>
    </aside>
  );
}

function TopoMobile({ tab, setTab, meta }) {
  const atual = NAV.find((n) => n.id === tab);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.line}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 11 }}>
      {tab !== "inicio" ? (
        <button onClick={() => setTab("inicio")} aria-label="Voltar" className="px-btn"
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.line}`, background: "#fff", color: T.ink, cursor: "pointer", display: "grid", placeItems: "center" }}>
          <Icone n="voltar" s={17} />
        </button>
      ) : <Marca s={34} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tab === "inicio" ? "Paixão" : atual?.label}
        </div>
      </div>
      <button onClick={() => api.signOut()} aria-label="Sair" className="px-btn"
        style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.line}`, background: "#fff", color: T.ink2, cursor: "pointer", display: "grid", placeItems: "center" }}>
        <Icone n="saida" s={16} />
      </button>
    </header>
  );
}

function BarraMobile({ tab, setTab }) {
  const [mais, setMais] = useState(false);
  useVoltar(mais, () => setMais(false));
  const principais = NAV.slice(0, 4);
  const extras = NAV.slice(4);
  const item = (id, label, ativo, onClick) => (
    <button key={id} onClick={onClick} className="px-btn"
      style={{ flex: 1, background: "none", border: "none", padding: "8px 2px 6px", cursor: "pointer", color: ativo ? T.vinho : T.ink3, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <Icone n={id} s={19} w={ativo ? 2 : 1.7} />
      <span style={{ fontSize: 10.5, fontWeight: ativo ? 600 : 500 }}>{label}</span>
    </button>
  );
  return (
    <>
      <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, background: "rgba(255,255,255,.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${T.line}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        {principais.map((n) => item(n.id, n.label, tab === n.id, () => setTab(n.id)))}
        {item("ajustes", "Mais", extras.some((e) => e.id === tab), () => setMais(true))}
      </nav>
      {mais && (
        <div className="px-fade" onClick={() => setMais(false)} style={{ position: "fixed", inset: 0, background: "rgba(58,42,46,.45)", zIndex: 70, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", borderRadius: "22px 22px 0 0", padding: "20px 16px 28px", boxShadow: SOMBRA_ALTA, animation: "pxSheet .26s cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Mais</div>
            {extras.map((n) => (
              <button key={n.id} onClick={() => { setTab(n.id); setMais(false); }} className="px-btn"
                style={{ width: "100%", textAlign: "left", background: "#fff", border: `1px solid ${T.line}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, fontSize: 14.5, fontWeight: 600, color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: T.bg2, display: "grid", placeItems: "center", color: T.ink2 }}>
                  <Icone n={n.id} s={17} />
                </span>
                {n.label}
                <span style={{ marginLeft: "auto", color: T.ink3 }}><Icone n="avancar" s={16} /></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* --------------------------------- Entrar --------------------------------- */
function Login({ avisar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [indo, setIndo] = useState(false);
  const entrar = async () => {
    if (!email || !senha) return avisar("Preencha e-mail e senha.", "erro");
    setIndo(true);
    try { await api.signIn(email.trim(), senha); }
    catch (e) { avisar(e.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : e.message, "erro"); }
    finally { setIndo(false); }
  };
  return (
    <div style={{ fontFamily: FONT, background: T.bg, minHeight: "100vh", display: "grid", placeItems: "center", padding: 22 }}>
      <style>{CSS}</style>
      <div className="px-up" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ display: "inline-flex", marginBottom: 14 }}><Marca s={72} /></div>
          <h1 style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 600, margin: "0 0 5px" }}>Flores e Presentes Paixão</h1>
          <div style={{ fontSize: 14, color: T.ink2 }}>Pedidos, entregas e clientes</div>
        </div>
        <Cartao style={{ padding: 22 }}>
          <Campo label="E-mail"><Entrada type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></Campo>
          <Campo label="Senha"><Entrada type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} placeholder="••••••••" /></Campo>
          <Botao onClick={entrar} disabled={indo} tamanho="g" style={{ width: "100%", marginTop: 4 }}>{indo ? "Entrando…" : "Entrar"}</Botao>
        </Cartao>
        <div style={{ textAlign: "center", fontSize: 12.5, color: T.ink3, marginTop: 18 }}>Esqueceu a senha? Fale com o administrador.</div>
      </div>
    </div>
  );
}

/* ---------------------------------- Hoje ---------------------------------- */
function Hoje({ ctx }) {
  const { pedidos, meta, user, setTab, largo } = ctx;
  const hoje = hojeISO(), amanha = amanhaISO();

  const ativos = useMemo(() => pedidos.filter((p) => !p.canceled && !p.statusFinal), [pedidos]);
  const deHoje = useMemo(() => ativos.filter((p) => p.deliveryDate === hoje)
    .sort((a, b) => (a.deliveryWindow || "").localeCompare(b.deliveryWindow || "")), [ativos, hoje]);
  const deAmanha = useMemo(() => ativos.filter((p) => p.deliveryDate === amanha), [ativos, amanha]);
  const atrasados = useMemo(() => ativos.filter((p) => p.deliveryDate && p.deliveryDate < hoje), [ativos, hoje]);

  const mes = useMemo(() => {
    const ini = new Date(); ini.setDate(1); ini.setHours(0, 0, 0, 0);
    const doMes = pedidos.filter((p) => !p.canceled && new Date(p.createdAt) >= ini);
    return { qtd: doMes.length, fat: doMes.reduce((a, p) => a + p.total, 0) };
  }, [pedidos]);

  const aReceber = useMemo(() => pedidos.filter((p) => !p.canceled && !p.paid).reduce((a, p) => a + p.total, 0), [pedidos]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: T.ink2, textTransform: "capitalize" }}>{diaSemana(hoje)}, {dia(hoje)}</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 600, margin: "3px 0 0", lineHeight: 1.15 }}>
          Seja bem-vinda, {meta.settings.storeName || "Flores e Presentes Paixão"}
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: largo ? "repeat(4,1fr)" : "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
        <Indicador rotulo="Entregas hoje" valor={deHoje.length} nota={atrasados.length ? `${atrasados.length} em atraso` : "tudo em dia"} icone="moto" cor={T.vinho} fundo={T.vinhoSoft} />
        <Indicador rotulo="Para amanhã" valor={deAmanha.length} nota="já programadas" icone="relogio" cor={T.rosa} fundo={T.rosaSoft} />
        <Indicador rotulo="Vendas do mês" valor={brl(mes.fat)} nota={`${mes.qtd} pedidos`} icone="dinheiro" cor={T.ok} fundo={T.okSoft} />
        <Indicador rotulo="A receber" valor={brl(aReceber)} nota="pedidos não pagos" icone="cartao" cor={T.warn} fundo={T.warnSoft} />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <Botao icone="mais" onClick={() => setTab("pedidos")}>Novo pedido</Botao>
        <Botao tipo="neutro" icone="produtos" onClick={() => setTab("produtos")}>Produtos</Botao>
      </div>

      {atrasados.length > 0 && (
        <>
          <Titulo sub="Passaram da data e ainda não foram entregues">Atenção</Titulo>
          <Cartao style={{ padding: 6, marginBottom: 20, borderColor: "#F3C9C9" }}>
            {atrasados.map((p) => <LinhaEntrega key={p.id} p={p} ctx={ctx} atrasado />)}
          </Cartao>
        </>
      )}

      <Titulo sub={deHoje.length ? `${deHoje.length} entrega(s) programada(s)` : "Nenhuma entrega para hoje"}>Agenda de hoje</Titulo>
      <Cartao style={{ padding: 6, marginBottom: 20 }}>
        {deHoje.length === 0 && <Vazio icone="moto">Nada para entregar hoje.</Vazio>}
        {deHoje.map((p) => <LinhaEntrega key={p.id} p={p} ctx={ctx} />)}
      </Cartao>

      {deAmanha.length > 0 && (
        <>
          <Titulo sub="Para você já ir preparando">Amanhã</Titulo>
          <Cartao style={{ padding: 6 }}>
            {deAmanha.map((p) => <LinhaEntrega key={p.id} p={p} ctx={ctx} />)}
          </Cartao>
        </>
      )}
    </div>
  );
}

function LinhaEntrega({ p, ctx, atrasado }) {
  const { setTab } = ctx;
  return (
    <div onClick={() => setTab("pedidos")} className="px-linha"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", borderRadius: 12, cursor: "pointer" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: atrasado ? T.errSoft : T.bg2, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icone n={p.deliveryType === "retirada" ? "presente" : "moto"} s={18} cor={atrasado ? T.err : T.ink2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{p.recipientName || p.buyerName || "Sem nome"}</span>
          {p.urgent && <Selo cor={T.err} fundo={T.errSoft}>Urgente</Selo>}
          <Selo cor={p.statusColor} fundo={T.bg2} ponto>{p.statusName}</Selo>
        </div>
        <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 3 }}>
          {p.deliveryType === "retirada" ? "Retirada na loja" : `${p.neighborhood || "sem bairro"}${p.street ? ` · ${p.street}, ${p.numberAddr}` : ""}`}
        </div>
        <div style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>
          #{p.number} · {p.deliveryWindow || "horário a combinar"}{atrasado ? ` · era para ${diaCurto(p.deliveryDate)}` : ""}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{brl(p.total)}</div>
        {!p.paid && <div style={{ fontSize: 11.5, color: T.warn, fontWeight: 600 }}>a receber</div>}
      </div>
    </div>
  );
}

function Indicador({ rotulo, valor, nota, icone, cor, fundo }) {
  return (
    <Cartao style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 10, background: fundo, color: cor, display: "grid", placeItems: "center" }}>
          <Icone n={icone} s={16} />
        </span>
        <span style={{ fontSize: 12.5, color: T.ink2, fontWeight: 500 }}>{rotulo}</span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, lineHeight: 1.1 }}>{valor}</div>
      <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 4 }}>{nota}</div>
    </Cartao>
  );
}

/* --------------------------------- Pedidos -------------------------------- */
function Pedidos({ ctx }) {
  const { pedidos, meta, largo, recarregarPedidos, avisar } = ctx;
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("abertos");
  const [form, setForm] = useState(null);
  const [ficha, setFicha] = useState(null);

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase();
    const hoje = hojeISO();
    return pedidos.filter((p) => {
      if (filtro === "abertos" && (p.canceled || p.statusFinal)) return false;
      if (filtro === "hoje" && p.deliveryDate !== hoje) return false;
      if (filtro === "atrasados" && !(p.deliveryDate && p.deliveryDate < hoje && !p.statusFinal && !p.canceled)) return false;
      if (filtro === "receber" && (p.paid || p.canceled)) return false;
      if (!["abertos", "hoje", "atrasados", "receber", "todos"].includes(filtro) && p.statusId !== filtro) return false;
      if (!b) return true;
      return String(p.number).includes(b) || p.buyerName.toLowerCase().includes(b)
        || p.recipientName.toLowerCase().includes(b) || (p.buyerPhone || "").includes(b);
    });
  }, [pedidos, busca, filtro]);

  const chips = [
    { id: "abertos", nome: "Em aberto" }, { id: "hoje", nome: "Entrega hoje" },
    { id: "atrasados", nome: "Atrasados" }, { id: "receber", nome: "A receber" },
    ...meta.statuses.map((s) => ({ id: s.id, nome: s.name })), { id: "todos", nome: "Todos" },
  ];

  return (
    <div>
      <Titulo sub={`${lista.length} de ${pedidos.length} pedidos`}
        acao={<Botao icone="mais" onClick={() => setForm({ novo: true })}>Novo pedido</Botao>}>
        Pedidos
      </Titulo>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.ink3 }}><Icone n="busca" s={16} /></span>
        <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por número, quem compra, quem recebe ou telefone" style={{ paddingLeft: 36 }} />
      </div>

      <div className="px-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12 }}>
        {chips.map((c) => {
          const on = filtro === c.id;
          return (
            <button key={c.id} onClick={() => setFiltro(c.id)} className="px-btn"
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer", border: `1px solid ${on ? "transparent" : T.line}`, background: on ? T.ink : "#fff", color: on ? "#fff" : T.ink2 }}>
              {c.nome}
            </button>
          );
        })}
      </div>

      {lista.length === 0 && <Cartao><Vazio icone="pedidos">Nenhum pedido neste filtro.</Vazio></Cartao>}

      <div style={{ display: "grid", gap: 10 }}>
        {lista.map((p) => {
          const atrasado = p.deliveryDate && p.deliveryDate < hojeISO() && !p.statusFinal && !p.canceled;
          return (
            <Cartao key={p.id} onClick={() => setFicha(p)} style={{ padding: 14, opacity: p.canceled ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: T.bg2, display: "grid", placeItems: "center", flexShrink: 0, textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.ink2, lineHeight: 1 }}>#{p.number}</div>
                    {p.deliveryDate && <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 2 }}>{diaCurto(p.deliveryDate)}</div>}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{p.recipientName || p.buyerName || "Sem nome"}</span>
                    {p.canceled ? <Selo cor={T.err} fundo={T.errSoft}>Cancelado</Selo>
                      : <Selo cor={p.statusColor} fundo={T.bg2} ponto>{p.statusName || "Sem etapa"}</Selo>}
                    {atrasado && <Selo cor={T.err} fundo={T.errSoft}>Atrasado</Selo>}
                    {p.urgent && <Selo cor={T.warn} fundo={T.warnSoft}>Urgente</Selo>}
                    {p.paid ? <Selo cor={T.ok} fundo={T.okSoft}>Pago</Selo> : null}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.items.map((i) => `${num(i.quantity)}x ${i.description}`).join(" · ") || "Sem itens"}
                  </div>
                  <div style={{ fontSize: 12, color: T.ink3, marginTop: 3 }}>
                    {p.deliveryType === "retirada" ? "Retirada na loja" : (p.neighborhood || "sem bairro")}
                    {p.deliveryWindow ? ` · ${p.deliveryWindow}` : ""}
                    {p.buyerName && p.recipientName && p.buyerName !== p.recipientName ? ` · de ${p.buyerName}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{brl(p.total)}</div>
                  {!p.paid && !p.canceled && <div style={{ fontSize: 11.5, color: T.warn, fontWeight: 600 }}>a receber</div>}
                </div>
                {largo && <span style={{ color: T.ink3 }}><Icone n="avancar" s={18} /></span>}
              </div>
            </Cartao>
          );
        })}
      </div>

      {form && (
        <FormPedido ctx={ctx} inicial={form.novo ? null : form} aoFechar={() => setForm(null)}
          aoSalvar={async () => { setForm(null); await recarregarPedidos(); avisar("Pedido salvo."); }} />
      )}
      {ficha && (
        <FichaPedido ctx={ctx} pedido={pedidos.find((x) => x.id === ficha.id) || ficha}
          aoFechar={() => setFicha(null)} aoEditar={() => { setForm(ficha); setFicha(null); }} />
      )}
    </div>
  );
}

/* --------------------------- Cadastro do pedido --------------------------- */
function FormPedido({ ctx, inicial, aoFechar, aoSalvar }) {
  const { meta, produtos, user, avisar, recarregarMeta } = ctx;
  const [f, setF] = useState(() => inicial ? { ...inicial, items: inicial.items.map((i) => ({ ...i })) } : {
    statusId: meta.statuses[0]?.id || "", customerId: "", buyerName: "", buyerPhone: "",
    recipientName: "", recipientPhone: "", deliveryType: "entrega",
    street: "", numberAddr: "", complement: "", zoneId: "", neighborhood: "", city: "Uberlândia", reference: "",
    deliveryDate: hojeISO(), deliveryWindow: JANELAS[0], urgent: false,
    cardMessage: "", cardFrom: "", cardTo: "", items: [],
    deliveryFee: 0, discount: 0, paymentMethod: "", paid: false, notes: "",
  });
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const itensTotal = f.items.reduce((a, i) => a + (Number(i.total) || 0), 0);
  const total = itensTotal + (Number(f.deliveryFee) || 0) - (Number(f.discount) || 0);

  /* ao escolher o bairro, traz a taxa dele */
  const escolherZona = (id) => {
    const z = meta.zones.find((x) => x.id === id);
    setF((x) => ({ ...x, zoneId: id, neighborhood: z?.name || "", deliveryFee: z ? z.fee : x.deliveryFee }));
  };

  /* ao escolher o cliente, preenche quem compra */
  const escolherCliente = (id) => {
    const c = meta.customers.find((x) => x.id === id);
    setF((x) => ({ ...x, customerId: id, buyerName: c?.name || x.buyerName, buyerPhone: c?.phone || x.buyerPhone }));
  };

  const addItem = (produtoId) => {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p) return;
    /* promoção ativa manda no preço; "sob consulta" entra com o valor de
       referência, quando houver, para ela só ajustar.                        */
    const preco = p.onRequest ? (Number(p.price) || 0) : precoAtual(p);
    setF((x) => ({
      ...x,
      items: [...x.items, {
        productId: p.id, description: p.name, sizeName: p.sizes.length ? p.sizes[0].name : "",
        quantity: 1, unitPrice: preco, total: preco,
      }],
    }));
  };

  const mudaItem = (k, campo, valor) => {
    setF((x) => ({
      ...x,
      items: x.items.map((i, idx) => {
        if (idx !== k) return i;
        const novo = { ...i, [campo]: valor };
        if (campo === "sizeName") {
          const prod = produtos.find((p) => p.id === novo.productId);
          const tam = prod?.sizes.find((s) => s.name === valor);
          if (tam) novo.unitPrice = tam.price;
        }
        novo.total = (Number(novo.quantity) || 0) * (Number(novo.unitPrice) || 0);
        return novo;
      }),
    }));
  };

  const salvar = async () => {
    if (!f.buyerName.trim()) return avisar("Informe quem está comprando.", "erro");
    if (f.items.length === 0) return avisar("Adicione pelo menos um item.", "erro");
    if (f.deliveryType === "entrega" && !f.street.trim()) {
      if (!window.confirm("O endereço de entrega está vazio. Salvar assim mesmo?")) return;
    }
    setSalvando(true);
    try {
      /* cliente novo entra no cadastro sozinho */
      let customerId = f.customerId;
      if (!customerId && f.buyerName.trim() && f.buyerPhone.trim()) {
        const existe = meta.customers.find((c) => (c.phone || "").replace(/\D/g, "") === f.buyerPhone.replace(/\D/g, ""));
        if (existe) customerId = existe.id;
        else { const novo = await api.addCustomer({ name: f.buyerName.trim(), phone: f.buyerPhone.trim() }); customerId = novo.id; }
      }
      await api.saveOrder({ ...f, customerId }, user.name);
      await recarregarMeta();
      aoSalvar();
    } catch (e) { avisar(e.message, "erro"); }
    finally { setSalvando(false); }
  };

  return (
    <Modal aberto aoFechar={aoFechar} largo titulo={f.id ? `Editar pedido #${inicial.number}` : "Novo pedido"}
      sub="Quem compra, quem recebe, entrega e o cartão"
      rodape={<>
        <Botao tipo="neutro" onClick={aoFechar} style={{ flex: 1 }}>Cancelar</Botao>
        <Botao onClick={salvar} disabled={salvando} icone="check" style={{ flex: 2 }}>{salvando ? "Salvando…" : "Salvar pedido"}</Botao>
      </>}>

      <Secao n="1" titulo="Quem está comprando" />
      <Campo label="Cliente já cadastrado">
        <Selecao value={f.customerId} onChange={(e) => escolherCliente(e.target.value)}>
          <option value="">— novo cliente —</option>
          {meta.customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
        </Selecao>
      </Campo>
      <div className="px-2col">
        <Campo label="Nome" obrigatorio><Entrada value={f.buyerName} onChange={(e) => set("buyerName", e.target.value)} placeholder="Quem está pagando" /></Campo>
        <Campo label="WhatsApp"><Entrada value={f.buyerPhone} onChange={(e) => set("buyerPhone", e.target.value)} placeholder="(34) 90000-0000" /></Campo>
      </div>

      <Secao n="2" titulo="Itens do pedido" />
      <Cartao style={{ padding: 6, marginBottom: 12, boxShadow: "none" }}>
        {f.items.length === 0 && <Vazio icone="produtos">Nenhum item ainda.</Vazio>}
        {f.items.map((i, k) => {
          const prod = produtos.find((p) => p.id === i.productId);
          return (
            <div key={k} style={{ padding: 12, borderBottom: k < f.items.length - 1 ? `1px solid ${T.line}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{i.description}</div>
                <button onClick={() => setF((x) => ({ ...x, items: x.items.filter((_, idx) => idx !== k) }))} className="px-btn" aria-label="Remover"
                  style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: T.errSoft, color: T.err, cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icone n="lixo" s={14} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: prod?.sizes.length ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
                {prod?.sizes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11.5, color: T.ink3, marginBottom: 4 }}>Tamanho</div>
                    <Selecao value={i.sizeName} onChange={(e) => mudaItem(k, "sizeName", e.target.value)} style={{ padding: "8px 10px" }}>
                      {prod.sizes.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </Selecao>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11.5, color: T.ink3, marginBottom: 4 }}>Qtd</div>
                  <Entrada type="number" min="1" value={i.quantity} onChange={(e) => mudaItem(k, "quantity", e.target.value)} style={{ padding: "8px 10px" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: T.ink3, marginBottom: 4 }}>Preço</div>
                  <Entrada type="number" step="0.01" value={i.unitPrice} onChange={(e) => mudaItem(k, "unitPrice", e.target.value)} style={{ padding: "8px 10px" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: T.ink3, marginBottom: 4 }}>Total</div>
                  <div style={{ padding: "9px 4px", fontSize: 14.5, fontWeight: 700 }}>{brl(i.total)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </Cartao>
      <Campo label="Adicionar produto">
        <Selecao value="" onChange={(e) => { addItem(e.target.value); e.target.value = ""; }}>
          <option value="">— escolha —</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.onRequest ? (Number(p.price) > 0 ? `consultar (a partir de ${brl(p.price)})` : "consultar") : brl(precoAtual(p))}{temPromo(p) ? " • promoção" : ""}
            </option>
          ))}
        </Selecao>
      </Campo>

      <Secao n="3" titulo="Entrega" />
      <div style={{ display: "flex", gap: 9, marginBottom: 14 }}>
        {[["entrega", "Entregar", "moto"], ["retirada", "Retirar na loja", "presente"]].map(([v, l, ic]) => {
          const on = f.deliveryType === v;
          return (
            <button key={v} onClick={() => set("deliveryType", v)} className="px-btn"
              style={{ flex: 1, padding: "11px", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${on ? "transparent" : T.line}`, background: on ? T.vinhoSoft : "#fff", color: on ? T.vinho : T.ink2 }}>
              <Icone n={ic} s={16} />{l}
            </button>
          );
        })}
      </div>

      <div className="px-2col">
        <Campo label="Nome de quem recebe"><Entrada value={f.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="Deixe vazio se for o próprio cliente" /></Campo>
        <Campo label="Telefone de quem recebe"><Entrada value={f.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} /></Campo>
      </div>

      {f.deliveryType === "entrega" && (
        <>
          <Campo label="Bairro" dica="A taxa vem preenchida, mas pode ser alterada abaixo.">
            <Selecao value={f.zoneId} onChange={(e) => escolherZona(e.target.value)}>
              <option value="">— escolha o bairro —</option>
              {meta.zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {brl(z.fee)}</option>)}
            </Selecao>
          </Campo>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Campo label="Rua"><Entrada value={f.street} onChange={(e) => set("street", e.target.value)} /></Campo>
            <Campo label="Número"><Entrada value={f.numberAddr} onChange={(e) => set("numberAddr", e.target.value)} /></Campo>
          </div>
          <div className="px-2col">
            <Campo label="Complemento"><Entrada value={f.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Apto, bloco, casa" /></Campo>
            <Campo label="Ponto de referência"><Entrada value={f.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Perto da padaria…" /></Campo>
          </div>
        </>
      )}

      <div className="px-2col">
        <Campo label="Data"><Entrada type="date" value={f.deliveryDate || ""} onChange={(e) => set("deliveryDate", e.target.value)} /></Campo>
        <Campo label="Horário">
          <Selecao value={f.deliveryWindow} onChange={(e) => set("deliveryWindow", e.target.value)}>
            {JANELAS.map((j) => <option key={j}>{j}</option>)}
          </Selecao>
        </Campo>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={f.urgent} onChange={(e) => set("urgent", e.target.checked)} style={{ width: 17, height: 17, accentColor: T.vinho }} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Pedido urgente</span>
      </label>

      <Secao n="4" titulo="Cartão que vai junto" />
      <Campo label="Mensagem" dica={meta.settings.cardNote}>
        <Area value={f.cardMessage} onChange={(e) => set("cardMessage", e.target.value)} placeholder="Ex.: Parabéns! Que seu dia seja tão lindo quanto você." />
      </Campo>
      <div className="px-2col">
        <Campo label="Para"><Entrada value={f.cardTo} onChange={(e) => set("cardTo", e.target.value)} placeholder="Nome de quem recebe" /></Campo>
        <Campo label="De"><Entrada value={f.cardFrom} onChange={(e) => set("cardFrom", e.target.value)} placeholder="Nome de quem envia" /></Campo>
      </div>

      <Secao n="5" titulo="Valores e pagamento" />
      <Cartao style={{ padding: 14, marginBottom: 14, background: T.bg2, border: "none", boxShadow: "none" }}>
        <Linha rotulo="Itens" valor={brl(itensTotal)} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
          <span style={{ flex: 1, fontSize: 13.5, color: T.ink2 }}>Taxa de entrega</span>
          <Entrada type="number" step="0.01" value={f.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} style={{ width: 120, padding: "7px 10px", textAlign: "right" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
          <span style={{ flex: 1, fontSize: 13.5, color: T.ink2 }}>Desconto</span>
          <Entrada type="number" step="0.01" value={f.discount} onChange={(e) => set("discount", e.target.value)} style={{ width: 120, padding: "7px 10px", textAlign: "right" }} />
        </div>
        <Linha rotulo="Total" valor={brl(total)} forte />
      </Cartao>

      <div className="px-2col">
        <Campo label="Forma de pagamento">
          <Selecao value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
            <option value="">— escolha —</option>
            {PAGAMENTOS.map((m) => <option key={m}>{m}</option>)}
          </Selecao>
        </Campo>
        <Campo label="Situação">
          <Selecao value={f.paid ? "1" : "0"} onChange={(e) => set("paid", e.target.value === "1")}>
            <option value="0">A receber</option>
            <option value="1">Já pago</option>
          </Selecao>
        </Campo>
      </div>

      <Campo label="Observações"><Area value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Cor preferida, não tocar a campainha, avisar antes…" /></Campo>
    </Modal>
  );
}

function Secao({ n, titulo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "8px 0 12px" }}>
      <span style={{ width: 22, height: 22, borderRadius: 7, background: T.vinho, color: "#fff", fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center" }}>{n}</span>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{titulo}</span>
      <span style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  );
}

function Linha({ rotulo, valor, forte }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: forte ? 14.5 : 13.5, color: forte ? T.ink : T.ink2, fontWeight: forte ? 600 : 500 }}>{rotulo}</span>
      <span style={{ fontFamily: forte ? SERIF : FONT, fontSize: forte ? 20 : 14, fontWeight: forte ? 600 : 600 }}>{valor}</span>
    </div>
  );
}

/* ----------------------------- Ficha do pedido ---------------------------- */
function FichaPedido({ ctx, pedido, aoFechar, aoEditar }) {
  const { meta, user, avisar, recarregarPedidos } = ctx;
  const [historico, setHistorico] = useState([]);
  const [atualiza, setAtualiza] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.loadOrderHistory(pedido.id).then((h) => { if (vivo) setHistorico(h); }).catch(() => {});
    return () => { vivo = false; };
  }, [pedido.id, atualiza]);

  const mudarEtapa = async (statusId) => {
    const s = meta.statuses.find((x) => x.id === statusId);
    try {
      await api.setOrderStatus(pedido.id, statusId, s?.name, user.name);
      await recarregarPedidos(); setAtualiza((v) => !v);
      avisar(`Pedido movido para ${s?.name}.`);
    } catch (e) { avisar(e.message, "erro"); }
  };

  const marcarPago = async () => {
    try {
      await api.setOrderPaid(pedido.id, true, pedido.paymentMethod, user.name);
      await recarregarPedidos(); setAtualiza((v) => !v);
      avisar("Pagamento registrado.");
    } catch (e) { avisar(e.message, "erro"); }
  };

  const cancelar = async () => {
    if (!window.confirm(`Cancelar o pedido #${pedido.number}?`)) return;
    try { await api.cancelOrder(pedido.id, user.name); await recarregarPedidos(); aoFechar(); avisar("Pedido cancelado."); }
    catch (e) { avisar(e.message, "erro"); }
  };

  const tel = (t) => { const n = String(t || "").replace(/\D/g, ""); return n ? (n.length <= 11 ? "55" + n : n) : ""; };

  const avisarCliente = () => {
    const texto = `Olá, ${pedido.buyerName}! 🌷\nAqui é da ${meta.settings.storeName}.\n\nSeu pedido *#${pedido.number}* está *${pedido.statusName}*.\n` +
      (pedido.deliveryType === "entrega"
        ? `Entrega em ${dia(pedido.deliveryDate)}, ${pedido.deliveryWindow}.\n`
        : `Pode retirar na loja em ${dia(pedido.deliveryDate)}.\n`) +
      `\n*Total:* ${brl(pedido.total)}${pedido.paid ? " (pago)" : ""}`;
    window.open(`https://wa.me/${tel(pedido.buyerPhone)}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const rotaEntrega = () => {
    const endereco = `${pedido.street}, ${pedido.numberAddr} - ${pedido.neighborhood}, ${pedido.city}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, "_blank");
  };

  return (
    <Modal aberto aoFechar={aoFechar} largo titulo={`Pedido #${pedido.number}`}
      sub={`${pedido.buyerName} · ${dia(pedido.createdAt)}`}
      rodape={<>
        {pedido.buyerPhone && <Botao tipo="zap" icone="whats" onClick={avisarCliente} style={{ flex: 1 }}>Avisar</Botao>}
        <Botao tipo="neutro" icone="editar" onClick={aoEditar} style={{ flex: 1 }}>Editar</Botao>
      </>}>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {pedido.canceled ? <Selo cor={T.err} fundo={T.errSoft}>Cancelado</Selo>
          : <Selo cor={pedido.statusColor} fundo={T.bg2} ponto>{pedido.statusName}</Selo>}
        {pedido.urgent && <Selo cor={T.warn} fundo={T.warnSoft}>Urgente</Selo>}
        <Selo cor={pedido.paid ? T.ok : T.warn} fundo={pedido.paid ? T.okSoft : T.warnSoft}>
          {pedido.paid ? "Pago" : "A receber"}
        </Selo>
      </div>

      {!pedido.canceled && (
        <Campo label="Mover para a etapa">
          <Selecao value={pedido.statusId || ""} onChange={(e) => mudarEtapa(e.target.value)}>
            {meta.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Selecao>
        </Campo>
      )}

      <Cartao style={{ padding: 14, marginBottom: 14, boxShadow: "none" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink2, marginBottom: 10 }}>
          {pedido.deliveryType === "retirada" ? "RETIRADA NA LOJA" : "ENTREGA"}
        </div>
        <Info k="Quando" v={`${dia(pedido.deliveryDate)} · ${pedido.deliveryWindow || "a combinar"}`} />
        {pedido.deliveryType === "entrega" && (
          <>
            <Info k="Quem recebe" v={pedido.recipientName || pedido.buyerName} />
            {pedido.recipientPhone && <Info k="Telefone" v={pedido.recipientPhone} />}
            <Info k="Endereço" v={`${pedido.street}, ${pedido.numberAddr}${pedido.complement ? ` — ${pedido.complement}` : ""}`} />
            <Info k="Bairro" v={pedido.neighborhood} />
            {pedido.reference && <Info k="Referência" v={pedido.reference} />}
            {pedido.street && (
              <Botao tipo="suave" tamanho="s" icone="local" onClick={rotaEntrega} style={{ marginTop: 10 }}>Abrir no mapa</Botao>
            )}
          </>
        )}
      </Cartao>

      {pedido.cardMessage && (
        <Cartao style={{ padding: 16, marginBottom: 14, background: T.rosaSoft, border: `1px solid ${T.line}`, boxShadow: "none" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.vinho, marginBottom: 8 }}>CARTÃO</div>
          {pedido.cardTo && <div style={{ fontSize: 13.5, color: T.ink2 }}>Para: <b style={{ color: T.ink }}>{pedido.cardTo}</b></div>}
          <div style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.5, margin: "8px 0", color: T.ink }}>"{pedido.cardMessage}"</div>
          {pedido.cardFrom && <div style={{ fontSize: 13.5, color: T.ink2, textAlign: "right" }}>De: <b style={{ color: T.ink }}>{pedido.cardFrom}</b></div>}
        </Cartao>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink2, marginBottom: 8 }}>ITENS</div>
      <Cartao style={{ padding: 0, overflow: "hidden", marginBottom: 14, boxShadow: "none" }}>
        {pedido.items.map((i, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: k < pedido.items.length - 1 ? `1px solid ${T.line}` : "none" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{i.description}</div>
              <div style={{ fontSize: 12.5, color: T.ink2 }}>{num(i.quantity)}x {brl(i.unitPrice)}{i.sizeName ? ` · ${i.sizeName}` : ""}</div>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{brl(i.total)}</div>
          </div>
        ))}
      </Cartao>

      <Cartao style={{ padding: 14, marginBottom: 14, background: T.bg2, border: "none", boxShadow: "none" }}>
        <Linha rotulo="Itens" valor={brl(pedido.itemsTotal)} />
        {pedido.deliveryFee > 0 && <Linha rotulo="Taxa de entrega" valor={brl(pedido.deliveryFee)} />}
        {pedido.discount > 0 && <Linha rotulo="Desconto" valor={`− ${brl(pedido.discount)}`} />}
        <Linha rotulo="Total" valor={brl(pedido.total)} forte />
        {pedido.paymentMethod && <Linha rotulo="Forma" valor={pedido.paymentMethod} />}
      </Cartao>

      {!pedido.paid && !pedido.canceled && (
        <Botao tipo="suave" icone="dinheiro" onClick={marcarPago} style={{ width: "100%", marginBottom: 16 }}>Marcar como pago</Botao>
      )}

      {pedido.notes && (
        <Cartao style={{ padding: 14, marginBottom: 14, boxShadow: "none" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink2, marginBottom: 6 }}>OBSERVAÇÕES</div>
          <div style={{ fontSize: 13.5 }}>{pedido.notes}</div>
        </Cartao>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink2, marginBottom: 8 }}>HISTÓRICO</div>
      <Cartao style={{ padding: 6, boxShadow: "none" }}>
        {historico.length === 0 && <Vazio icone="relogio">Nada registrado.</Vazio>}
        {historico.map((h) => (
          <div key={h.id} style={{ display: "flex", gap: 11, padding: "10px 12px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.line, marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{h.statusName}</div>
              <div style={{ fontSize: 12, color: T.ink3 }}>{diaHora(h.createdAt)}{h.userName ? ` · ${h.userName}` : ""}</div>
            </div>
          </div>
        ))}
      </Cartao>

      {user.role === "admin" && !pedido.canceled && (
        <Botao tipo="perigo" icone="lixo" onClick={cancelar} style={{ width: "100%", marginTop: 16 }}>Cancelar pedido</Botao>
      )}
    </Modal>
  );
}

function Info({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", fontSize: 13.5 }}>
      <span style={{ color: T.ink2, flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{v || "—"}</span>
    </div>
  );
}

/* -------------------------------- Produtos -------------------------------- */
function Produtos({ ctx }) {
  const { produtos, meta, largo, recarregar, avisar } = ctx;
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState(null);

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (filtro && p.categoryId !== filtro) return false;
      if (!b) return true;
      return p.name.toLowerCase().includes(b) || (p.sku || "").toLowerCase().includes(b);
    });
  }, [produtos, busca, filtro]);

  return (
    <div>
      <Titulo sub={`${lista.length} de ${produtos.length} produtos`}
        acao={<Botao icone="mais" onClick={() => setForm({ novo: true })}>Novo produto</Botao>}>
        Produtos
      </Titulo>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.ink3 }}><Icone n="busca" s={16} /></span>
        <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" style={{ paddingLeft: 36 }} />
      </div>

      <div className="px-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12 }}>
        {[{ id: "", name: "Todas", emoji: "" }, ...meta.categories].map((c) => {
          const on = filtro === c.id;
          return (
            <button key={c.id || "all"} onClick={() => setFiltro(c.id)} className="px-btn"
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer", border: `1px solid ${on ? "transparent" : T.line}`, background: on ? T.ink : "#fff", color: on ? "#fff" : T.ink2 }}>
              {c.emoji ? `${c.emoji} ` : ""}{c.name}
            </button>
          );
        })}
      </div>

      {lista.length === 0 && <Cartao><Vazio>Nenhum produto encontrado.</Vazio></Cartao>}

      <div style={{ display: "grid", gridTemplateColumns: largo ? "1fr 1fr" : "1fr", gap: 10 }}>
        {lista.map((p) => (
          <Cartao key={p.id} onClick={() => setForm(p)} style={{ padding: 13, display: "flex", gap: 12, alignItems: "center", opacity: p.active ? 1 : 0.55 }}>
            <div style={{ width: 56, height: 56, borderRadius: 13, background: T.bg2, overflow: "hidden", flexShrink: 0, display: "grid", placeItems: "center" }}>
              {p.photos[0] ? <img src={p.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Icone n="produtos" s={20} cor={T.rosa} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 2 }}>
                {ctx.categoria(p.categoryId)?.name || "sem categoria"}{p.sku ? ` · ${p.sku}` : ""}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                {!p.active && <Selo cor={T.ink3}>Fora do catálogo</Selo>}
                {temPromo(p) && <Selo cor={T.rosa} fundo={T.rosaSoft}>Em promoção</Selo>}
                {p.sizes.length > 0 && <Selo cor={T.vinho} fundo={T.vinhoSoft}>{p.sizes.length} tamanhos</Selo>}
                {p.trackStock && <Selo cor={p.stock > 0 ? T.ok : T.err} fundo={p.stock > 0 ? T.okSoft : T.errSoft}>{p.stock} em estoque</Selo>}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {p.onRequest ? (
                <>
                  <Selo cor={T.rosa} fundo={T.rosaSoft}>Consultar</Selo>
                  {Number(p.price) > 0 && <div style={{ fontSize: 11, color: T.ink3, marginTop: 4 }}>a partir de {brl(p.price)}</div>}
                </>
              ) : (
                <>
                  {p.priceFrom && <div style={{ fontSize: 11, color: T.ink3 }}>a partir de</div>}
                  {temPromo(p) && <div style={{ fontSize: 12, color: T.ink3, textDecoration: "line-through" }}>{brl(p.price)}</div>}
                  <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: temPromo(p) ? T.rosa : T.ink }}>
                    {brl(precoAtual(p))}
                  </div>
                </>
              )}
            </div>
          </Cartao>
        ))}
      </div>

      {form && (
        <FormProduto ctx={ctx} inicial={form.novo ? null : form} aoFechar={() => setForm(null)}
          aoSalvar={async () => { setForm(null); await recarregar(); avisar("Produto salvo."); }} />
      )}
    </div>
  );
}

function FormProduto({ ctx, inicial, aoFechar, aoSalvar }) {
  const { meta, user, avisar, recarregar } = ctx;
  const [f, setF] = useState(() => inicial ? { ...inicial, sizes: inicial.sizes.map((s) => ({ ...s })), occasionIds: [...inicial.occasionIds] } : {
    name: "", sku: "", categoryId: "", description: "", price: "", onRequest: false, priceFrom: false,
    madeToOrder: true, leadHours: "", trackStock: false, stock: 0, active: true,
    promoPrice: null, showQuote: true,
    mainImage: null, gallery: [], sizes: [], occasionIds: [],
  });
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (inicial) return;
    let vivo = true;
    api.nextSku().then((c) => { if (vivo) setF((x) => (x.sku ? x : { ...x, sku: c })); }).catch(() => {});
    return () => { vivo = false; };
  }, [inicial]);

  const enviarFoto = async (e, principal) => {
    const arquivos = Array.from(e.target.files || []);
    if (!arquivos.length) return;
    setEnviando(true);
    try {
      const urls = [];
      for (const a of arquivos) urls.push(await api.uploadFile(a, "produtos"));
      if (principal) set("mainImage", urls[0]); else set("gallery", [...f.gallery, ...urls]);
    } catch (err) { avisar(err.message, "erro"); }
    finally { setEnviando(false); e.target.value = ""; }
  };

  const excluir = async () => {
    if (!window.confirm(`Excluir "${f.name}"? Os pedidos antigos continuam intactos.`)) return;
    try { await api.softDeleteProduct(f.id); aoFechar(); await recarregar(); avisar("Produto excluído."); }
    catch (e) { avisar(e.message, "erro"); }
  };

  const salvar = async () => {
    if (!f.name.trim()) return avisar("Dê um nome ao produto.", "erro");
    if (!f.categoryId) return avisar("Escolha a categoria.", "erro");
    const faltando = [];
    if (!f.onRequest && !Number(f.price) && f.sizes.length === 0) faltando.push("preço");
    if (!f.mainImage) faltando.push("foto");
    if (!f.description.trim()) faltando.push("descrição");
    if (faltando.length && !window.confirm(`Faltou: ${faltando.join(", ")}.\n\nSalvar assim mesmo?`)) return;
    setSalvando(true);
    try {
      if (f.sku && await api.skuExists(f.sku.trim(), f.id)) { setSalvando(false); return avisar("Já existe produto com esse código.", "erro"); }
      const promo = f.sizes.length > 0 ? null : f.promoPrice;
      await api.saveProduct({ ...f, name: f.name.trim(), sku: f.sku.trim(), promoPrice: promo });
      aoSalvar();
    } catch (e) { avisar(e.message, "erro"); }
    finally { setSalvando(false); }
  };

  const alternarOcasiao = (id) => set("occasionIds", f.occasionIds.includes(id) ? f.occasionIds.filter((x) => x !== id) : [...f.occasionIds, id]);

  return (
    <Modal aberto aoFechar={aoFechar} largo titulo={f.id ? "Editar produto" : "Novo produto"} sub="Foto, preço, tamanhos e ocasiões"
      rodape={<>
        <Botao tipo="neutro" onClick={aoFechar} style={{ flex: 1 }}>Cancelar</Botao>
        <Botao onClick={salvar} disabled={salvando || enviando} icone="check" style={{ flex: 2 }}>{salvando ? "Salvando…" : "Salvar"}</Botao>
      </>}>

      <Campo label="Nome" obrigatorio><Entrada value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Buquê de 12 rosas vermelhas" /></Campo>

      <div className="px-2col">
        <Campo label="Categoria" obrigatorio>
          <Selecao value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— escolha —</option>
            {meta.categories.map((c) => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ""}{c.name}</option>)}
          </Selecao>
        </Campo>
        <Campo label="Código" dica={f.id ? undefined : "Preenchido sozinho"}>
          <Entrada value={f.sku} onChange={(e) => set("sku", e.target.value)} />
        </Campo>
      </div>

      <Campo label="Descrição"><Area value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="O que vai no arranjo, tipo de embalagem, detalhes…" /></Campo>

      <SimNao label="Preço sob consulta" valor={f.onRequest} aoMudar={(v) => set("onRequest", v)}
        dica="Para cestas montadas e arranjos que variam conforme o pedido." cor={T.rosa} fundo={T.rosaSoft} />

      {f.onRequest && (
        <Campo label="Valor de referência" dica='Opcional. Se preencher, o catálogo mostra "Sob consulta — a partir de R$ ...".'>
          <Entrada type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="Deixe vazio para só 'Sob consulta'" />
        </Campo>
      )}

      {!f.onRequest && (
        <>
          <div className="px-2col">
            <Campo label="Preço"><Entrada type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0,00" /></Campo>
            <Campo label="Mostrar como" dica="No catálogo">
              <Selecao value={f.priceFrom ? "1" : "0"} onChange={(e) => set("priceFrom", e.target.value === "1")}>
                <option value="0">Preço fechado</option>
                <option value="1">A partir de</option>
              </Selecao>
            </Campo>
          </div>

          <Campo label="Promoção" dica="O preço acima fica guardado. Para encerrar, é só apagar este valor.">
            {f.sizes.length > 0 ? (
              <div style={{ background: T.bg2, borderRadius: 12, padding: "12px 13px", fontSize: 13, color: T.ink2 }}>
                Produto com tamanhos não entra em promoção. Ajuste o preço do tamanho.
              </div>
            ) : (
              <>
                <Entrada type="number" step="0.01" value={f.promoPrice == null ? "" : f.promoPrice}
                  onChange={(e) => set("promoPrice", e.target.value === "" ? null : e.target.value)}
                  placeholder="Sem promoção" />
                {f.promoPrice != null && f.promoPrice !== "" && (
                  <div style={{ fontSize: 12.5, marginTop: 6, color: Number(f.promoPrice) > 0 && Number(f.promoPrice) < Number(f.price) ? T.ok : T.warn }}>
                    {Number(f.promoPrice) > 0 && Number(f.promoPrice) < Number(f.price)
                      ? `De ${brl(f.price)} por ${brl(f.promoPrice)} — ${Math.round((1 - Number(f.promoPrice) / Number(f.price)) * 100)}% de desconto.`
                      : "A promoção só aparece se o valor for menor que o preço cadastrado."}
                  </div>
                )}
              </>
            )}
          </Campo>

          <Campo label="Tamanhos" dica="Pequeno, médio e grande com preços diferentes. Deixe vazio se houver um preço só.">
            <Cartao style={{ padding: 6, boxShadow: "none" }}>
              {f.sizes.length === 0 && <div style={{ padding: "12px", fontSize: 13, color: T.ink3 }}>Sem tamanhos: vale o preço acima.</div>}
              {f.sizes.map((s, k) => (
                <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", padding: 8 }}>
                  <Entrada placeholder="Nome (ex.: Médio)" value={s.name}
                    onChange={(e) => set("sizes", f.sizes.map((x, i) => i === k ? { ...x, name: e.target.value } : x))} style={{ padding: "8px 10px" }} />
                  <Entrada type="number" step="0.01" placeholder="Preço" value={s.price}
                    onChange={(e) => set("sizes", f.sizes.map((x, i) => i === k ? { ...x, price: e.target.value } : x))} style={{ padding: "8px 10px", width: 120 }} />
                  <button onClick={() => set("sizes", f.sizes.filter((_, i) => i !== k))} className="px-btn" aria-label="Remover"
                    style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: T.errSoft, color: T.err, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icone n="lixo" s={14} />
                  </button>
                </div>
              ))}
              <div style={{ padding: 8 }}>
                <Botao tipo="suave" tamanho="s" icone="mais" onClick={() => set("sizes", [...f.sizes, { name: "", price: "" }])}>Adicionar tamanho</Botao>
              </div>
            </Cartao>
          </Campo>
        </>
      )}

      <SimNao label='Botão "Consultar valores"' valor={f.showQuote !== false} aoMudar={(v) => set("showQuote", v)}
        dica="No catálogo, abre o WhatsApp já perguntando o valor deste produto." cor={T.rosa} fundo={T.rosaSoft} />

      <Campo label="Ocasiões" dica="Onde esse produto aparece no catálogo.">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {meta.occasions.map((o) => {
            const on = f.occasionIds.includes(o.id);
            return (
              <button key={o.id} onClick={() => alternarOcasiao(o.id)} className="px-btn"
                style={{ padding: "8px 13px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `1px solid ${on ? T.vinho : T.line}`, background: on ? T.vinhoSoft : "#fff", color: on ? T.vinho : T.ink2 }}>
                {o.emoji ? `${o.emoji} ` : ""}{o.name}
              </button>
            );
          })}
        </div>
      </Campo>

      <SimNao label="Controlar estoque" valor={f.trackStock} aoMudar={(v) => set("trackStock", v)}
        dica="Use em pelúcias, canecas e chaveiros. Flores e arranjos não precisam." />
      {f.trackStock && (
        <Campo label="Quantidade em estoque"><Entrada type="number" min="0" value={f.stock} onChange={(e) => set("stock", e.target.value)} /></Campo>
      )}

      <SimNao label="Aparece no catálogo" valor={f.active} aoMudar={(v) => set("active", v)}
        dica="Desligue para esconder sem excluir." cor={T.ok} fundo={T.okSoft} />

      <Campo label="Foto principal">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: 14, background: T.bg2, overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0 }}>
            {f.mainImage ? <img src={f.mainImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icone n="produtos" s={22} cor={T.rosa} />}
          </div>
          <div>
            <label className="px-btn" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              <Icone n="upload" s={15} />{enviando ? "Enviando…" : "Escolher foto"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => enviarFoto(e, true)} />
            </label>
            {f.mainImage && <button onClick={() => set("mainImage", null)} className="px-btn" style={{ marginLeft: 8, border: "none", background: "none", color: T.err, fontSize: 13, cursor: "pointer" }}>remover</button>}
          </div>
        </div>
      </Campo>

      <Campo label="Mais fotos">
        <div className="px-x" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 8 }}>
          {f.gallery.map((g, i) => (
            <div key={i} style={{ position: "relative", flexShrink: 0 }}>
              <img src={g} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 11, border: `1px solid ${T.line}` }} />
              <button onClick={() => set("gallery", f.gallery.filter((_, k) => k !== i))} className="px-btn"
                style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", border: "none", background: T.err, color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Icone n="fechar" s={11} />
              </button>
            </div>
          ))}
        </div>
        <label className="px-btn" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <Icone n="mais" s={15} />Adicionar fotos
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => enviarFoto(e, false)} />
        </label>
      </Campo>

      {f.id && user.role === "admin" && (
        <Botao tipo="perigo" icone="lixo" onClick={excluir} style={{ width: "100%", marginTop: 6 }}>Excluir produto</Botao>
      )}
    </Modal>
  );
}

function SimNao({ label, dica, valor, aoMudar, cor = T.vinho, fundo = T.vinhoSoft }) {
  return (
    <div style={{ background: valor ? fundo : T.bg2, borderRadius: 13, padding: 13, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          {dica && <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 2 }}>{dica}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {[[true, "Sim"], [false, "Não"]].map(([v, l]) => {
            const on = valor === v;
            return (
              <button key={l} onClick={() => aoMudar(v)} className="px-btn"
                style={{ padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${on ? "transparent" : T.line}`, background: on ? (v ? cor : T.ink) : "#fff", color: on ? "#fff" : T.ink2 }}>
                {l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Promoções -------------------------------- */
function Promocoes({ ctx }) {
  const { produtos, largo, recarregar, avisar } = ctx;
  const [alvo, setAlvo] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  /* tudo que tem valor de promoção guardado, mesmo se estiver mal preenchido */
  const ativas = useMemo(() => produtos.filter((p) => p.promoPrice != null && p.promoPrice > 0), [produtos]);
  const disponiveis = useMemo(() => produtos.filter((p) => podePromo(p) && !(p.promoPrice > 0)), [produtos]);
  const escolhido = produtos.find((p) => p.id === alvo);

  const aplicar = async () => {
    if (!escolhido) return avisar("Escolha o produto.", "erro");
    const v = Number(valor);
    if (!v || v <= 0) return avisar("Informe o valor da promoção.", "erro");
    if (v >= Number(escolhido.price)) return avisar(`O valor precisa ser menor que ${brl(escolhido.price)}.`, "erro");
    setSalvando(true);
    try {
      await api.setPromo(escolhido.id, v);
      setAlvo(""); setValor("");
      await recarregar();
      avisar("Produto em promoção.");
    } catch (e) { avisar(e.message, "erro"); }
    finally { setSalvando(false); }
  };

  const tirar = async (p) => {
    if (!window.confirm(`Tirar "${p.name}" da promoção?\n\nO preço volta para ${brl(p.price)}.`)) return;
    try { await api.clearPromo(p.id); await recarregar(); avisar("Promoção encerrada."); }
    catch (e) { avisar(e.message, "erro"); }
  };

  return (
    <div>
      <Titulo sub={ativas.length ? `${ativas.length} produto(s) em promoção` : "Nenhuma promoção no ar"}>Promoções</Titulo>

      <Cartao style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Colocar um produto em promoção</div>
        <div style={{ fontSize: 12.5, color: T.ink2, marginBottom: 14 }}>
          O preço cadastrado fica guardado. Ao remover, ele volta sozinho.
        </div>
        <Campo label="Produto">
          <Selecao value={alvo} onChange={(e) => { setAlvo(e.target.value); setValor(""); }}>
            <option value="">— escolha —</option>
            {disponiveis.map((p) => <option key={p.id} value={p.id}>{p.name} — {brl(p.price)}</option>)}
          </Selecao>
        </Campo>
        {escolhido && (
          <>
            <Campo label="Preço na promoção" dica={`Preço normal: ${brl(escolhido.price)}`}>
              <Entrada type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </Campo>
            {Number(valor) > 0 && Number(valor) < Number(escolhido.price) && (
              <div style={{ fontSize: 13, color: T.ok, marginTop: -6, marginBottom: 12 }}>
                {Math.round((1 - Number(valor) / Number(escolhido.price)) * 100)}% de desconto.
              </div>
            )}
          </>
        )}
        <Botao icone="check" disabled={salvando || !escolhido} onClick={aplicar} style={{ width: "100%" }}>
          {salvando ? "Salvando…" : "Colocar em promoção"}
        </Botao>
        {disponiveis.length === 0 && !escolhido && (
          <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 10 }}>
            Só entram aqui produtos com preço único: sem tamanhos e sem "sob consulta".
          </div>
        )}
      </Cartao>

      <Titulo sub="Toque para alterar o valor ou encerrar">No ar agora</Titulo>
      {ativas.length === 0 && <Cartao><Vazio icone="promocoes">Nenhum produto em promoção.</Vazio></Cartao>}

      <div style={{ display: "grid", gridTemplateColumns: largo ? "1fr 1fr" : "1fr", gap: 10 }}>
        {ativas.map((p) => {
          const valida = temPromo(p);
          return (
            <Cartao key={p.id} style={{ padding: 13, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 13, background: T.bg2, overflow: "hidden", flexShrink: 0, display: "grid", placeItems: "center" }}>
                {p.photos[0] ? <img src={p.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Icone n="produtos" s={20} cor={T.rosa} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: T.ink2, marginTop: 3 }}>
                  <span style={{ textDecoration: "line-through", color: T.ink3 }}>{brl(p.price)}</span>
                  {" por "}
                  <strong style={{ color: T.rosa }}>{brl(p.promoPrice)}</strong>
                </div>
                {!valida && (
                  <div style={{ fontSize: 12, color: T.warn, marginTop: 3 }}>
                    Não aparece no catálogo: o valor não é menor que o preço.
                  </div>
                )}
                {valida && (
                  <div style={{ fontSize: 12, color: T.ok, marginTop: 3 }}>
                    {Math.round((1 - Number(p.promoPrice) / Number(p.price)) * 100)}% de desconto
                  </div>
                )}
              </div>
              <Botao tipo="perigo" tamanho="s" icone="lixo" onClick={() => tirar(p)}>Tirar</Botao>
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- Clientes -------------------------------- */
function Clientes({ ctx }) {
  const { meta, pedidos, largo, avisar, recarregarMeta } = ctx;
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(null);
  const [ficha, setFicha] = useState(null);

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return b ? meta.customers.filter((c) => c.name.toLowerCase().includes(b) || (c.phone || "").includes(b)) : meta.customers;
  }, [meta.customers, busca]);

  const resumo = (id) => {
    const meus = pedidos.filter((p) => p.customerId === id && !p.canceled);
    return { n: meus.length, total: meus.reduce((a, p) => a + p.total, 0) };
  };

  return (
    <div>
      <Titulo sub={`${meta.customers.length} cadastrados`}
        acao={<Botao icone="mais" onClick={() => setForm({ novo: true })}>Novo cliente</Botao>}>
        Clientes
      </Titulo>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.ink3 }}><Icone n="busca" s={16} /></span>
        <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" style={{ paddingLeft: 36 }} />
      </div>

      {lista.length === 0 && <Cartao><Vazio icone="clientes">Nenhum cliente encontrado.</Vazio></Cartao>}

      <div style={{ display: "grid", gridTemplateColumns: largo ? "1fr 1fr" : "1fr", gap: 10 }}>
        {lista.map((c) => {
          const r = resumo(c.id);
          return (
            <Cartao key={c.id} onClick={() => setFicha(c)} style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.rosaSoft, color: T.rosa, display: "grid", placeItems: "center", fontFamily: SERIF, fontSize: 17, fontWeight: 600, flexShrink: 0 }}>
                {c.name.trim().charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: T.ink2 }}>{c.phone || "sem telefone"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{brl(r.total)}</div>
                <div style={{ fontSize: 11.5, color: T.ink3 }}>{r.n} pedido(s)</div>
              </div>
            </Cartao>
          );
        })}
      </div>

      {form && <FormCliente inicial={form.novo ? null : form} avisar={avisar} aoFechar={() => setForm(null)}
        aoSalvar={async () => { setForm(null); await recarregarMeta(); avisar("Cliente salvo."); }} />}
      {ficha && <FichaCliente ctx={ctx} cliente={ficha} aoFechar={() => setFicha(null)} aoEditar={() => { setForm(ficha); setFicha(null); }} />}
    </div>
  );
}

function FormCliente({ inicial, aoFechar, aoSalvar, avisar }) {
  const [f, setF] = useState(inicial || { name: "", phone: "", email: "", birthday: "", notes: "" });
  const [indo, setIndo] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const salvar = async () => {
    if (!f.name.trim()) return avisar("Informe o nome.", "erro");
    setIndo(true);
    try { if (f.id) await api.updateCustomer(f.id, f); else await api.addCustomer(f); aoSalvar(); }
    catch (e) { avisar(e.message, "erro"); }
    finally { setIndo(false); }
  };
  return (
    <Modal aberto aoFechar={aoFechar} titulo={f.id ? "Editar cliente" : "Novo cliente"}
      rodape={<>
        <Botao tipo="neutro" onClick={aoFechar} style={{ flex: 1 }}>Cancelar</Botao>
        <Botao onClick={salvar} disabled={indo} icone="check" style={{ flex: 2 }}>{indo ? "Salvando…" : "Salvar"}</Botao>
      </>}>
      <Campo label="Nome" obrigatorio><Entrada value={f.name} onChange={(e) => set("name", e.target.value)} /></Campo>
      <div className="px-2col">
        <Campo label="WhatsApp"><Entrada value={f.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="(34) 90000-0000" /></Campo>
        <Campo label="Aniversário" dica="Para lembrar de oferecer"><Entrada type="date" value={f.birthday || ""} onChange={(e) => set("birthday", e.target.value)} /></Campo>
      </div>
      <Campo label="E-mail"><Entrada value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></Campo>
      <Campo label="Observações"><Area value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Flor preferida, datas importantes, endereço que costuma mandar…" /></Campo>
    </Modal>
  );
}

function FichaCliente({ ctx, cliente, aoFechar, aoEditar }) {
  const { pedidos, user, avisar, recarregarMeta, meta } = ctx;
  const meus = pedidos.filter((p) => p.customerId === cliente.id);
  const total = meus.filter((p) => !p.canceled).reduce((a, p) => a + p.total, 0);

  const excluir = async () => {
    if (!window.confirm(`Excluir ${cliente.name}?`)) return;
    try { await api.removeCustomer(cliente.id); aoFechar(); await recarregarMeta(); avisar("Cliente excluído."); }
    catch (e) { avisar("Não dá para excluir: há pedidos ligados a este cliente.", "erro"); }
  };

  const whats = () => {
    const n = String(cliente.phone || "").replace(/\D/g, "");
    const texto = `Olá, ${cliente.name}! 🌷 Aqui é da ${meta.settings.storeName}.`;
    window.open(`https://wa.me/${n.length <= 11 ? "55" + n : n}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <Modal aberto aoFechar={aoFechar} largo titulo={cliente.name} sub={cliente.phone || "Cliente"}
      rodape={<>
        {cliente.phone && <Botao tipo="zap" icone="whats" onClick={whats} style={{ flex: 1 }}>WhatsApp</Botao>}
        <Botao tipo="neutro" icone="editar" onClick={aoEditar} style={{ flex: 1 }}>Editar</Botao>
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Indicador rotulo="Total comprado" valor={brl(total)} nota={`${meus.length} pedido(s)`} icone="dinheiro" cor={T.ok} fundo={T.okSoft} />
        <Indicador rotulo="Aniversário" valor={cliente.birthday ? diaCurto(cliente.birthday) : "—"} nota="lembrete" icone="presente" cor={T.rosa} fundo={T.rosaSoft} />
      </div>
      {cliente.notes && <Cartao style={{ padding: 14, marginBottom: 16, fontSize: 13.5, color: T.ink2, boxShadow: "none" }}>{cliente.notes}</Cartao>}

      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink2, marginBottom: 8 }}>PEDIDOS</div>
      <Cartao style={{ padding: 6, boxShadow: "none" }}>
        {meus.length === 0 && <Vazio icone="pedidos">Nenhum pedido ainda.</Vazio>}
        {meus.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: T.bg2, display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700, color: T.ink2, flexShrink: 0 }}>#{p.number}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.recipientName || "Para ele mesmo"}</div>
              <div style={{ fontSize: 12, color: T.ink3 }}>{dia(p.deliveryDate)}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{brl(p.total)}</div>
          </div>
        ))}
      </Cartao>

      {user.role === "admin" && (
        <Botao tipo="perigo" icone="lixo" onClick={excluir} style={{ width: "100%", marginTop: 16 }}>Excluir cliente</Botao>
      )}
    </Modal>
  );
}

/* ------------------------------- Relatórios ------------------------------- */
function Relatorios({ ctx }) {
  const { pedidos, produtos, meta, largo } = ctx;
  const [periodo, setPeriodo] = useState("mes");

  const inicio = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (periodo === "7") d.setDate(d.getDate() - 6);
    if (periodo === "mes") d.setDate(1);
    if (periodo === "90") d.setDate(d.getDate() - 89);
    if (periodo === "ano") { d.setMonth(0); d.setDate(1); }
    return d;
  }, [periodo]);

  const doPeriodo = useMemo(() => pedidos.filter((p) => !p.canceled && new Date(p.createdAt) >= inicio), [pedidos, inicio]);

  const t = useMemo(() => ({
    n: doPeriodo.length,
    fat: doPeriodo.reduce((a, p) => a + p.total, 0),
    ticket: doPeriodo.length ? doPeriodo.reduce((a, p) => a + p.total, 0) / doPeriodo.length : 0,
    entregas: doPeriodo.filter((p) => p.deliveryType === "entrega").length,
    taxas: doPeriodo.reduce((a, p) => a + p.deliveryFee, 0),
    receber: pedidos.filter((p) => !p.canceled && !p.paid).reduce((a, p) => a + p.total, 0),
  }), [doPeriodo, pedidos]);

  const ranking = useMemo(() => {
    const mapa = new Map();
    doPeriodo.forEach((p) => p.items.forEach((i) => {
      const chave = i.productId || i.description;
      const r = mapa.get(chave) || { nome: i.description, qtd: 0, valor: 0 };
      r.qtd += Number(i.quantity) || 0; r.valor += Number(i.total) || 0;
      mapa.set(chave, r);
    }));
    return [...mapa.values()].sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [doPeriodo]);

  const porCategoria = useMemo(() => {
    const mapa = new Map();
    doPeriodo.forEach((p) => p.items.forEach((i) => {
      const prod = produtos.find((x) => x.id === i.productId);
      const nome = meta.categories.find((c) => c.id === prod?.categoryId)?.name || "Sem categoria";
      mapa.set(nome, (mapa.get(nome) || 0) + (Number(i.total) || 0));
    }));
    return [...mapa.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  }, [doPeriodo, produtos, meta.categories]);

  const porBairro = useMemo(() => {
    const mapa = new Map();
    doPeriodo.filter((p) => p.deliveryType === "entrega" && p.neighborhood)
      .forEach((p) => mapa.set(p.neighborhood, (mapa.get(p.neighborhood) || 0) + 1));
    return [...mapa.entries()].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n).slice(0, 8);
  }, [doPeriodo]);

  const maiorCat = porCategoria[0]?.valor || 0;
  const maiorRank = ranking[0]?.valor || 0;

  return (
    <div>
      <Titulo sub="Como a loja está indo">Relatórios</Titulo>

      <div className="px-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 14 }}>
        {[["7", "7 dias"], ["mes", "Este mês"], ["90", "90 dias"], ["ano", "Este ano"]].map(([v, l]) => {
          const on = periodo === v;
          return (
            <button key={v} onClick={() => setPeriodo(v)} className="px-btn"
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer", border: `1px solid ${on ? "transparent" : T.line}`, background: on ? T.ink : "#fff", color: on ? "#fff" : T.ink2 }}>
              {l}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: largo ? "repeat(4,1fr)" : "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
        <Indicador rotulo="Faturamento" valor={brl(t.fat)} nota={`${t.n} pedidos`} icone="dinheiro" cor={T.ok} fundo={T.okSoft} />
        <Indicador rotulo="Ticket médio" valor={brl(t.ticket)} nota="por pedido" icone="pedidos" cor={T.vinho} fundo={T.vinhoSoft} />
        <Indicador rotulo="Entregas" valor={t.entregas} nota={`${brl(t.taxas)} em taxas`} icone="moto" cor={T.rosa} fundo={T.rosaSoft} />
        <Indicador rotulo="A receber" valor={brl(t.receber)} nota="todos os pedidos" icone="cartao" cor={T.warn} fundo={T.warnSoft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: largo ? "1fr 1fr" : "1fr", gap: 16 }}>
        <div>
          <Titulo sub="O que mais saiu no período">Mais vendidos</Titulo>
          <Cartao style={{ padding: 6 }}>
            {ranking.length === 0 && <Vazio icone="relatorios">Nenhuma venda no período.</Vazio>}
            {ranking.map((r, i) => (
              <div key={r.nome + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 13px" }}>
                <div style={{ width: 22, textAlign: "center", fontSize: 13, fontWeight: 700, color: i < 3 ? T.vinho : T.ink3 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nome}</div>
                  <div style={{ fontSize: 12, color: T.ink3, marginBottom: 6 }}>{num(r.qtd)} un</div>
                  <div style={{ height: 5, background: T.bg2, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${maiorRank ? Math.max(4, (r.valor / maiorRank) * 100) : 0}%`, height: "100%", background: i < 3 ? T.vinho : T.line, borderRadius: 99 }} />
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{brl(r.valor)}</div>
              </div>
            ))}
          </Cartao>
        </div>

        <div>
          <Titulo sub="Faturamento por tipo">Categorias</Titulo>
          <Cartao style={{ padding: 16, marginBottom: 16 }}>
            {porCategoria.length === 0 && <Vazio>Nada no período.</Vazio>}
            {porCategoria.map((c) => (
              <div key={c.nome} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{c.nome}</span><span style={{ fontWeight: 600 }}>{brl(c.valor)}</span>
                </div>
                <div style={{ height: 7, background: T.bg2, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${maiorCat ? Math.max(3, (c.valor / maiorCat) * 100) : 0}%`, height: "100%", background: T.rosa, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </Cartao>

          <Titulo sub="Para onde você mais entrega">Bairros</Titulo>
          <Cartao style={{ padding: 6 }}>
            {porBairro.length === 0 && <Vazio icone="local">Nenhuma entrega no período.</Vazio>}
            {porBairro.map((b) => (
              <div key={b.nome} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px" }}>
                <Icone n="local" s={15} cor={T.ink3} />
                <span style={{ flex: 1, fontSize: 13.5 }}>{b.nome}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{b.n}</span>
              </div>
            ))}
          </Cartao>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Ajustes -------------------------------- */
function Ajustes({ ctx }) {
  const { meta, user, avisar, recarregarMeta, produtos, pedidos, largo } = ctx;
  const [cfg, setCfg] = useState(meta.settings);
  const [novaCat, setNovaCat] = useState("");
  const [novaOca, setNovaOca] = useState("");
  const [novaEtapa, setNovaEtapa] = useState("");
  const [zona, setZona] = useState({ name: "", fee: "" });
  const admin = user.role === "admin";

  const tenta = async (fn, ok) => {
    try { await fn(); await recarregarMeta(); avisar(ok); }
    catch (e) { avisar(/violates foreign key/.test(e.message) ? "Não dá para excluir: já existe registro usando isso." : e.message, "erro"); }
  };

  const baixar = (nome, linhas) => {
    const csv = linhas.map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = nome; a.click();
    URL.revokeObjectURL(url);
  };

  const Lista = ({ titulo, dica, itens, valor, setValor, aoAdd, aoRemover, placeholder }) => (
    <Cartao style={{ padding: 6, marginBottom: 16 }}>
      <div style={{ padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{titulo}</div>
        {dica && <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 2 }}>{dica}</div>}
      </div>
      {itens.map((i) => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: `1px solid ${T.line}` }}>
          {i.color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: i.color }} />}
          <span style={{ flex: 1, fontSize: 14 }}>{i.emoji ? `${i.emoji} ` : ""}{i.name}</span>
          {admin && (
            <button onClick={() => aoRemover(i.id)} className="px-btn" aria-label="Remover"
              style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: T.ink3, cursor: "pointer", display: "grid", placeItems: "center" }}>
              <Icone n="lixo" s={15} />
            </button>
          )}
        </div>
      ))}
      {admin && (
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${T.line}` }}>
          <Entrada value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder} style={{ flex: 1, padding: "8px 11px" }} />
          <Botao tipo="suave" tamanho="s" icone="mais" onClick={aoAdd} disabled={!valor.trim()}>Adicionar</Botao>
        </div>
      )}
    </Cartao>
  );

  return (
    <div>
      <Titulo sub={admin ? "Você é administrador" : "Perfil de atendente"}>Ajustes</Titulo>

      <div style={{ display: "grid", gridTemplateColumns: largo ? "1fr 1fr" : "1fr", gap: 16, alignItems: "start" }}>
        <div>
          <Cartao style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>A loja</div>
            <Campo label="Nome"><Entrada value={cfg.storeName} onChange={(e) => setCfg({ ...cfg, storeName: e.target.value })} disabled={!admin} /></Campo>
            <div className="px-2col">
              <Campo label="WhatsApp" dica="Com 55 e DDD"><Entrada value={cfg.whatsapp} onChange={(e) => setCfg({ ...cfg, whatsapp: e.target.value })} disabled={!admin} /></Campo>
              <Campo label="Instagram"><Entrada value={cfg.instagram} onChange={(e) => setCfg({ ...cfg, instagram: e.target.value })} disabled={!admin} /></Campo>
            </div>
            <Campo label="Endereço"><Entrada value={cfg.address} onChange={(e) => setCfg({ ...cfg, address: e.target.value })} disabled={!admin} /></Campo>
            <Campo label="Horário de funcionamento"><Entrada value={cfg.hours} onChange={(e) => setCfg({ ...cfg, hours: e.target.value })} disabled={!admin} /></Campo>
            <div className="px-2col">
              <Campo label="Chave Pix" dica="Vai na mensagem do pedido feito pelo catálogo.">
                <Entrada value={cfg.pixKey} onChange={(e) => setCfg({ ...cfg, pixKey: e.target.value })} disabled={!admin} />
              </Campo>
              <Campo label="Tipo da chave">
                <Selecao value={cfg.pixType || "CNPJ"} onChange={(e) => setCfg({ ...cfg, pixType: e.target.value })} disabled={!admin}>
                  {["CNPJ", "CPF", "Celular", "E-mail", "Aleatória"].map((t) => <option key={t} value={t}>{t}</option>)}
                </Selecao>
              </Campo>
            </div>
            <Campo label="Nome no Pix"><Entrada value={cfg.pixName} onChange={(e) => setCfg({ ...cfg, pixName: e.target.value })} disabled={!admin} /></Campo>
            <Campo label="Aviso de pagamento" dica="Aparece no catálogo."><Area value={cfg.paymentNote} onChange={(e) => setCfg({ ...cfg, paymentNote: e.target.value })} disabled={!admin} /></Campo>
            <Campo label="Aviso do cartão"><Entrada value={cfg.cardNote} onChange={(e) => setCfg({ ...cfg, cardNote: e.target.value })} disabled={!admin} /></Campo>
            {admin && <Botao icone="check" style={{ width: "100%" }} onClick={() => tenta(() => api.saveSettings(cfg), "Ajustes salvos.")}>Salvar</Botao>}
          </Cartao>

          <Cartao style={{ padding: 6, marginBottom: 16 }}>
            <div style={{ padding: "12px 14px 10px" }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Bairros e taxas</div>
              <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 2 }}>A taxa entra sozinha no pedido quando você escolhe o bairro.</div>
            </div>
            {meta.zones.map((z) => (
              <div key={z.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: `1px solid ${T.line}` }}>
                <span style={{ flex: 1, fontSize: 14 }}>{z.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{brl(z.fee)}</span>
                {admin && (
                  <button onClick={() => tenta(() => api.removeZone(z.id), "Bairro removido.")} className="px-btn" aria-label="Remover"
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: T.ink3, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    <Icone n="lixo" s={15} />
                  </button>
                )}
              </div>
            ))}
            {admin && (
              <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${T.line}` }}>
                <Entrada value={zona.name} onChange={(e) => setZona({ ...zona, name: e.target.value })} placeholder="Bairro" style={{ flex: 1, padding: "8px 11px" }} />
                <Entrada type="number" step="0.01" value={zona.fee} onChange={(e) => setZona({ ...zona, fee: e.target.value })} placeholder="Taxa" style={{ width: 100, padding: "8px 11px" }} />
                <Botao tipo="suave" tamanho="s" icone="mais" disabled={!zona.name.trim()}
                  onClick={() => tenta(async () => { await api.saveZone(zona); setZona({ name: "", fee: "" }); }, "Bairro adicionado.")}>
                  Add
                </Botao>
              </div>
            )}
          </Cartao>

          <Cartao style={{ padding: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Cópia dos dados</div>
            <div style={{ fontSize: 12.5, color: T.ink2, marginBottom: 14 }}>Planilhas que abrem no Excel e no Google Planilhas.</div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <Botao tipo="neutro" tamanho="s" icone="pedidos" onClick={() => baixar("paixao-pedidos.csv", [
                ["Número", "Criado", "Cliente", "Quem recebe", "Entrega", "Bairro", "Etapa", "Total", "Pago"],
                ...pedidos.map((p) => [p.number, dia(p.createdAt), p.buyerName, p.recipientName, dia(p.deliveryDate), p.neighborhood, p.canceled ? "Cancelado" : p.statusName, p.total, p.paid ? "sim" : "não"]),
              ])}>Pedidos</Botao>
              <Botao tipo="neutro" tamanho="s" icone="produtos" onClick={() => baixar("paixao-produtos.csv", [
                ["Nome", "Código", "Categoria", "Preço", "Sob consulta", "No catálogo"],
                ...produtos.map((p) => [p.name, p.sku, ctx.categoria(p.categoryId)?.name || "", p.price, p.onRequest ? "sim" : "não", p.active ? "sim" : "não"]),
              ])}>Produtos</Botao>
              <Botao tipo="neutro" tamanho="s" icone="clientes" onClick={() => baixar("paixao-clientes.csv", [
                ["Nome", "WhatsApp", "E-mail", "Aniversário"],
                ...meta.customers.map((c) => [c.name, c.phone, c.email, c.birthday]),
              ])}>Clientes</Botao>
            </div>
          </Cartao>
        </div>

        <div>
          <Lista titulo="Categorias" dica="Os tipos de produto." itens={meta.categories} valor={novaCat} setValor={setNovaCat} placeholder="Ex.: Vasos"
            aoAdd={() => tenta(async () => { await api.addCategory(novaCat.trim()); setNovaCat(""); }, "Categoria criada.")}
            aoRemover={(id) => tenta(() => api.removeCategory(id), "Categoria removida.")} />

          <Lista titulo="Ocasiões" dica="Como o cliente encontra o produto no catálogo." itens={meta.occasions} valor={novaOca} setValor={setNovaOca} placeholder="Ex.: Formatura"
            aoAdd={() => tenta(async () => { await api.addOccasion(novaOca.trim()); setNovaOca(""); }, "Ocasião criada.")}
            aoRemover={(id) => tenta(() => api.removeOccasion(id), "Ocasião removida.")} />

          <Lista titulo="Etapas do pedido" dica="Do recebimento até a entrega." itens={meta.statuses} valor={novaEtapa} setValor={setNovaEtapa} placeholder="Ex.: Aguardando flor"
            aoAdd={() => tenta(async () => { await api.addStatus(novaEtapa.trim()); setNovaEtapa(""); }, "Etapa criada.")}
            aoRemover={(id) => tenta(() => api.removeStatus(id), "Etapa removida.")} />

          {admin && (
            <Cartao style={{ padding: 6 }}>
              <div style={{ padding: "12px 14px 10px" }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>Usuários</div>
                <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 2 }}>
                  Criados no Supabase, em Authentication → Users → Add user, com "Auto Confirm User".
                </div>
              </div>
              {meta.users.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderTop: `1px solid ${T.line}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg2, color: T.ink2, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700 }}>
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name || u.email}</div>
                    <div style={{ fontSize: 12, color: T.ink3 }}>{u.email}</div>
                  </div>
                  <Selo cor={u.role === "admin" ? T.vinho : T.ink2} fundo={u.role === "admin" ? T.vinhoSoft : T.bg2}>
                    {u.role === "admin" ? "Administrador" : "Atendente"}
                  </Selo>
                  {u.id !== user.id && (
                    <Botao tipo="fantasma" tamanho="s" onClick={() => tenta(() => api.setUserRole(u.id, u.role === "admin" ? "func" : "admin"), "Perfil atualizado.")}>trocar</Botao>
                  )}
                </div>
              ))}
            </Cartao>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", color: T.ink3, fontSize: 12, margin: "30px 0 10px" }}>
        {meta.settings.storeName} · versão 1.0
      </div>
    </div>
  );
}
