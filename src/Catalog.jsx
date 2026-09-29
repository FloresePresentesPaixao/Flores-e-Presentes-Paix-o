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
/* ---------------------------------------------------------------------------
   TRAVA DE LARGURA — não remover.
   Se qualquer elemento ficar mais largo que a tela, o navegador do celular
   encolhe a página inteira para caber e sobra aquela faixa branca na lateral.
   Estas linhas cortam o excesso na raiz, então isso nunca acontece, em
   qualquer aparelho. O "clip" corta sem criar rolagem lateral, e por isso não
   atrapalha cabeçalho grudado nem janela flutuante.
   --------------------------------------------------------------------------- */
html,body,#root{max-width:100%;overflow-x:clip}
@supports not (overflow-x:clip){ html,body{overflow-x:hidden} }

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
  componentDidCatch(e) { try { console.error(e); } catch (x) {} }
  render() {
    if (!this.state.caiu) return this.props.children;
    return (
      <div style={{ fontFamily: FONT, background: C.creme, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, marginBottom: 8 }}>Algo não abriu direito</div>
          <p style={{ color: C.ink2, margin: "0 0 18px" }}>Toque abaixo para voltar ao catálogo.</p>
          <button onClick={() => { try { document.body.style.cssText = ""; } catch (e) {} window.location.href = window.location.pathname; }}
            style={{ padding: "13px 26px", borderRadius: 12, border: "none", background: C.vinho, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }
}

function Vitrine() {
  const [dados, setDados] = useState({ produtos: [], categorias: [], ocasioes: [], zonas: [], loja: {} });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [entrou, setEntrou] = useState(false);
  const [filtro, setFiltro] = useState({ tipo: "tudo", id: null });
  const [indice, setIndice] = useState(0);
  const [cesta, setCesta] = useState(() => { try { return JSON.parse(localStorage.getItem("fl_cesta") || "[]"); } catch { return []; } });
  const [tela, setTela] = useState({});

  useEffect(() => {
    api.loadCatalog().then((d) => { setDados(d); setCarregando(false); }).catch(() => { setErro(true); setCarregando(false); });
    api.logCatalogVisit();   /* conta o acesso, anônimo e sem travar nada */
  }, []);
  useEffect(() => { try { localStorage.setItem("fl_cesta", JSON.stringify(cesta)); } catch {} }, [cesta]);

  useEffect(() => {
    const onPop = (e) => setTela(e.state && e.state.fl ? e.state.tela : {});
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const abrir = (nova) => { window.history.pushState({ fl: 1, tela: nova }, ""); setTela(nova); };
  const fechar = () => window.history.back();

  const lista = useMemo(() => {
    const ps = dados.produtos;
    if (filtro.tipo === "promocao") return ps.filter((p) => emPromocao(p));
    if (filtro.tipo === "ocasiao") return ps.filter((p) => p.occasionIds.includes(filtro.id));
    if (filtro.tipo === "categoria") return ps.filter((p) => p.categoryId === filtro.id);
    return ps;
  }, [dados.produtos, filtro]);

  useEffect(() => { setIndice(0); }, [filtro]);

  const adicionar = (item) => setCesta((c) => [...c, item]);
  const remover = (chave) => setCesta((c) => c.filter((i) => i.chave !== chave));
  const total = cesta.reduce((a, i) => a + (i.onRequest ? 0 : i.total), 0);
  const temConsulta = cesta.some((i) => i.onRequest);

  const enviarWhats = (f) => {
    const tel = String(dados.loja.whatsapp || "").replace(/\D/g, "");
    const itens = cesta.map((i) => `• ${i.quantidade}x ${i.nome}${i.tamanho ? ` (${i.tamanho})` : ""}` +
      (i.onRequest ? " — a combinar" : ` — ${brl(i.total)}`) + (i.promo ? " (promoção)" : "")).join("\n");

    /* Pix no fim da mensagem, só quando o cliente escolhe Pix */
    const pix = (f.pagamento === "Pix" && dados.loja.pixKey)
      ? `\n\n*PIX DA LOJA*\nChave (${dados.loja.pixType || "CNPJ"}): ${dados.loja.pixKey}` +
        (dados.loja.pixName ? `\nEm nome de: ${dados.loja.pixName}` : "") +
        `\n_Confirme o valor total com a loja, faça o Pix e encaminhe o comprovante por aqui._`
      : "";

    const texto =
      `*PEDIDO PELO CATÁLOGO* 🌷\n\n${itens}\n\n` +
      (temConsulta ? `*Subtotal:* ${brl(total)}\n_Itens sob consulta são orçados no atendimento._\n\n` : `*Total dos itens:* ${brl(total)}\n\n`) +
      `*QUEM ESTÁ COMPRANDO*\n${f.nome}\n\n` +
      `*ENTREGA*\n` +
      (f.tipo === "retirada"
        ? `Retirar na loja\n`
        : `Para: ${f.destinatario}\n${f.endereco}\nBairro: ${f.bairro}\n${f.referencia ? `Referência: ${f.referencia}\n` : ""}`) +
      `Data: ${f.data}\nHorário: ${f.horario}\n\n` +
      (f.mensagem ? `*CARTÃO*\n"${f.mensagem}"\n${f.de ? `De: ${f.de}\n` : ""}${f.para ? `Para: ${f.para}\n` : ""}\n` : "") +
      `*PAGAMENTO*\n${f.pagamento}` +
      (f.obs ? `\n\n*OBSERVAÇÕES*\n${f.obs}` : "") + pix;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (!entrou) return <Abertura loja={dados.loja} onEntrar={() => setEntrou(true)} />;

  return (
    <div style={{ fontFamily: FONT, background: C.creme, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>

      <Topo loja={dados.loja} onSacola={() => abrir({ cesta: true })} n={cesta.length} />

      <Filtros dados={dados} filtro={filtro} setFiltro={setFiltro} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {carregando && (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.ink3, gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.linha}`, borderTopColor: C.vinho, animation: "flGira .7s linear infinite" }} />
            Preparando o buquê…
          </div>
        )}
        {erro && <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.vinho, padding: 30, textAlign: "center" }}>Não conseguimos carregar o catálogo agora. Tente de novo em instantes.</div>}
        {!carregando && !erro && lista.length === 0 && (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.ink2, padding: 30, textAlign: "center" }}>
            Nada nesta seleção ainda. Escolha outra ocasião acima.
          </div>
        )}
        {!carregando && !erro && lista.length > 0 && (
          <Album lista={lista} indice={indice} setIndice={setIndice} onAdd={adicionar} loja={dados.loja}
            onAmpliar={(p, i) => abrir({ foto: { id: p.id, i } })} />
        )}
      </main>

      <Rodape loja={dados.loja} />

      {tela.cesta && (
        <Sacola itens={cesta} total={total} temConsulta={temConsulta} onFechar={fechar} onRemover={remover}
          onLimpar={() => setCesta([])} onSeguir={() => { fechar(); setTimeout(() => abrir({ formulario: true }), 240); }} />
      )}
      {tela.formulario && (
        <Formulario dados={dados} onFechar={fechar} onEnviar={(f) => { fechar(); enviarWhats(f); }} />
      )}
      {tela.foto && (() => {
        const p = dados.produtos.find((x) => x.id === tela.foto.id);
        return p && p.photos.length ? <Lupa fotos={p.photos} inicial={tela.foto.i} nome={p.name} onFechar={fechar} /> : null;
      })()}
    </div>
  );
}

/* --------------------------------- Rodapé --------------------------------- */
function Rodape({ loja }) {
  return (
    <footer style={{ borderTop: `1px solid ${C.linha}`, background: C.branco, padding: "18px 16px 22px", textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.vinho }}>
        {loja.storeName || "Flores e Presentes Paixão"}
      </div>
      {loja.address && <div style={{ fontSize: 12.5, color: C.ink2, marginTop: 4 }}>{loja.address}</div>}
      {loja.hours && <div style={{ fontSize: 12.5, color: C.ink3, marginTop: 2 }}>{loja.hours}</div>}
      <div style={{ fontSize: 12, color: C.ink3, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.linha}` }}>
        Programa feito por <strong style={{ color: C.ink2 }}>Miguel Borges</strong> — (34) 9 9188-1557
      </div>
    </footer>
  );
}

/* -------------------------------- Abertura -------------------------------- */
function FotoFundo({ base, visivel }) {
  const [ext, setExt] = useState(".jpg");
  const [sumiu, setSumiu] = useState(false);
  if (sumiu) return null;
  return (
    <img
      src={base + ext}
      alt=""
      onError={() => (ext === ".jpg" ? setExt(".jpeg") : setSumiu(true))}
      style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: visivel ? 0.55 : 0, transition: "opacity 1.4s ease",
      }}
    />
  );
}

function Abertura({ loja, onEntrar }) {
  const [foto, setFoto] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFoto((f) => (f + 1) % ABERTURAS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const petalas = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: Math.random() * 100, atraso: Math.random() * 9, tempo: 9 + Math.random() * 7,
    tam: 8 + Math.random() * 12, op: 0.18 + Math.random() * 0.3, i,
  })), []);

  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", background: `linear-gradient(165deg, ${C.vinhoEsc} 0%, ${C.vinho} 55%, #A82A3E 100%)`, display: "grid", placeItems: "center", position: "relative", overflow: "hidden", padding: 24 }}>
      <style>{CSS}</style>
      {ABERTURAS.map((b, k) => <FotoFundo key={b} base={b} visivel={k === foto} />)}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: `linear-gradient(180deg, rgba(94,16,31,.30), rgba(94,16,31,.62) 55%, rgba(94,16,31,.80))` }} />
      {petalas.map((p) => (
        <span key={p.i} style={{
          position: "absolute", top: "-10%", left: `${p.left}%`, width: p.tam, height: p.tam * 1.25,
          background: C.rosaClaro, opacity: p.op, borderRadius: "50% 0 50% 50%",
          animation: `flPetala ${p.tempo}s linear ${p.atraso}s infinite`,
        }} />
      ))}

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 520 }}>
        <div style={{ display: "inline-block", marginBottom: 26, animation: "flSelo 1s cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ width: 158, height: 158, borderRadius: "50%", overflow: "hidden", background: "#F5EEE3", boxShadow: "0 20px 54px rgba(0,0,0,.34)" }}>
            <img src={LOGO} alt="Flores e Presentes Paixão" onError={(e) => { e.currentTarget.style.display = "none"; }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </div>

        <div style={{ fontSize: 11.5, letterSpacing: 4.5, color: C.rosaClaro, textTransform: "uppercase", fontWeight: 600, animation: "flSobe .8s .3s cubic-bezier(.16,1,.3,1) backwards" }}>
          Seja bem-vindo
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: "#fff", margin: "10px 0 14px", lineHeight: 1.1, animation: "flSobe .8s .45s cubic-bezier(.16,1,.3,1) backwards" }}>
          Flores e Presentes<br />Paixão
        </h1>
        <p style={{ fontSize: 15.5, color: "#F3D9DE", lineHeight: 1.65, margin: "0 0 22px", animation: "flSobe .8s .6s cubic-bezier(.16,1,.3,1) backwards" }}>
          Buquês, cestas e presentes para todas as ocasiões,<br />com entrega em toda Uberlândia.
        </p>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 999, padding: "8px 16px", fontSize: 13, color: "#F9E7EB", marginBottom: 28, animation: "flSobe .8s .68s cubic-bezier(.16,1,.3,1) backwards" }}>
          🛵 A entrega tem taxa, que varia conforme o bairro
        </div>
        <br />

        <button onClick={onEntrar} className="fl-btn"
          style={{ background: "#fff", color: C.vinho, border: "none", borderRadius: 999, padding: "16px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 16px 40px rgba(0,0,0,.3)", animation: "flSobe .8s .75s cubic-bezier(.16,1,.3,1) backwards" }}>
          Ver o catálogo
        </button>

        {loja.hours && (
          <div style={{ fontSize: 12.5, color: "#E3B9C1", marginTop: 26, animation: "flSobe .8s .9s ease backwards" }}>{loja.hours}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Topo ---------------------------------- */
function Topo({ loja, onSacola, n }) {
  return (
    <header style={{ background: "rgba(253,247,244,.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.linha}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 11, position: "sticky", top: 0, zIndex: 40 }}>
      <img src={LOGO} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
        style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: "#F5EEE3" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, lineHeight: 1.1 }}>Paixão</div>
        <div style={{ fontSize: 11, color: C.ink3 }}>Flores e Presentes</div>
      </div>
      <button onClick={onSacola} className="fl-btn"
        style={{ display: "flex", alignItems: "center", gap: 8, background: C.vinho, color: "#fff", border: "none", borderRadius: 999, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Sacola
        <span style={{ background: "rgba(255,255,255,.22)", borderRadius: 999, minWidth: 22, padding: "1px 7px", fontSize: 13 }}>{n}</span>
      </button>
    </header>
  );
}

/* -------------------------------- Filtros --------------------------------- */
function Filtros({ dados, filtro, setFiltro }) {
  const temPromo = dados.produtos.some((p) => emPromocao(p));
  const iguais = (t, id) => filtro.tipo === t && filtro.id === id;
  const botao = (chave, texto, t, id, destaque) => {
    const on = t === "tudo" ? filtro.tipo === "tudo" : iguais(t, id);
    const fundo = on ? (destaque ? C.rosa : C.vinho) : destaque ? C.rosaSoft : "#fff";
    return (
      <button key={chave} onClick={() => setFiltro({ tipo: t, id })} className="fl-btn"
        style={{ flexShrink: 0, padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: on || destaque ? 700 : 500, cursor: "pointer", border: `1px solid ${on ? "transparent" : destaque ? C.rosaClaro : C.linha}`, background: fundo, color: on ? "#fff" : destaque ? C.rosa : C.ink2 }}>
        {texto}
      </button>
    );
  };
  return (
    <div style={{ borderBottom: `1px solid ${C.linha}`, background: C.creme }}>
      <div className="fl-x" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "11px 16px" }}>
        {botao("tudo", "Tudo", "tudo", null)}
        {temPromo && botao("promo", "🔥 Promoções", "promocao", null, true)}
        {dados.ocasioes.map((o) => botao("o" + o.id, `${o.emoji || ""} ${o.name}`.trim(), "ocasiao", o.id))}
        {dados.categorias.map((c) => botao("c" + c.id, `${c.emoji || ""} ${c.name}`.trim(), "categoria", c.id))}
      </div>
    </div>
  );
}

/* --------------------------- Álbum que passa de lado ---------------------- */
function Album({ lista, indice, setIndice, onAdd, loja, onAmpliar }) {
  const toque = useRef(null);
  const i = Math.min(indice, lista.length - 1);
  const p = lista[i];

  const vai = (d) => setIndice((k) => Math.min(Math.max(k + d, 0), lista.length - 1));

  useEffect(() => {
    const tecla = (e) => { if (e.key === "ArrowRight") vai(1); if (e.key === "ArrowLeft") vai(-1); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [lista.length]);

  return (
    <div
      onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (toque.current == null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        if (Math.abs(dx) > 45) vai(dx < 0 ? 1 : -1);
        toque.current = null;
      }}
      style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: "14px 16px 22px", maxWidth: 560, width: "100%", margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: C.ink3 }}>{i + 1} de {lista.length}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {lista.slice(0, 14).map((_, k) => (
            <span key={k} onClick={() => setIndice(k)} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 99, background: k === i ? C.vinho : C.linha, cursor: "pointer", transition: "width .2s ease, background .2s ease" }} />
          ))}
        </div>
      </div>

      <Ficha key={p.id} p={p} onAdd={onAdd} loja={loja} onAmpliar={onAmpliar} />

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => vai(-1)} disabled={i === 0} className="fl-btn" aria-label="Anterior"
          style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${C.linha}`, background: "#fff", color: i === 0 ? C.ink3 : C.vinho, fontSize: 20, cursor: i === 0 ? "not-allowed" : "pointer", opacity: i === 0 ? 0.45 : 1, flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1, display: "grid", placeItems: "center", fontSize: 12.5, color: C.ink3 }}>
          arraste para o lado
        </div>
        <button onClick={() => vai(1)} disabled={i >= lista.length - 1} className="fl-btn" aria-label="Próximo"
          style={{ width: 52, height: 52, borderRadius: "50%", border: "none", background: i >= lista.length - 1 ? C.linha : C.vinho, color: "#fff", fontSize: 20, cursor: i >= lista.length - 1 ? "not-allowed" : "pointer", flexShrink: 0 }}>›</button>
      </div>
    </div>
  );
}

/* Botão de conversa direta com a loja, embaixo de cada produto */
function BotaoConsulta({ onClick, children }) {
  return (
    <button onClick={onClick} className="fl-btn"
      style={{ padding: "11px 10px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, lineHeight: 1.25, border: `1px solid ${C.linha}`, background: "#fff", color: C.vinho, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
      {children}
    </button>
  );
}

function Ficha({ p, onAdd, loja, onAmpliar }) {
  const [tam, setTam] = useState(p.sizes[0]?.name || "");
  const [qtd, setQtd] = useState(1);
  const [foto, setFoto] = useState(0);
  const [posto, setPosto] = useState(false);
  const fotos = p.photos.length ? p.photos : [null];

  const promo = emPromocao(p);
  const preco = precoVigente(p, tam);
  const total = preco * (Number(qtd) || 1);

  const adicionar = () => {
    onAdd({
      chave: `${p.id}_${Date.now()}`, id: p.id, nome: p.name, tamanho: tam,
      quantidade: Number(qtd) || 1, preco, total, onRequest: p.onRequest, promo,
    });
    setPosto(true);
    setTimeout(() => setPosto(false), 1600);
  };

  const verMais = () => abrirWhats(loja.whatsapp,
    `Olá! Estou vendo o catálogo e gostaria de ver mais opções de *${p.category || "presentes"}*. 🌷`);

  const consultarValor = () => abrirWhats(loja.whatsapp,
    `Olá! Gostaria de consultar o valor de *${p.name}*${p.sku ? ` (cód. ${p.sku})` : ""}.` +
    (p.onRequest ? "\nSei que esse item é montado conforme o pedido." : ""));

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "#fff", border: `1px solid ${C.linha}`, borderRadius: 22, overflow: "hidden", boxShadow: "0 10px 34px rgba(58,42,46,.09)", animation: "flEntra .4s cubic-bezier(.16,1,.3,1) both" }}>
      <div onClick={() => { if (fotos[foto] && onAmpliar) onAmpliar(p, foto); }}
        style={{ position: "relative", width: "100%", paddingTop: "78%", background: `linear-gradient(145deg, ${C.rosaSoft}, ${C.creme2})`, flexShrink: 0, cursor: fotos[foto] ? "zoom-in" : "default" }}>
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {fotos[foto]
            ? <img src={fotos[foto]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <span style={{ fontFamily: SERIF, fontSize: 19, color: C.rosa }}>Paixão</span>}
        </div>
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          {promo && (
            <span style={{ background: C.rosa, color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>🔥 Promoção</span>
          )}
          {p.onRequest && (
            <span style={{ background: "rgba(142,27,46,.9)", color: "#fff", fontSize: 11.5, fontWeight: 600, padding: "5px 11px", borderRadius: 999 }}>Sob consulta</span>
          )}
        </div>
        {fotos[foto] && (
          <span style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(58,42,46,.62)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "7px 13px", borderRadius: 999, backdropFilter: "blur(4px)" }}>
            ⌕ Ampliar
          </span>
        )}
        {fotos.length > 1 && (
          <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 5 }}>
            {fotos.map((_, k) => (
              <span key={k} onClick={(e) => { e.stopPropagation(); setFoto(k); }}
                style={{ width: 7, height: 7, borderRadius: "50%", cursor: "pointer", background: k === foto ? "#fff" : "rgba(255,255,255,.5)" }} />
            ))}
          </div>
        )}
      </div>

      <div className="fl-x" style={{ flex: 1, overflowY: "auto", padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{p.name}</h2>
          {p.description && <p style={{ fontSize: 13.5, color: C.ink2, margin: "7px 0 0", lineHeight: 1.55 }}>{p.description}</p>}
        </div>

        {p.onRequest ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: C.vinho }}>Sob consulta</span>
            {p.price > 0 && <span style={{ fontSize: 14, color: C.ink2, fontWeight: 600 }}>a partir de {brl(p.price)}</span>}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
            {p.priceFrom && <span style={{ fontSize: 12.5, color: C.ink3 }}>a partir de</span>}
            {promo && <span style={{ fontSize: 16, color: C.ink3, textDecoration: "line-through" }}>{brl(p.price)}</span>}
            <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: promo ? C.rosa : C.vinho }}>{brl(preco)}</span>
          </div>
        )}

        {p.sizes.length > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink2, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Tamanho</div>
            <div style={{ display: "flex", gap: 7 }}>
              {p.sizes.map((s) => {
                const on = tam === s.name;
                return (
                  <button key={s.id} onClick={() => setTam(s.name)} className="fl-btn"
                    style={{ flex: 1, padding: "10px 6px", borderRadius: 12, cursor: "pointer", border: `1px solid ${on ? C.vinho : C.linha}`, background: on ? C.rosaSoft : "#fff", color: C.ink }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: on ? C.vinho : C.ink3 }}>{brl(s.price)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.linha}`, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
            <button onClick={() => setQtd((q) => Math.max(1, q - 1))} className="fl-btn"
              style={{ width: 42, height: 44, border: "none", background: "#fff", fontSize: 19, cursor: "pointer", color: C.ink2 }}>−</button>
            <span style={{ width: 38, textAlign: "center", fontSize: 15, fontWeight: 700 }}>{qtd}</span>
            <button onClick={() => setQtd((q) => q + 1)} className="fl-btn"
              style={{ width: 42, height: 44, border: "none", background: "#fff", fontSize: 19, cursor: "pointer", color: C.ink2 }}>+</button>
          </div>
          {!p.onRequest && (
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: 11.5, color: C.ink3 }}>Total</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{brl(total)}</div>
            </div>
          )}
        </div>

        <button onClick={adicionar} className="fl-btn"
          style={{ width: "100%", padding: "14px", borderRadius: 13, border: "none", background: posto ? C.ok : C.vinho, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          {posto ? "✓ Na sacola" : "Adicionar à sacola"}
        </button>

        {/* Falar com a loja: mais opções do mesmo tipo e consulta de valor */}
        <div style={{ display: "grid", gridTemplateColumns: p.showQuote === false ? "1fr" : "1fr 1fr", gap: 8 }}>
          <BotaoConsulta onClick={verMais}>💬 Ver mais desse tipo</BotaoConsulta>
          {p.showQuote !== false && <BotaoConsulta onClick={consultarValor}>💬 Consultar valores</BotaoConsulta>}
        </div>
        <div style={{ fontSize: 11.5, color: C.ink3, textAlign: "center", marginTop: -4 }}>
          Fale direto com a loja pelo WhatsApp
        </div>
      </div>
    </div>
  );
}

