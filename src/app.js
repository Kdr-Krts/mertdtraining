const fmt = (n) => "₺" + Number(n).toLocaleString("tr-TR");
const $ = (s) => document.querySelector(s);

function loadProducts() {
  const el = $("#products-data");
  if (!el) return [];
  try {
    return JSON.parse(el.textContent || "[]");
  } catch {
    return [];
  }
}

const PRODUCTS = loadProducts();

function loadSite() {
  const el = $("#site-data");
  if (!el) return {};
  try {
    return JSON.parse(el.textContent || "{}");
  } catch {
    return {};
  }
}

const SITE = loadSite();
const CART_ENABLED = SITE.cartEnabled === true;

let cart = [];
if (CART_ENABLED) {
  try {
    cart = JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {}
}
const saveCart = () => {
  if (!CART_ENABLED) return;
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch {}
};

function whatsappHref(message) {
  if (!SITE.whatsapp) return "/iletisim/";
  const text = encodeURIComponent(message || "Merhaba, detaylı bilgi almak istiyorum.");
  return `https://wa.me/${SITE.whatsapp}?text=${text}`;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter((el) => {
    if (el.closest("[hidden]")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
  });
}

function createFocusScope(container, { onEscape } = {}) {
  let previous = null;

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape?.();
      return;
    }
    if (e.key !== "Tab") return;
    const list = getFocusable(container);
    if (!list.length) {
      e.preventDefault();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return {
    activate(initial) {
      previous = document.activeElement;
      document.addEventListener("keydown", onKeyDown);
      const list = getFocusable(container);
      const target = initial || list[0] || container;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    },
    deactivate() {
      document.removeEventListener("keydown", onKeyDown);
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
      previous = null;
    },
  };
}

function syncAddButtons() {
  document.querySelectorAll(".add-btn").forEach((btn) => {
    const id = +btn.dataset.id;
    const inCart = cart.includes(id);
    btn.classList.toggle("added", inCart);
    btn.textContent = inCart ? "Sepette" : "Sepete Ekle";
  });
}

function applyFilter(filter = "all") {
  document.querySelectorAll("#products .product").forEach((el) => {
    const match = filter === "all" || el.dataset.category === filter;
    el.hidden = !match;
    if (match) el.classList.add("visible");
  });
  document.querySelectorAll("#filters .chip").forEach((chip) => {
    const active = chip.dataset.filter === filter;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderCart() {
  const count = $("#cartCount");
  const cartItems = $("#cartItems");
  const cartTotal = $("#cartTotal");
  const checkoutBtn = $("#checkoutBtn");
  if (!count || !cartItems || !cartTotal) return;

  const items = cart.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  const total = items.reduce((s, p) => s + p.price, 0);
  count.textContent = items.length;
  count.classList.add("bump");
  setTimeout(() => count.classList.remove("bump"), 200);
  cartTotal.textContent = fmt(total);
  if (checkoutBtn) {
    checkoutBtn.disabled = !items.length;
    checkoutBtn.style.opacity = items.length ? 1 : 0.5;
  }

  cartItems.innerHTML = items.length
    ? items
        .map(
          (p) => `
        <div class="cart-item">
          <div class="cart-thumb" style="background:linear-gradient(145deg,${p.color[0]},${p.color[1]})"></div>
          <div class="cart-item-info"><h4>${p.title}</h4><span>${fmt(p.price)}</span></div>
          <button type="button" class="remove" data-remove="${p.id}">Kaldır</button>
        </div>`
        )
        .join("")
    : `<div class="empty">Sepetin boş.<br/>Bir paket seç.</div>`;
}

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2200);
}

const drawer = $("#drawer");
const overlay = $("#overlay");
const modal = $("#checkoutModal");
const drawerScope = drawer
  ? createFocusScope(drawer, { onEscape: () => closeCart() })
  : null;
const modalScope = modal
  ? createFocusScope(modal, { onEscape: () => closeModal() })
  : null;

function openCart() {
  if (!drawer) return;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawer.inert = false;
  if (overlay) {
    overlay.hidden = false;
    overlay.classList.add("show");
  }
  drawerScope?.activate($("#cartClose"));
}

function closeCart() {
  if (!drawer) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  if (overlay) {
    overlay.classList.remove("show");
    overlay.hidden = true;
  }
  drawerScope?.deactivate();
}

function openModal() {
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  modal.inert = false;
  modalScope?.activate($("#checkout-name") || $("#modalClose"));
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  modal.inert = true;
  modalScope?.deactivate();
}

let currentFilter = "all";

$("#products")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  const id = +btn.dataset.id;
  if (cart.includes(id)) {
    openCart();
    return;
  }
  cart.push(id);
  saveCart();
  renderCart();
  syncAddButtons();
  toast("Sepete eklendi");
});

$("#filters")?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  currentFilter = chip.dataset.filter;
  applyFilter(currentFilter);
});

