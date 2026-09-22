/* =========================================================
   USE BLOSSOM — Interações, catálogo, carrinho e carregamento de dados
   ========================================================= */

/* ---------------------------------------------------------
   DADOS PADRÃO (fallback)
   Usados quando o site é aberto direto do arquivo (file://),
   pois nesse modo o navegador bloqueia a leitura dos .json.
   Quando publicado (https), o site lê products.json e
   settings.json de verdade — que o painel /admin edita.
   --------------------------------------------------------- */
const DEFAULT_SETTINGS = { whatsapp: "5511969095915", instagram: "useblossom._" };
const DEFAULT_PRODUCTS = [
  { nome: "Anel Coração Cravejado", categoria: "aneis", preco: "89,90", descricao: "Anel delicado com coração em zircônias, banhado a ouro 18k.", imagem: "images/produto-anel-coracao.jpg", selo: "Mais vendido" },
  { nome: "Brinco Borboleta Gold", categoria: "brincos", preco: "49,90", descricao: "Par de brincos borboleta minimalistas — leveza e charme no dia a dia.", imagem: "images/produto-brinco-borboleta.jpg", selo: "" },
  { nome: "Brinco Estrela Cintilante", categoria: "brincos", preco: "49,90", descricao: "Estrelinhas que iluminam o rosto. Perfeitas para usar todos os dias.", imagem: "images/produto-brinco-estrela.jpg", selo: "" },
  { nome: "Brinco Coração Cravejado", categoria: "brincos", preco: "54,90", descricao: "Coração pavê em zircônias com muito brilho e acabamento impecável.", imagem: "images/produto-brinco-coracao.jpg", selo: "Novidade" },
  { nome: "Anel Inicial Personalizado", categoria: "aneis", preco: "69,90", descricao: "Seu charme com a sua inicial. Anel de selo elegante e atemporal.", imagem: "images/produto-anel-inicial.jpg", selo: "" },
  { nome: "Kit Anéis Luxo", categoria: "aneis", preco: "199,90", descricao: "Seleção com 6 anéis para montar combinações sofisticadas.", imagem: "images/produto-kit-aneis.jpg", selo: "Kit luxo" }
];

let SETTINGS = { ...DEFAULT_SETTINGS };
let CURRENT_PRODUCTS = [];
let activeFilter = "todos";

/* ---------- Categorias ---------- */
const CATEGORY_LABELS = {
  brincos: "Brincos",
  colares: "Colares",
  aneis: "Anéis",
  pulseiras: "Pulseiras",
  piercings: "Piercings",
  outros: "Outros",
};
const CATEGORY_ORDER = ["brincos", "colares", "aneis", "pulseiras", "piercings"];
const categoryLabel = (slug) => CATEGORY_LABELS[slug] || "Outros";

/* ---------- Helpers ---------- */
const escapeHtml = (str = "") =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const waLink = (msg) =>
  `https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(msg)}`;

const slugify = (str = "") =>
  String(str)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

function uniqueId(nome, index, seen) {
  const base = slugify(nome) || `produto-${index + 1}`;
  let id = base;
  let n = 2;
  while (seen.has(id)) { id = `${base}-${n}`; n++; }
  seen.add(id);
  return id;
}

const parsePrecoBR = (str) => parseFloat(String(str || "0").replace(/\./g, "").replace(",", ".")) || 0;
const formatBRL = (num) => num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- Normaliza os produtos vindos do products.json ---------- */
function normalizeProducts(lista) {
  const seen = new Set();
  return (lista || []).map((p, i) => {
    const nome = (p.nome || `Produto ${i + 1}`).trim();
    const categoria = p.categoria && CATEGORY_LABELS[p.categoria] ? p.categoria : "outros";
    return {
      id: uniqueId(nome, i, seen),
      nome,
      categoria,
      preco: p.preco || "0,00",
      precoAntigo: p.precoAntigo || "",
      imagem: p.imagem || "",
      descricao: (p.descricao || "").trim(),
      selo: p.selo || "",
    };
  });
}

function findProduct(id) {
  return CURRENT_PRODUCTS.find((p) => p.id === id);
}

