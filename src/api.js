/* ===========================================================================
   FLORES E PRESENTES PAIXÃO — Conversa com o Supabase
   Todo acesso ao banco passa por aqui. As telas nunca falam direto.
   =========================================================================== */
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const erro = (e) => { throw new Error(e.message || "Algo deu errado. Tente de novo."); };

/* --------------------------------- Acesso --------------------------------- */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) erro(error);
  return data.user;
}
export async function signOut() { await supabase.auth.signOut(); }
export function onAuthChange(cb) { return supabase.auth.onAuthStateChange((_e, s) => cb(s)); }
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email, name: data?.name || user.email, role: data?.role || "func" };
}

/* ------------------------------- Cadastros -------------------------------- */
export async function loadMeta() {
  const [cat, oca, zon, sts, cli, cfg, usr] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("occasions").select("*").order("sort_order"),
    supabase.from("delivery_zones").select("*").order("sort_order").order("name"),
    supabase.from("order_status").select("*").order("sort_order"),
    supabase.from("customers").select("*").order("name"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("profiles").select("*").order("email"),
  ]);
  const s = cfg.data || {};
  return {
    categories: cat.data || [],
    occasions: oca.data || [],
    zones: (zon.data || []).map((z) => ({ id: z.id, name: z.name, fee: Number(z.fee) || 0, note: z.note || "" })),
    statuses: sts.data || [],
    customers: cli.data || [],
    users: usr.data || [],
    settings: {
      storeName: s.store_name || "Flores e Presentes Paixão",
      whatsapp: s.whatsapp || "",
      instagram: s.instagram || "",
      address: s.address || "",
      hours: s.hours || "",
      pixKey: s.pix_key || "",
      pixName: s.pix_name || "",
      pixType: s.pix_type || "CNPJ",
      paymentNote: s.payment_note || "",
      cardNote: s.card_note || "",
    },
  };
}

const simples = (tabela) => ({
  add: async (dados) => { const { error } = await supabase.from(tabela).insert(dados); if (error) erro(error); },
  remove: async (id) => { const { error } = await supabase.from(tabela).delete().eq("id", id); if (error) erro(error); },
});

export const addCategory = (name, emoji) => simples("categories").add({ name, emoji: emoji || null });
export const removeCategory = (id) => simples("categories").remove(id);
export const addOccasion = (name, emoji) => simples("occasions").add({ name, emoji: emoji || null });
export const removeOccasion = (id) => simples("occasions").remove(id);
export const removeZone = (id) => simples("delivery_zones").remove(id);
export const addStatus = (name) => simples("order_status").add({ name, sort_order: 99 });
export const removeStatus = (id) => simples("order_status").remove(id);

export async function saveZone(z) {
  const base = { name: z.name, fee: Number(z.fee) || 0, note: z.note || null };
  if (z.id) { const { error } = await supabase.from("delivery_zones").update(base).eq("id", z.id); if (error) erro(error); return z.id; }
  const { data, error } = await supabase.from("delivery_zones").insert(base).select().single();
  if (error) erro(error);
  return data.id;
}

export async function saveSettings(s) {
  const { error } = await supabase.from("settings").update({
    store_name: s.storeName, whatsapp: s.whatsapp, instagram: s.instagram,
    address: s.address, hours: s.hours, pix_key: s.pixKey, pix_name: s.pixName,
    pix_type: s.pixType || "CNPJ",
    payment_note: s.paymentNote, card_note: s.cardNote,
  }).eq("id", 1);
  if (error) erro(error);
}

export async function setUserRole(id, role) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) erro(error);
}

/* -------------------------------- Clientes -------------------------------- */
const limpaCliente = (c) => ({
  name: c.name, phone: c.phone || null, email: c.email || null,
  birthday: c.birthday || null, notes: c.notes || null,
});
export async function addCustomer(c) {
  const { data, error } = await supabase.from("customers").insert(limpaCliente(c)).select().single();
  if (error) erro(error);
  return data;
}
export async function updateCustomer(id, c) {
  const { error } = await supabase.from("customers").update(limpaCliente(c)).eq("id", id);
  if (error) erro(error);
}
export async function removeCustomer(id) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) erro(error);
}