/* -------------------- Foto em tela cheia, com ampliação ------------------- */
/* Simples de propósito: um único nível de ampliação, usando a rolagem do
   próprio navegador. Sem pinça e sem transformação — é o que funciona igual
   no iPhone, no Android e no computador.                                    */
function Lupa({ fotos, inicial = 0, nome, onFechar }) {
  const [i, setI] = useState(Math.min(inicial || 0, fotos.length - 1));
  const [ampliado, setAmpliado] = useState(false);
  const area = useRef(null);

  /* trava a página atrás e desliga o zoom do próprio navegador */
  useEffect(() => {
    const corpo = document.body;
    const antes = { overflow: corpo.style.overflow, position: corpo.style.position, width: corpo.style.width, top: corpo.style.top };
    const rolagem = window.scrollY;
    corpo.style.overflow = "hidden";
    corpo.style.position = "fixed";
    corpo.style.width = "100%";
    corpo.style.top = `-${rolagem}px`;

    const barra = (e) => e.preventDefault();
    document.addEventListener("gesturestart", barra, { passive: false });
    document.addEventListener("gesturechange", barra, { passive: false });
    document.addEventListener("gestureend", barra, { passive: false });

    return () => {
      corpo.style.overflow = antes.overflow;
      corpo.style.position = antes.position;
      corpo.style.width = antes.width;
      corpo.style.top = antes.top;
      window.scrollTo(0, rolagem);
      document.removeEventListener("gesturestart", barra);
      document.removeEventListener("gesturechange", barra);
      document.removeEventListener("gestureend", barra);
    };
  }, []);

  /* ao ampliar, começa mostrando o meio da foto */
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    if (ampliado) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    } else { el.scrollLeft = 0; el.scrollTop = 0; }
  }, [ampliado, i]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowRight") trocar(1);
      if (e.key === "ArrowLeft") trocar(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }); // eslint-disable-line

  const trocar = (d) => { setAmpliado(false); setI((k) => (k + d + fotos.length) % fotos.length); };

  const redondo = { width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(255,255,255,.28)", background: "rgba(0,0,0,.48)", color: "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 };

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, height: "100dvh", zIndex: 100, background: "#241017", animation: "flFade .22s ease both" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "linear-gradient(180deg,rgba(0,0,0,.55),transparent)" }}>
        <button onClick={onFechar} aria-label="Voltar" className="fl-btn" style={redondo}>←</button>
        <div style={{ color: "#fff", fontSize: 14.5, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nome}</div>
        {fotos.length > 1 && <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>{i + 1}/{fotos.length}</div>}
      </div>

      <div ref={area}
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
          overflow: ampliado ? "auto" : "hidden", WebkitOverflowScrolling: "touch",
          display: ampliado ? "block" : "flex", alignItems: "center", justifyContent: "center",
        }}>
        <img src={fotos[i]} alt={nome} draggable={false} onDragStart={(e) => e.preventDefault()}
          style={ampliado
            ? { width: "220%", maxWidth: "none", display: "block", userSelect: "none", WebkitUserSelect: "none" }
            : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", userSelect: "none", WebkitUserSelect: "none" }} />
      </div>

      <div style={{ position: "absolute", bottom: 22, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "0 14px" }}>
        {fotos.length > 1 && <button onClick={() => trocar(-1)} aria-label="Foto anterior" className="fl-btn" style={redondo}>‹</button>}
        <button onClick={() => setAmpliado((v) => !v)} className="fl-btn"
          style={{ ...redondo, width: "auto", borderRadius: 999, padding: "0 20px", fontSize: 15, fontWeight: 700, gap: 8 }}>
          {ampliado ? "Reduzir" : "⌕ Ampliar"}
        </button>
        {fotos.length > 1 && <button onClick={() => trocar(1)} aria-label="Próxima foto" className="fl-btn" style={redondo}>›</button>}
      </div>

      {ampliado && (
        <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,.55)", fontSize: 12.5, pointerEvents: "none" }}>
          Arraste para ver os detalhes
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Folha deslizante ---------------------------- */
function Folha({ titulo, sub, children, onFechar, rodape }) {
  return (
    <div onClick={onFechar} style={{ position: "fixed", inset: 0, background: "rgba(58,42,46,.5)", zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(3px)", animation: "flFade .2s ease both" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", borderRadius: "24px 24px 0 0", animation: "flSobe .3s cubic-bezier(.16,1,.3,1) both", boxShadow: "0 -10px 50px rgba(58,42,46,.22)" }}>
        <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 2, padding: "18px 20px 14px", borderBottom: `1px solid ${C.linha}`, borderRadius: "24px 24px 0 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, fontWeight: 600 }}>{titulo}</h3>
              {sub && <div style={{ fontSize: 13, color: C.ink2, marginTop: 3 }}>{sub}</div>}
            </div>
            <button onClick={onFechar} aria-label="Fechar" className="fl-btn"
              style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: C.creme2, color: C.ink2, fontSize: 19, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>
        <div style={{ padding: "18px 20px 22px" }}>{children}</div>
        {rodape && <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: `1px solid ${C.linha}`, padding: "14px 20px" }}>{rodape}</div>}
      </div>
    </div>
  );
}