/* ---------- Markup de preço (hierarquia: antigo riscado + atual em destaque) ---------- */
function priceMarkup(preco, precoAntigo) {
  const old = precoAntigo
    ? `<span class="price__old">R$ ${escapeHtml(precoAntigo)}</span>`
    : "";
  return `
    <div class="price">
      ${old}
      <span class="price__current"><span class="price__symbol">R$</span><span class="price__value">${escapeHtml(preco)}</span></span>
    </div>`;
}

/* ---------- Renderiza os cards de produto ---------- */
function cardTemplate(p) {
  const nome = escapeHtml(p.nome);
  const desc = p.descricao ? `<p class="card__desc">${escapeHtml(p.descricao)}</p>` : "";
  const selo = p.selo ? `<span class="card__tag">${escapeHtml(p.selo)}</span>` : "";
  const buyMsg = `Quero comprar: ${p.nome} (R$ ${p.preco})`;

  return `
    <article class="card reveal" data-id="${p.id}" data-categoria="${p.categoria}">
      <button type="button" class="card__media" data-qv="${p.id}" aria-label="Ver detalhes de ${nome}">
        <img src="${escapeHtml(p.imagem)}" alt="${nome}" loading="lazy" />
        ${selo}
      </button>
      <div class="card__body">
        <span class="card__category">${escapeHtml(categoryLabel(p.categoria))}</span>
        <h3 class="card__title"><button type="button" class="card__title-btn" data-qv="${p.id}">${nome}</button></h3>
        ${desc}
        ${priceMarkup(p.preco, p.precoAntigo)}
        <div class="card__actions">
          <button type="button" class="btn btn--gold card__add" data-add="${p.id}">Adicionar ao carrinho</button>
          <a class="card__buynow" href="${waLink(buyMsg)}" target="_blank" rel="noopener">Comprar agora</a>
        </div>
      </div>
    </article>`;
}

function renderProducts(produtos) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = produtos.map(cardTemplate).join("");
  observeReveals();
  applyFilter(activeFilter);
}

/* ---------- Filtro de categorias ---------- */
function renderFilters(produtos) {
  const box = document.getElementById("filters");
  if (!box) return;

  const present = new Set(produtos.map((p) => p.categoria));
  const ordered = [
    ...CATEGORY_ORDER.filter((c) => present.has(c)),
    ...[...present].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  if (ordered.length <= 1) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }

  box.hidden = false;
  const items = ["todos", ...ordered];
  box.innerHTML = items
    .map((c) => {
      const label = c === "todos" ? "Todos" : categoryLabel(c);
      const pressed = c === activeFilter ? "true" : "false";
      return `<button type="button" class="filter-btn" data-filter="${c}" aria-pressed="${pressed}">${escapeHtml(label)}</button>`;
    })
    .join("");
}

function applyFilter(categoria) {
  activeFilter = categoria;
  const cards = document.querySelectorAll("#productsGrid .card");
  let visible = 0;
  cards.forEach((card) => {
    const show = categoria === "todos" || card.dataset.categoria === categoria;
    card.classList.toggle("is-hidden", !show);
    if (show) visible += 1;
  });
  const empty = document.getElementById("productsEmpty");
  if (empty) empty.hidden = visible !== 0 || cards.length === 0;

  document.querySelectorAll("#filters .filter-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === categoria));
  });
}

/* =========================================================
   CARRINHO DE COMPRAS (localStorage, sem backend)
   ========================================================= */
const CART_KEY = "useblossom:cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

let CART = loadCart();

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(CART)); } catch (_) { /* modo privado / storage indisponível */ }
}

function cartCount() {
  return CART.reduce((n, i) => n + i.qty, 0);
}

function cartSubtotal() {
  return CART.reduce((sum, i) => sum + parsePrecoBR(i.preco) * i.qty, 0);
}

function persistCart() {
  saveCart();
  updateCartBadge();
  renderCart();
}

function addToCart(id, qty = 1) {
  const p = findProduct(id);
  if (!p) return;
  const item = CART.find((i) => i.id === id);
  if (item) item.qty += qty;
  else CART.push({ id: p.id, nome: p.nome, preco: p.preco, imagem: p.imagem, qty });
  persistCart();
  showToast(`"${p.nome}" adicionado ao carrinho ✓`);
  pulseBadge();
}

function changeQty(id, delta) {
  const item = CART.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) CART = CART.filter((i) => i.id !== id);
  persistCart();
}