$("#cartItems")?.addEventListener("click", (e) => {
  const id = e.target.dataset.remove;
  if (!id) return;
  cart = cart.filter((x) => x !== +id);
  saveCart();
  renderCart();
  syncAddButtons();
});

const cartOpen = $("#cartOpen");
const cartClose = $("#cartClose");
const menuBtn = $("#menuBtn");
if (cartOpen) cartOpen.onclick = openCart;
if (cartClose) cartClose.onclick = closeCart;
if (overlay) overlay.onclick = closeCart;
if (menuBtn) {
  menuBtn.onclick = () => {
    const nav = $("#navLinks");
    const open = nav?.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-controls", "navLinks");
}
document.querySelectorAll(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => {
    $("#navLinks")?.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  })
);

const path = (() => {
  const parts = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts[0] === "blog") return "blog.html";
  const last = parts[parts.length - 1];
  if (!last || last === "index.html") return "index.html";
  return last.endsWith(".html") ? last : `${last}.html`;
})();
document.querySelectorAll(".nav-links a[data-page]").forEach((a) => {
  if (a.dataset.page === path) a.classList.add("active");
});

$("#checkoutBtn")?.addEventListener("click", () => {
  if (!cart.length || !modal) return;
  const items = cart.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  const total = items.reduce((s, p) => s + p.price, 0);
  $("#orderSummary").innerHTML =
    items.map((p) => `<div><span>${p.title}</span><span>${fmt(p.price)}</span></div>`).join("") +
    `<div class="sum"><span>Toplam</span><span>${fmt(total)}</span></div>`;
  $("#checkoutStep").hidden = false;
  $("#successStep").hidden = true;
  closeCart();
  openModal();
});
$("#modalClose")?.addEventListener("click", closeModal);
$("#successClose")?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

$("#checkoutForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  cart = [];
  saveCart();
  renderCart();
  syncAddButtons();
  e.target.reset();
  $("#checkoutStep").hidden = true;
  $("#successStep").hidden = false;
  modalScope?.activate($("#successClose"));
});

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        io.unobserve(en.target);
      }
    });
  },
  { threshold: 0.12 }
);
document
  .querySelectorAll(
    ".section-head, .about-visual, .about-text, .coach-card-wrap, .coach-feature-text, .link-row a, .exp-item, .reviews blockquote, .contact > *, .page-hero .container, .cta-band, .product, .legal, .step, .faq-item"
  )
  .forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });

applyFilter("all");
syncAddButtons();
renderCart();