/* -------------------------------- Produtos -------------------------------- */
function montaProduto(p) {
  const fotos = (p.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => i.image_url);
  return {
    id: p.id, name: p.name, sku: p.sku || "", categoryId: p.category_id,
    description: p.description || "", price: Number(p.price) || 0,
    onRequest: !!p.on_request, priceFrom: !!p.price_from, madeToOrder: !!p.made_to_order,
    promoPrice: p.promo_price == null || p.promo_price === "" ? null : Number(p.promo_price),
    showQuote: p.show_quote !== false,
    leadHours: p.lead_hours, trackStock: !!p.track_stock, stock: p.stock_qty || 0,
    active: p.active !== false,
    mainImage: p.main_image_url, gallery: fotos,
    photos: [p.main_image_url, ...fotos].filter(Boolean),
    sizes: (p.product_sizes || []).slice().sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ id: s.id, name: s.name, price: Number(s.price) || 0 })),
    occasionIds: (p.product_occasions || []).map((o) => o.occasion_id),
    createdAt: p.created_at,
  };
}

export async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_sizes(*), product_occasions(occasion_id)")
    .eq("deleted", false).order("name");
  if (error) erro(error);
  return (data || []).map(montaProduto);
}

export async function nextSku(prefixo = "PX") {
  const { data } = await supabase.from("products").select("sku");
  let maior = 0;
  (data || []).forEach((p) => {
    const m = String(p.sku || "").match(/^([A-Za-z]+)[-\s]?(\d+)$/);
    if (m && m[1].toUpperCase() === prefixo.toUpperCase()) maior = Math.max(maior, parseInt(m[2], 10));
  });
  return `${prefixo.toUpperCase()}-${String(maior + 1).padStart(3, "0")}`;
}

export async function skuExists(sku, ignoreId) {
  if (!sku) return false;
  let q = supabase.from("products").select("id").eq("sku", sku).eq("deleted", false);
  if (ignoreId) q = q.neq("id", ignoreId);
  const { data } = await q;
  return (data || []).length > 0;
}

export async function saveProduct(f) {
  const base = {
    name: f.name, sku: f.sku || null, category_id: f.categoryId || null,
    description: f.description || null, price: Number(f.price) || 0,
    on_request: !!f.onRequest, price_from: !!f.priceFrom, made_to_order: !!f.madeToOrder,
    lead_hours: f.leadHours ? Number(f.leadHours) : null,
    track_stock: !!f.trackStock, stock_qty: Number(f.stock) || 0,
    main_image_url: f.mainImage || null, active: f.active !== false,
    promo_price: f.promoPrice === "" || f.promoPrice == null ? null : Number(f.promoPrice),
    show_quote: f.showQuote !== false,
  };
  let id = f.id;
  if (id) {
    const { error } = await supabase.from("products").update(base).eq("id", id);
    if (error) erro(error);
  } else {
    const { data, error } = await supabase.from("products").insert(base).select().single();
    if (error) erro(error);
    id = data.id;
  }

  await supabase.from("product_images").delete().eq("product_id", id);
  const fotos = (f.gallery || []).filter(Boolean).map((url, i) => ({ product_id: id, image_url: url, sort_order: i }));
  if (fotos.length) await supabase.from("product_images").insert(fotos);

  await supabase.from("product_sizes").delete().eq("product_id", id);
  const tams = (f.sizes || []).filter((s) => s.name)
    .map((s, i) => ({ product_id: id, name: s.name, price: Number(s.price) || 0, sort_order: i }));
  if (tams.length) await supabase.from("product_sizes").insert(tams);

  await supabase.from("product_occasions").delete().eq("product_id", id);
  const ocas = (f.occasionIds || []).map((o) => ({ product_id: id, occasion_id: o }));
  if (ocas.length) await supabase.from("product_occasions").insert(ocas);

  return id;
}