function removeFromCart(id) {
  CART = CART.filter((i) => i.id !== id);
  persistCart();
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n > 99 ? "99+" : String(n);
  badge.hidden = n === 0;
}

function pulseBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.classList.remove("cart-btn__badge--pulse");
  void badge.offsetWidth; // reinicia a animação
  badge.classList.add("cart-btn__badge--pulse");
}

function renderCart() {
  const wrap = document.getElementById("cartItems");
  const footer = document.getElementById("cartFooter");
  if (!wrap || !footer) return;

  if (CART.length === 0) {
    wrap.innerHTML = `
      <div class="cart-empty">
        <p>Seu carrinho está vazio.</p>
        <a href="#produtos" class="btn btn--ghost-brown">Ver produtos</a>
      </div>`;
    footer.hidden = true;
    return;
  }

  footer.hidden = false;
  wrap.innerHTML = CART.map((i) => {
    const nome = escapeHtml(i.nome);
    const subtotal = formatBRL(parsePrecoBR(i.preco) * i.qty);
    return `
      <div class="cart-item" data-id="${i.id}">
        <img class="cart-item__img" src="${escapeHtml(i.imagem)}" alt="${nome}" loading="lazy" />
        <div class="cart-item__info">
          <p class="cart-item__name">${nome}</p>
          <p class="cart-item__price">R$ ${escapeHtml(i.preco)} <span class="cart-item__unit">/un.</span></p>
          <div class="cart-item__qty">
            <button type="button" class="qty-btn" data-action="dec" data-id="${i.id}" aria-label="Diminuir quantidade de ${nome}">−</button>
            <span class="cart-item__qty-val">${i.qty}</span>
            <button type="button" class="qty-btn" data-action="inc" data-id="${i.id}" aria-label="Aumentar quantidade de ${nome}">+</button>
          </div>
        </div>
        <div class="cart-item__side">
          <p class="cart-item__subtotal">R$ ${subtotal}</p>
          <button type="button" class="cart-item__remove" data-action="remove" data-id="${i.id}" aria-label="Remover ${nome} do carrinho">Remover</button>
        </div>
      </div>`;
  }).join("");

  const subtotalEl = document.getElementById("cartSubtotal");
  if (subtotalEl) subtotalEl.textContent = `R$ ${formatBRL(cartSubtotal())}`;
}

/* ---------- Mensagem do WhatsApp com o pedido completo ---------- */
function buildOrderMessage() {
  const linhas = CART.map((i) => `${i.qty}x ${i.nome} — R$ ${formatBRL(parsePrecoBR(i.preco) * i.qty)}`).join("\n");
  // Nota: usamos "✿" (não o emoji 🌸) porque o redirecionamento do wa.me corrompe
  // emojis fora do plano básico do Unicode e a mensagem chegaria com um símbolo quebrado.
  return `Olá! Gostaria de fazer este pedido na Use Blossom ✿\n\n${linhas}\n\nSubtotal: R$ ${formatBRL(cartSubtotal())}\n\nGostaria de finalizar meu pedido.`;
}

/* =========================================================
   ABRIR/FECHAR: carrinho, quick view, toast
   ========================================================= */
const openPanels = new Set();
function lockScroll(id) { openPanels.add(id); document.body.classList.add("no-scroll"); }
function unlockScroll(id) { openPanels.delete(id); if (openPanels.size === 0) document.body.classList.remove("no-scroll"); }

let lastFocusedEl = null;

function openCart() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (!overlay || !drawer) return;
  lastFocusedEl = document.activeElement;
  overlay.hidden = false;
  drawer.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
    drawer.classList.add("is-open");
  });
  lockScroll("cart");
  document.addEventListener("keydown", onCartKeydown);
  const closeBtn = document.getElementById("cartClose");
  if (closeBtn) closeBtn.focus();
}

function closeCart() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (!overlay || !drawer) return;
  overlay.classList.remove("is-visible");
  drawer.classList.remove("is-open");
  unlockScroll("cart");
  document.removeEventListener("keydown", onCartKeydown);
  setTimeout(() => { overlay.hidden = true; drawer.hidden = true; }, 350);
  if (lastFocusedEl) lastFocusedEl.focus();
}

function onCartKeydown(e) { if (e.key === "Escape") closeCart(); }

let qvCurrentId = null;