(function initPlanForm() {
  const form = $("#planForm");
  if (!form) return;

  const steps = [...form.querySelectorAll(".plan-step")];
  const prevBtn = $("#planPrev");
  const nextBtn = $("#planNext");
  const submitBtn = $("#planSubmit");
  const errorEl = $("#planError");
  const stepLabel = $("#planStepLabel");
  const progressBar = $("#planProgressBar");
  const recommended = $("#planRecommended");
  const recommendedId = $("#planRecommendedId");
  let step = 0;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  }

  function checkedValues(name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
  }

  function recommendPackage() {
    const goals = checkedValues("hedefler");
    const sports = (form.elements.spor_branslari?.value || "").toLowerCase();
    const detail = (form.elements.hedef_detay?.value || "").toLowerCase();
    const timeline = form.elements.hedef_suresi?.value || "";
    const daysRaw = form.elements.antrenman_gun?.value || "";
    const days = daysRaw === "6+" ? 6 : Number(daysRaw) || 0;
    const experience = form.elements.agirlik_deneyimi?.value || "";
    const blob = `${goals.join(" ")} ${sports} ${detail}`;

    const athleticHints =
      /spor performans|basket|voley|futbol|atlet|performans|sıçrama|çeviklik|yön değiştir|cod|agility|jump/i.test(
        blob
      );
    const jumpHint = /sıçrama|jump|plyo/i.test(blob);
    const agilityHint = /çeviklik|yön değiştir|cod|agility/i.test(blob);

    let category = athleticHints ? "athletic" : "transform";
    let level = "1 Ay";
    if (timeline.includes("6") || timeline.includes("1 yıl") || days >= 5) level = "6 Ay";
    else if (timeline.includes("3") || days >= 3 || experience === "Orta" || experience === "İleri")
      level = "3 Ay";

    let product =
      PRODUCTS.find((p) => p.category === category && p.level === level) ||
      PRODUCTS.find((p) => p.category === category) ||
      PRODUCTS[0];

    const extras = [];
    if (jumpHint) {
      const jump = PRODUCTS.find((p) => /sıçrama/i.test(p.title));
      if (jump) extras.push(jump);
    }
    if (agilityHint) {
      const agility = PRODUCTS.find((p) => /çeviklik/i.test(p.title));
      if (agility) extras.push(agility);
    }

    return { product, extras, category, level };
  }

  function renderRecommendation() {
    const { product, extras } = recommendPackage();
    if (!product) return;

    if (recommended) recommended.value = product.title;
    if (recommendedId) recommendedId.value = String(product.id);

    const title = $("#planResultTitle");
    const desc = $("#planResultDesc");
    const features = $("#planResultFeatures");
    const note = $("#planResultNote");
    const wa = $("#planResultWa");

    if (title) title.textContent = product.title;
    if (desc) desc.textContent = product.desc;
    if (features) {
      features.innerHTML = (product.features || [])
        .map((f) => `<li>${f}</li>`)
        .join("");
    }
    if (note) {
      const extraText = extras.length
        ? ` İstersen ek olarak ${extras.map((e) => e.title).join(" veya ")} mikro paketini de değerlendirebiliriz.`
        : "";
      note.textContent =
        `Bu öneri form cevaplarına göre otomatik üretildi; nihai planı birlikte netleştiririz.${extraText}`;
    }
    if (wa) {
      wa.href = whatsappHref(
        `Merhaba, ${product.title} paketi hakkında detaylı bilgi almak istiyorum.`
      );
      if (SITE.whatsapp) {
        wa.target = "_blank";
        wa.rel = "noopener noreferrer";
      } else {
        wa.removeAttribute("target");
        wa.removeAttribute("rel");
      }
    }
  }

  function validateStep(i) {
    showError("");
    if (i === 0) {
      const name = form.elements.ad_soyad?.value?.trim();
      const phone = form.elements.telefon?.value?.trim();
      if (!name) {
        showError("Ad soyad zorunlu.");
        form.elements.ad_soyad?.focus();
        return false;
      }
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        showError("Geçerli bir telefon numarası gir.");
        form.elements.telefon?.focus();
        return false;
      }
    }
    if (i === 5) {
      if (!$("#plan-kvkk")?.checked) {
        showError("Devam etmek için KVKK onayını işaretle.");
        $("#plan-kvkk")?.focus();
        return false;
      }
    }
    return true;
  }

  function goTo(next) {
    steps.forEach((el, idx) => {
      const active = idx === next;
      el.hidden = !active;
      el.classList.toggle("is-active", active);
    });
    step = next;
    if (stepLabel) stepLabel.textContent = `Adım ${step + 1} / ${steps.length}`;
    if (progressBar) {
      progressBar.style.width = `${((step + 1) / steps.length) * 100}%`;
    }
    if (prevBtn) prevBtn.hidden = step === 0;
    if (nextBtn) nextBtn.hidden = step === steps.length - 1;
    if (submitBtn) submitBtn.hidden = step !== steps.length - 1;
    if (step === steps.length - 1) renderRecommendation();
    window.scrollTo({ top: form.offsetTop - 90, behavior: "smooth" });
  }

  prevBtn?.addEventListener("click", () => {
    if (step > 0) goTo(step - 1);
  });

  nextBtn?.addEventListener("click", () => {
    if (!validateStep(step)) return;
    if (step < steps.length - 1) goTo(step + 1);
  });

  form.addEventListener("submit", (e) => {
    if (!validateStep(0) || !validateStep(5)) {
      e.preventDefault();
      if (step !== 0 && !form.elements.ad_soyad?.value?.trim()) goTo(0);
      return;
    }
    renderRecommendation();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Gönderiliyor…";
    }
  });

  goTo(0);
})();