/* --------------------------------- Sacola --------------------------------- */
function Sacola({ itens, total, temConsulta, onFechar, onRemover, onLimpar, onSeguir }) {
  return (
    <Folha titulo="Sua sacola" sub={`${itens.length} item(ns)`} onFechar={onFechar}
      rodape={itens.length > 0 && (
        <>
          <button onClick={onSeguir} className="fl-btn"
            style={{ width: "100%", padding: 15, borderRadius: 13, border: "none", background: C.vinho, color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}>
            Continuar
          </button>
          <button onClick={onLimpar} className="fl-btn"
            style={{ width: "100%", padding: 11, marginTop: 8, borderRadius: 11, border: `1px solid ${C.linha}`, background: "#fff", color: C.ink3, fontSize: 13, cursor: "pointer" }}>
            Esvaziar
          </button>
        </>
      )}>
      {itens.length === 0 ? (
        <div style={{ textAlign: "center", color: C.ink3, padding: "36px 0", fontSize: 14.5 }}>
          Sua sacola está vazia.<br />Escolha as flores que mais combinam. 🌷
        </div>
      ) : (
        <>
          {itens.map((i) => (
            <div key={i.chave} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${C.linha}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                  {i.nome}
                  {i.promo && <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 700, color: C.rosa, background: C.rosaSoft, borderRadius: 999, padding: "2px 8px" }}>promoção</span>}
                </div>
                <div style={{ fontSize: 13, color: C.ink2, marginTop: 3 }}>
                  {i.quantidade}x{i.tamanho ? ` · ${i.tamanho}` : ""}{!i.onRequest ? ` · ${brl(i.preco)} cada` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{i.onRequest ? "A combinar" : brl(i.total)}</div>
                <button onClick={() => onRemover(i.chave)} className="fl-btn"
                  style={{ border: "none", background: "none", color: C.vinho, fontSize: 12.5, cursor: "pointer", padding: "4px 0" }}>remover</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 }}>
            <span style={{ fontSize: 15, color: C.ink2 }}>{temConsulta ? "Subtotal" : "Total dos itens"}</span>
            <span style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 600 }}>{brl(total)}</span>
          </div>
          <div style={{ background: C.rosaSoft, borderRadius: 12, padding: "11px 13px", fontSize: 13, color: C.ink2, marginTop: 10, lineHeight: 1.55 }}>
            A taxa de entrega é calculada pelo bairro e informada no atendimento.
            {temConsulta && " Itens sob consulta também são orçados por lá."}
          </div>
        </>
      )}
    </Folha>
  );
}

