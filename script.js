/* =========================================================
   USE BLOSSOM — Interações + carregamento de dados
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
  { nome: "Anel Coração Cravejado", preco: "89,90", descricao: "Anel delicado com coração em zircônias, banhado a ouro 18k.", imagem: "images/produto-anel-coracao.jpg", selo: "Mais vendido" },
  { nome: "Brinco Borboleta Gold", preco: "49,90", descricao: "Par de brincos borboleta minimalistas — leveza e charme no dia a dia.", imagem: "images/produto-brinco-borboleta.jpg", selo: "" },
  { nome: "Brinco Estrela Cintilante", preco: "49,90", descricao: "Estrelinhas que iluminam o rosto. Perfeitas para usar todos os dias.", imagem: "images/produto-brinco-estrela.jpg", selo: "" },
  { nome: "Brinco Coração Cravejado", preco: "54,90", descricao: "Coração pavê em zircônias com muito brilho e acabamento impecável.", imagem: "images/produto-brinco-coracao.jpg", selo: "Novidade" },
  { nome: "Anel Inicial Personalizado", preco: "69,90", descricao: "Seu charme com a sua inicial. Anel de selo elegante e atemporal.", imagem: "images/produto-anel-inicial.jpg", selo: "" },
  { nome: "Kit Anéis Luxo", preco: "199,90", descricao: "Seleção com 6 anéis para montar combinações sofisticadas.", imagem: "images/produto-kit-aneis.jpg", selo: "Kit luxo" }
];

let SETTINGS = { ...DEFAULT_SETTINGS };

/* ---------- Helpers ---------- */
const escapeHtml = (str = "") =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const waLink = (msg) =>
  `https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(msg)}`;

/* ---------- Renderiza os produtos ---------- */
function renderProducts(produtos) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = produtos.map((p) => {
    const nome = escapeHtml(p.nome);
    const desc = escapeHtml(p.descricao);
    const preco = escapeHtml(p.preco);
    const selo = p.selo ? `<span class="card__tag">${escapeHtml(p.selo)}</span>` : "";
    const msg = `Quero o ${p.nome} (R$ ${p.preco})`;
    return `
      <article class="card reveal">
        <div class="card__media" style="background-image:url('${escapeHtml(p.imagem)}')">${selo}</div>
        <div class="card__body">
          <h3 class="card__title">${nome}</h3>
          <p class="card__desc">${desc}</p>
          <div class="card__foot">
            <span class="card__price">R$ ${preco}</span>
            <a href="${waLink(msg)}" class="btn btn--gold" target="_blank" rel="noopener">Comprar</a>
          </div>
        </div>
      </article>`;
  }).join("");

  // reativa as animações nos cards recém-criados
  observeReveals();
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
      // mantém quebras de linha simples (caso o texto tenha)
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

  // Barra de confiança (hero trust)
  if (Array.isArray(c.hero && c.hero.trust)) {
    const box = document.getElementById("heroTrust");
    if (box) {
      box.innerHTML = c.hero.trust
        .map((t) => `<div><strong>${escapeHtml(t.numero)}</strong><span>${escapeHtml(t.texto)}</span></div>`)
        .join("");
    }
  }

  // Diferenciais
  if (Array.isArray(c.diferenciais)) {
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

  // Depoimentos
  if (Array.isArray(c.depoimentos)) {
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
      renderProducts(data.produtos || DEFAULT_PRODUCTS);
      return;
    }
    throw new Error("sem json");
  } catch (_) {
    renderProducts(DEFAULT_PRODUCTS);
  }
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
loadData();