function openQuickView(id) {
  const p = findProduct(id);
  if (!p) return;
  qvCurrentId = id;

  const img = document.getElementById("qvImage");
  img.src = p.imagem;
  img.alt = p.nome;
  document.getElementById("qvCategory").textContent = categoryLabel(p.categoria);
  document.getElementById("qvTitle").textContent = p.nome;
  document.getElementById("qvDesc").textContent = p.descricao || "";
  document.getElementById("qvPrice").innerHTML = priceMarkup(p.preco, p.precoAntigo);

  const tag = document.getElementById("qvTag");
  if (p.selo) { tag.textContent = p.selo; tag.hidden = false; } else { tag.hidden = true; }

  document.getElementById("qvBuyNow").href = waLink(`Quero comprar: ${p.nome} (R$ ${p.preco})`);

  const overlay = document.getElementById("qvOverlay");
  const modal = document.getElementById("qvModal");
  lastFocusedEl = document.activeElement;
  overlay.hidden = false;
  modal.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
    modal.classList.add("is-open");
  });
  lockScroll("qv");
  document.addEventListener("keydown", onQvKeydown);
  document.getElementById("qvClose").focus();
}

function closeQuickView() {
  const overlay = document.getElementById("qvOverlay");
  const modal = document.getElementById("qvModal");
  if (!overlay || !modal) return;
  overlay.classList.remove("is-visible");
  modal.classList.remove("is-open");
  unlockScroll("qv");
  document.removeEventListener("keydown", onQvKeydown);
  setTimeout(() => { overlay.hidden = true; modal.hidden = true; }, 300);
  if (lastFocusedEl) lastFocusedEl.focus();
}

function onQvKeydown(e) { if (e.key === "Escape") closeQuickView(); }

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
}

/* ---------- Liga os eventos do catálogo, filtro, carrinho e modal ---------- */
function bindShopEvents() {
  const grid = document.getElementById("productsGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) { addToCart(addBtn.dataset.add); return; }
      const qvBtn = e.target.closest("[data-qv]");
      if (qvBtn) openQuickView(qvBtn.dataset.qv);
    });
  }

  const filters = document.getElementById("filters");
  if (filters) {
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (btn) applyFilter(btn.dataset.filter);
    });
  }

  const cartItems = document.getElementById("cartItems");
  if (cartItems) {
    cartItems.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === "inc") changeQty(id, 1);
      else if (btn.dataset.action === "dec") changeQty(id, -1);
      else if (btn.dataset.action === "remove") removeFromCart(id);
    });
  }

  const cartToggle = document.getElementById("cartToggle");
  const cartClose = document.getElementById("cartClose");
  const cartOverlay = document.getElementById("cartOverlay");
  if (cartToggle) cartToggle.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  const cartCheckout = document.getElementById("cartCheckout");
  if (cartCheckout) {
    cartCheckout.addEventListener("click", () => {
      if (CART.length === 0) {
        showToast("Adicione pelo menos um produto para finalizar o pedido 🌸");
        return;
      }
      window.open(waLink(buildOrderMessage()), "_blank", "noopener");
    });
  }

  const qvClose = document.getElementById("qvClose");
  const qvOverlay = document.getElementById("qvOverlay");
  const qvAdd = document.getElementById("qvAdd");
  if (qvClose) qvClose.addEventListener("click", closeQuickView);
  if (qvOverlay) qvOverlay.addEventListener("click", closeQuickView);
  if (qvAdd) qvAdd.addEventListener("click", () => { if (qvCurrentId) addToCart(qvCurrentId); });
}

/* ---------- Aplica WhatsApp e Instagram nos links fixos ---------- */
function applySettingsLinks() {
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.setAttribute("href", waLink(el.dataset.msg || "Olá! Vim pelo site da Use Blossom"));
  });
  document.querySelectorAll("[data-ig]").forEach((el) => {
    el.setAttribute("href", `https://instagram.com/${SETTINGS.instagram}`);
    if (!el.textContent.trim() || el.textContent.includes("@")) el.textContent = `@${SETTINGS.instagram}`;
  });
}