/* Promoção: guardada num campo separado, para o preço de tabela nunca se perder.
   Tirar da promoção é apagar esse campo — o produto volta ao valor cadastrado. */
export async function setPromo(id, preco) {
  const valor = Number(preco);
  if (!valor || valor <= 0) erro({ message: "Informe um valor de promoção maior que zero." });
  const { error } = await supabase.from("products").update({ promo_price: valor }).eq("id", id);
  if (error) erro(error);
}

export async function clearPromo(id) {
  const { error } = await supabase.from("products").update({ promo_price: null }).eq("id", id);
  if (error) erro(error);
}

export async function softDeleteProduct(id) {
  const { error } = await supabase.from("products").update({ deleted: true }).eq("id", id);
  if (error) erro(error);
}

export async function uploadFile(file, pasta = "produtos") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const nome = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("paixao").upload(nome, file, { cacheControl: "3600" });
  if (error) erro(error);
  const { data } = supabase.storage.from("paixao").getPublicUrl(nome);
  return data.publicUrl;
}

/* --------------------------------- Pedidos -------------------------------- */
function montaPedido(o) {
  const itens = (o.order_items || []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => ({
    id: i.id, productId: i.product_id, description: i.description, sizeName: i.size_name || "",
    quantity: Number(i.quantity) || 0, unitPrice: Number(i.unit_price) || 0, total: Number(i.total) || 0,
  }));
  return {
    id: o.id, number: o.number,
    statusId: o.status_id, statusName: o.order_status?.name || "",
    statusColor: o.order_status?.color || "#8E1B2E", statusFinal: !!o.order_status?.is_final,
    customerId: o.customer_id,
    buyerName: o.buyer_name || o.customers?.name || "", buyerPhone: o.buyer_phone || o.customers?.phone || "",
    recipientName: o.recipient_name || "", recipientPhone: o.recipient_phone || "",
    deliveryType: o.delivery_type || "entrega",
    street: o.street || "", numberAddr: o.number_addr || "", complement: o.complement || "",
    zoneId: o.zone_id, neighborhood: o.neighborhood || o.delivery_zones?.name || "",
    city: o.city || "", reference: o.reference || "",
    deliveryDate: o.delivery_date, deliveryWindow: o.delivery_window || "", urgent: !!o.urgent,
    cardMessage: o.card_message || "", cardFrom: o.card_from || "", cardTo: o.card_to || "",
    itemsTotal: Number(o.items_total) || 0, deliveryFee: Number(o.delivery_fee) || 0,
    discount: Number(o.discount) || 0, total: Number(o.total) || 0,
    paymentMethod: o.payment_method || "", paid: !!o.paid,
    notes: o.notes || "", canceled: !!o.canceled, userName: o.user_name,
    createdAt: o.created_at, items: itens,
  };
}

const SELECT_PEDIDO = "*, customers(name, phone), order_status(name, color, is_final), delivery_zones(name), order_items(*)";

export async function loadOrders({ limite = 300 } = {}) {
  const { data, error } = await supabase.from("orders").select(SELECT_PEDIDO)
    .order("number", { ascending: false }).limit(limite);
  if (error) erro(error);
  return (data || []).map(montaPedido);
}

export async function loadOrderHistory(id) {
  const { data, error } = await supabase.from("order_history").select("*")
    .eq("order_id", id).order("created_at", { ascending: false });
  if (error) erro(error);
  return (data || []).map((h) => ({
    id: h.id, statusName: h.status_name, note: h.note, userName: h.user_name, createdAt: h.created_at,
  }));
}