/* ------------------------- Formulário do pedido --------------------------- */
function Formulario({ dados, onFechar, onEnviar }) {
  const amanha = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
  const [f, setF] = useState({
    nome: "", tipo: "entrega", destinatario: "", endereco: "", bairro: "", referencia: "",
    data: amanha, horario: "Manhã (8h às 12h)", mensagem: "", de: "", para: "", pagamento: "", obs: "",
  });
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(String(dados.loja.pixKey || ""));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch (e) { setCopiado(false); }
  };

  const enviar = () => {
    const falta = [];
    if (!f.nome.trim()) falta.push("seu nome");
    if (f.tipo === "entrega") {
      if (!f.destinatario.trim()) falta.push("quem vai receber");
      if (!f.endereco.trim()) falta.push("o endereço");
      if (!f.bairro.trim()) falta.push("o bairro");
    }
    if (!f.pagamento) falta.push("a forma de pagamento");
    if (falta.length) { setErro(`Falta preencher: ${falta.join(", ")}.`); return; }
    setErro("");
    onEnviar(f);
  };

  const Opcao = ({ v, label, campo }) => {
    const on = f[campo] === v;
    return (
      <button onClick={() => set(campo, v)} className="fl-btn"
        style={{ flex: 1, padding: "12px 8px", borderRadius: 12, cursor: "pointer", fontSize: 13.5, fontWeight: 600, border: `1px solid ${on ? C.vinho : C.linha}`, background: on ? C.rosaSoft : "#fff", color: on ? C.vinho : C.ink2 }}>
        {label}
      </button>
    );
  };

  return (
    <Folha titulo="Falta pouco" sub="Para quem, quando e onde entregar" onFechar={onFechar}
      rodape={
        <button onClick={enviar} className="fl-btn"
          style={{ width: "100%", padding: 15, borderRadius: 13, border: "none", background: C.zap, color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(37,211,102,.3)" }}>
          Enviar pedido pelo WhatsApp
        </button>
      }>

      <Pergunta n="1" titulo="Qual o seu nome?" dica="De quem está fazendo o pedido.">
        <input className="fl-in" style={entradaEstilo} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Marcos Vieira" />
      </Pergunta>

      <Pergunta n="2" titulo="Entregar ou retirar?">
        <div style={{ display: "flex", gap: 8 }}>
          <Opcao v="entrega" label="🛵 Entregar" campo="tipo" />
          <Opcao v="retirada" label="🏬 Retirar na loja" campo="tipo" />
        </div>
      </Pergunta>

      {f.tipo === "entrega" && (
        <>
          <Pergunta n="3" titulo="Quem vai receber?" dica="Nome de quem recebe as flores.">
            <input className="fl-in" style={entradaEstilo} value={f.destinatario} onChange={(e) => set("destinatario", e.target.value)} placeholder="Ex.: Maria Vieira" />
          </Pergunta>

          <Pergunta n="4" titulo="Endereço" dica="Rua, número e complemento.">
            <input className="fl-in" style={entradaEstilo} value={f.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Ex.: Rua das Acácias, 120, apto 302" />
          </Pergunta>

          <Pergunta n="5" titulo="Bairro" dica="A entrega tem taxa, que varia conforme o bairro.">
            {dados.zonas.length > 0 ? (
              <select className="fl-in" style={entradaEstilo} value={f.bairro} onChange={(e) => set("bairro", e.target.value)}>
                <option value="">— escolha —</option>
                {dados.zonas.map((z) => <option key={z.name} value={z.name}>{z.name} — entrega {brl(z.fee)}</option>)}
                <option value="Outro bairro">Outro bairro (consultar)</option>
              </select>
            ) : (
              <input className="fl-in" style={entradaEstilo} value={f.bairro} onChange={(e) => set("bairro", e.target.value)} placeholder="Ex.: Santa Mônica" />
            )}
          </Pergunta>

          <Pergunta n="6" titulo="Ponto de referência" dica="Opcional, ajuda o entregador." opcional>
            <input className="fl-in" style={entradaEstilo} value={f.referencia} onChange={(e) => set("referencia", e.target.value)} placeholder="Ex.: prédio ao lado da padaria" />
          </Pergunta>
        </>
      )}

      <Pergunta n={f.tipo === "entrega" ? "7" : "3"} titulo="Quando?">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="fl-in" type="date" style={entradaEstilo} value={f.data} onChange={(e) => set("data", e.target.value)} />
          <select className="fl-in" style={entradaEstilo} value={f.horario} onChange={(e) => set("horario", e.target.value)}>
            {["Manhã (8h às 12h)", "Tarde (12h às 18h)", "Horário combinado"].map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
      </Pergunta>

      <Pergunta n={f.tipo === "entrega" ? "8" : "4"} titulo="Mensagem do cartão" dica={dados.loja.cardNote || "Vai impressa junto com o presente."} opcional>
        <textarea className="fl-in" style={{ ...entradaEstilo, minHeight: 84, resize: "vertical" }} value={f.mensagem} onChange={(e) => set("mensagem", e.target.value)}
          placeholder="Ex.: Feliz aniversário! Que seu dia seja tão lindo quanto você." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <input className="fl-in" style={entradaEstilo} value={f.para} onChange={(e) => set("para", e.target.value)} placeholder="Para (nome)" />
          <input className="fl-in" style={entradaEstilo} value={f.de} onChange={(e) => set("de", e.target.value)} placeholder="De (nome)" />
        </div>
      </Pergunta>

      <Pergunta n={f.tipo === "entrega" ? "9" : "5"} titulo="Como prefere pagar?" dica={dados.loja.paymentNote}>
        <div style={{ display: "grid", gap: 8 }}>
          {["Pix", "Dinheiro na entrega", "Cartão de débito", "Cartão de crédito"].map((m) => {
            const on = f.pagamento === m;
            return (
              <button key={m} onClick={() => set("pagamento", m)} className="fl-btn"
                style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "13px 14px", borderRadius: 13, cursor: "pointer", border: `1px solid ${on ? C.vinho : C.linha}`, background: on ? C.rosaSoft : "#fff" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${on ? C.vinho : C.linha}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.vinho }} />}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{m}</span>
              </button>
            );
          })}
        </div>

        {f.pagamento === "Pix" && dados.loja.pixKey && (
          <div style={{ background: C.rosaSoft, border: `1px solid ${C.linha}`, borderRadius: 13, padding: "13px 14px", marginTop: 10 }}>
            <div style={{ fontSize: 12, color: C.ink2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Chave Pix ({dados.loja.pixType || "CNPJ"})
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, margin: "5px 0 4px", wordBreak: "break-all", color: C.ink }}>
              {dados.loja.pixKey}
            </div>
            {dados.loja.pixName && <div style={{ fontSize: 12.5, color: C.ink2 }}>Em nome de {dados.loja.pixName}</div>}
            <button onClick={copiarPix} className="fl-btn"
              style={{ marginTop: 10, padding: "10px 16px", borderRadius: 11, border: "none", background: copiado ? C.ok : C.vinho, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              {copiado ? "✓ Chave copiada" : "Copiar chave Pix"}
            </button>
            <div style={{ fontSize: 12, color: C.ink3, marginTop: 9, lineHeight: 1.5 }}>
              A chave também vai no fim da mensagem do WhatsApp. Confirme o valor total com a loja, faça o Pix e encaminhe o comprovante.
            </div>
          </div>
        )}
      </Pergunta>

      <Pergunta n={f.tipo === "entrega" ? "10" : "6"} titulo="Quer acrescentar algo?" opcional>
        <textarea className="fl-in" style={{ ...entradaEstilo, minHeight: 70, resize: "vertical" }} value={f.obs} onChange={(e) => set("obs", e.target.value)}
          placeholder="Ex.: não avisar antes, é surpresa" />
      </Pergunta>

      {erro && <div style={{ background: "#FDECEC", color: "#C53030", borderRadius: 12, padding: "11px 13px", fontSize: 13.5, fontWeight: 500 }}>{erro}</div>}
    </Folha>
  );
}

function Pergunta({ n, titulo, dica, children, opcional }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: C.vinho, color: "#fff", fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>{n}</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{titulo}</span>
        {opcional && <span style={{ fontSize: 11.5, color: C.ink3 }}>opcional</span>}
      </div>
      {dica && <div style={{ fontSize: 12.5, color: C.ink3, margin: "0 0 8px 31px" }}>{dica}</div>}
      <div style={{ marginLeft: 31 }}>{children}</div>
    </div>
  );
}