/* ---------- Aplica os textos do site (content.json) ---------- */
function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function applyContent(c) {
  if (!c) return;

  // Textos simples (elementos com data-c="caminho.do.campo")
  document.querySelectorAll("[data-c]").forEach((el) => {
    const val = get(c, el.dataset.c);
    if (typeof val === "string" && val.trim() !== "") {
      el.textContent = val;
    }
  });

  // Título do hero com palavra em destaque
  if (c.hero && c.hero.titulo) {
    const h = document.getElementById("heroTitle");
    if (h) {
      const titulo = escapeHtml(c.hero.titulo);
      const destaque = (c.hero.destaque || "").trim();
      h.innerHTML = destaque
        ? titulo.replace(escapeHtml(destaque), `<em>${escapeHtml(destaque)}</em>`)
        : titulo;
    }
  }

  // Barra de confiança (hero trust) — só substitui o padrão quando o painel já tiver itens
  if (Array.isArray(c.hero && c.hero.trust) && c.hero.trust.length > 0) {
    const box = document.getElementById("heroTrust");
    if (box) {
      box.innerHTML = c.hero.trust
        .map((t) => `<div><strong>${escapeHtml(t.numero)}</strong><span>${escapeHtml(t.texto)}</span></div>`)
        .join("");
    }
  }

  // Diferenciais — só substitui o padrão quando o painel já tiver itens
  if (Array.isArray(c.diferenciais) && c.diferenciais.length > 0) {
    const grid = document.getElementById("featuresGrid");
    if (grid) {
      grid.innerHTML = c.diferenciais
        .map((d) => `
          <article class="feature reveal">
            <span class="feature__icon">${escapeHtml(d.icone || "✦")}</span>
            <h3>${escapeHtml(d.titulo)}</h3>
            <p>${escapeHtml(d.texto)}</p>
          </article>`)
        .join("");
    }
  }

  // Depoimentos — só substitui o padrão quando o painel já tiver itens
  if (Array.isArray(c.depoimentos) && c.depoimentos.length > 0) {
    const grid = document.getElementById("testimonialsGrid");
    if (grid) {
      grid.innerHTML = c.depoimentos
        .map((d) => `
          <figure class="quote reveal">
            <div class="quote__stars">★★★★★</div>
            <blockquote>"${escapeHtml(d.texto)}"</blockquote>
            <figcaption>— ${escapeHtml(d.autor)}</figcaption>
          </figure>`)
        .join("");
    }
  }

  observeReveals();
}

/* ---------- Carrega dados (json) com fallback ---------- */
async function loadData() {
  // textos do site
  try {
    const r = await fetch("content.json", { cache: "no-store" });
    if (r.ok) applyContent(await r.json());
  } catch (_) { /* mantém os textos padrão do HTML */ }

  // settings
  try {
    const r = await fetch("settings.json", { cache: "no-store" });
    if (r.ok) SETTINGS = { ...DEFAULT_SETTINGS, ...(await r.json()) };
  } catch (_) { /* usa o padrão */ }
  applySettingsLinks();

  // produtos
  try {
    const r = await fetch("products.json", { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      CURRENT_PRODUCTS = normalizeProducts(data.produtos && data.produtos.length ? data.produtos : DEFAULT_PRODUCTS);
    } else {
      throw new Error("sem json");
    }
  } catch (_) {
    CURRENT_PRODUCTS = normalizeProducts(DEFAULT_PRODUCTS);
  }

  renderFilters(CURRENT_PRODUCTS);
  renderProducts(CURRENT_PRODUCTS);
}

/* =========================================================
   INTERAÇÕES DE INTERFACE
   ========================================================= */

// Ano atual no rodapé
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Menu mobile ----------
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
navToggle.addEventListener("click", () => {
  nav.classList.toggle("open");
  navToggle.classList.toggle("open");
});
nav.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.classList.remove("open");
  });
});

// ---------- Header muda ao rolar ----------
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Animações de revelação ao scroll ----------
const supportsIO = "IntersectionObserver" in window;

const io = supportsIO
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${(i % 4) * 80}ms`;
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
  : null;

function observeReveals() {
  const els = document.querySelectorAll(".reveal:not(.visible)");
  if (!io) {
    // navegador sem suporte: mostra tudo na hora
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  els.forEach((el) => io.observe(el));
}
observeReveals();

// Rede de segurança: garante que nada fique invisível em celulares antigos
window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("visible");
    });
  }, 800);
});

// ---------- Inicializa ----------
bindShopEvents();
updateCartBadge();
renderCart();
loadData();