export async function saveOrder(f, usuario) {
  const itensTotal = (f.items || []).reduce((a, i) => a + (Number(i.total) || 0), 0);
  const total = itensTotal + (Number(f.deliveryFee) || 0) - (Number(f.discount) || 0);
  const base = {
    status_id: f.statusId || null, customer_id: f.customerId || null,
    buyer_name: f.buyerName || null, buyer_phone: f.buyerPhone || null,
    recipient_name: f.recipientName || null, recipient_phone: f.recipientPhone || null,
    delivery_type: f.deliveryType || "entrega",
    street: f.street || null, number_addr: f.numberAddr || null, complement: f.complement || null,
    zone_id: f.zoneId || null, neighborhood: f.neighborhood || null, city: f.city || "Uberlândia",
    reference: f.reference || null,
    delivery_date: f.deliveryDate || null, delivery_window: f.deliveryWindow || null, urgent: !!f.urgent,
    card_message: f.cardMessage || null, card_from: f.cardFrom || null, card_to: f.cardTo || null,
    items_total: itensTotal, delivery_fee: Number(f.deliveryFee) || 0,
    discount: Number(f.discount) || 0, total,
    payment_method: f.paymentMethod || null, paid: !!f.paid,
    notes: f.notes || null, user_name: usuario || null,
  };

  let id = f.id;
  if (id) {
    const { error } = await supabase.from("orders").update(base).eq("id", id);
    if (error) erro(error);
    await supabase.from("order_items").delete().eq("order_id", id);
  } else {
    const { data: num } = await supabase.rpc("next_order_number");
    const { data, error } = await supabase.from("orders").insert({ ...base, number: num || 1 }).select().single();
    if (error) erro(error);
    id = data.id;
    await supabase.from("order_history").insert({ order_id: id, status_name: "Pedido criado", user_name: usuario || null });
  }

  const itens = (f.items || []).map((i, k) => ({
    order_id: id, product_id: i.productId || null, description: i.description,
    size_name: i.sizeName || null, quantity: Number(i.quantity) || 1,
    unit_price: Number(i.unitPrice) || 0, total: Number(i.total) || 0, sort_order: k,
  }));
  if (itens.length) {
    const { error } = await supabase.from("order_items").insert(itens);
    if (error) erro(error);
  }
  return id;
}

export async function setOrderStatus(id, statusId, statusName, usuario) {
  const { error } = await supabase.from("orders").update({ status_id: statusId }).eq("id", id);
  if (error) erro(error);
  await supabase.from("order_history").insert({ order_id: id, status_name: statusName, user_name: usuario || null });
}

export async function setOrderPaid(id, paid, metodo, usuario) {
  const { error } = await supabase.from("orders").update({ paid: !!paid, payment_method: metodo || null }).eq("id", id);
  if (error) erro(error);
  await supabase.from("order_history").insert({
    order_id: id, status_name: paid ? "Pagamento recebido" : "Pagamento desmarcado", user_name: usuario || null,
  });
}

export async function cancelOrder(id, usuario) {
  const { error } = await supabase.from("orders").update({ canceled: true }).eq("id", id);
  if (error) erro(error);
  await supabase.from("order_history").insert({ order_id: id, status_name: "Pedido cancelado", user_name: usuario || null });
}

/* ------------------------ Catálogo público (sem login) -------------------- */
export async function loadCatalog() {
  const [prod, cat, oca, cfg, zon] = await Promise.all([
    supabase.from("products").select("*, product_images(*), product_sizes(*), product_occasions(occasion_id)")
      .eq("deleted", false).eq("active", true).order("name"),
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("occasions").select("*").order("sort_order"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("delivery_zones").select("*").order("sort_order").order("name"),
  ]);
  if (prod.error) erro(prod.error);
  const s = cfg.data || {};
  const categorias = cat.data || [];
  return {
    produtos: (prod.data || []).map(montaProduto).map((p) => ({
      ...p, category: categorias.find((c) => c.id === p.categoryId)?.name || "Outros",
    })),
    categorias,
    ocasioes: oca.data || [],
    zonas: (zon.data || []).map((z) => ({ name: z.name, fee: Number(z.fee) || 0 })),
    loja: {
      storeName: s.store_name || "Flores e Presentes Paixão",
      whatsapp: s.whatsapp || "", instagram: s.instagram || "",
      address: s.address || "", hours: s.hours || "",
      pixKey: s.pix_key || "", pixName: s.pix_name || "", pixType: s.pix_type || "CNPJ",
      paymentNote: s.payment_note || "", cardNote: s.card_note || "",
    },
  };
}
