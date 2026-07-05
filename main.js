/* EtherealPE Portal Main JS
   Edit SITE_CONFIG for IPs, ports, voting links, Discord, etc.
*/

const SITE_CONFIG = {
  brand: "EtherealPE",
  accessGate: {
    enabled: true,
    passphraseHash: "ee961d61958c505ea7805c231512dadb1b867344b19447449f5fbb63fa7512be",
    sessionKey: "etherealpe_access_unlocked"
  },
  server: {
    javaAddress: "glacia.etherealpe.com",
    javaPort: "", 
    bedrockAddress: "glacia.etherealpe.com",
    bedrockPort: "19132",
    bedrockName: "EtherealPE"
  },
  links: {
    discord: "https://discord.gg/Z2ZsbvZkbc",
    store: "#",
    vote: "https://vote.etherealpe.com"
  },
  realms: [
    {
      id: "glacia",
      name: "Glacia",
      tag: "Realm I",
      status: "Coming Soon",
      description: "An ice planet factions realm with bosses, custom gear, pets, runes, rings, scrolls, and seasonal progression.",
      meta: ["Java + Bedrock", "Factions", "PvE Bosses"],
      unlocked: true
    },
    {
      id: "realm-2",
      name: "???",
      tag: "Realm II",
      status: "Locked",
      description: "A future EtherealPE realm. Details are hidden until the stars align.",
      meta: ["Classified", "Future Season"],
      unlocked: false
    },
    {
      id: "realm-3",
      name: "???",
      tag: "Realm III",
      status: "Locked",
      description: "Another world in the EtherealPE universe. Not ready for reveal yet.",
      meta: ["Classified", "Future Realm"],
      unlocked: false
    }
  ],
  votes: [
    { name: "Vote Site 1", url: "https://minecraftpocket-servers.com/server/133199/", reward: "Vote Lootbox + $100,000 in-game money" },
    { name: "Vote Site 2", url: "https://example.com/vote-2", reward: "Vote Lootbox + $100,000 in-game money" },
    { name: "Vote Site 3", url: "https://example.com/vote-3", reward: "Vote Lootbox + $100,000 in-game money" },
    { name: "Vote Site 4", url: "https://example.com/vote-4", reward: "Vote Lootbox + $100,000 in-game money" }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
  initAccessGate();
  hydrateStaticText();
  initMobileNav();
  initSmoothActiveNav();
  renderRealms();
  renderVoteCards();
  initPlatformTabs();
  initCopyButtons();
  initBedrockDeepLink();
  initRevealAnimations();
});


function initAccessGate() {
  const gate = $("#access-gate");
  const form = $("#access-gate-form");
  const input = $("#access-phrase");
  const status = $("#access-gate-status");
  const card = gate?.querySelector(".gate-card");

  if (!gate || !form || !input || !status) return;

  if (!SITE_CONFIG.accessGate?.enabled) {
    unlockGate(false);
    return;
  }

  if (sessionStorage.getItem(SITE_CONFIG.accessGate.sessionKey) === "true") {
    unlockGate(false);
    return;
  }

  input.focus({ preventScroll: true });

  let verifyInFlight = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (verifyInFlight) return;

    const phrase = normalizeAccessPhrase(input.value);
    if (!phrase) {
      setGateStatus("Signal missing. Enter the access phrase.", "denied");
      return;
    }

    verifyInFlight = true;
    input.disabled = true;
    setGateStatus("Checking signal...", "");
    const ok = await verifyAccessPhrase(phrase);
    verifyInFlight = false;
    input.disabled = false;

    if (ok) {
      setGateStatus("Signal accepted. Opening portal...", "accepted");
      sessionStorage.setItem(SITE_CONFIG.accessGate.sessionKey, "true");
      setTimeout(() => unlockGate(true), 450);
    } else {
      setGateStatus("Access denied. Signal rejected.", "denied");
      input.select();
      card?.classList.remove("shake");
      void card?.offsetWidth;
      card?.classList.add("shake");
    }
  });

  input.addEventListener("input", () => {
    if (status.classList.contains("denied")) {
      setGateStatus("Awaiting signal...", "");
    }
  });

  function unlockGate(animated = true) {
    document.body.classList.remove("gate-locked");
    gate.classList.add("unlocked");
    if (!animated) gate.style.transition = "none";
    setTimeout(() => gate.remove(), animated ? 650 : 0);
  }

  function setGateStatus(message, state) {
    status.textContent = message;
    status.classList.remove("accepted", "denied");
    if (state) status.classList.add(state);
  }
}

async function verifyAccessPhrase(phrase) {
  const target = SITE_CONFIG.accessGate.passphraseHash?.toLowerCase();

  if (!target) {
    return false;
  }

  const hash = await sha256Hex(phrase);
  return hash === target;
}

async function sha256Hex(value) {
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return sha256HexFallback(value);
}

function normalizeAccessPhrase(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sha256HexFallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let result = "";
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  const hash = sha256HexFallback.h = sha256HexFallback.h || [];
  const k = sha256HexFallback.k = sha256HexFallback.k || [];
  let primeCounter = k[lengthProperty];

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) {
    ascii += "\x00";
  }

  for (let i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= code << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (let j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = i < 16 ? w[i] : (
          w[i - 16]
          + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
          + w[i - 7]
          + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : "") + b.toString(16);
    }
  }
  return result;
}

function hydrateStaticText() {
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const java = getJavaAddress();
  const bedrock = `${SITE_CONFIG.server.bedrockAddress}:${SITE_CONFIG.server.bedrockPort}`;

  $$('[data-java-address]').forEach((el) => (el.textContent = java));
  $$('[data-bedrock-address]').forEach((el) => (el.textContent = SITE_CONFIG.server.bedrockAddress));
  $$('[data-bedrock-port]').forEach((el) => (el.textContent = SITE_CONFIG.server.bedrockPort));
  $$('[data-bedrock-full]').forEach((el) => (el.textContent = bedrock));

  $$('[data-link="discord"]').forEach((el) => {
    el.href = SITE_CONFIG.links.discord;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });

  $$('[data-link="vote"]').forEach((el) => (el.href = SITE_CONFIG.links.vote));
}

function getJavaAddress() {
  const { javaAddress, javaPort } = SITE_CONFIG.server;
  return javaPort ? `${javaAddress}:${javaPort}` : javaAddress;
}

function initMobileNav() {
  const btn = $(".mobile-menu-btn");
  const nav = $(".nav-links");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

function initSmoothActiveNav() {
  const sections = $$('section[id]');
  const links = $$('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const id = visible.target.id;
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
  }, { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.25, 0.5] });

  sections.forEach((section) => observer.observe(section));
}

function renderRealms() {
  const grid = $('[data-realms-grid]');
  if (!grid) return;

  grid.innerHTML = SITE_CONFIG.realms.map((realm) => {
    const meta = realm.meta.map((m) => `<span class="pill">${escapeHtml(m)}</span>`).join("");
    return `
      <article class="realm-card ${realm.unlocked ? "" : "locked"}" data-reveal>
        <div class="realm-tag">${escapeHtml(realm.tag)}</div>
        <h3 class="realm-title">${escapeHtml(realm.name)}</h3>
        <p class="realm-desc">${escapeHtml(realm.description)}</p>
        <div class="realm-meta">
          <span class="pill ${realm.unlocked ? "online" : ""}">${escapeHtml(realm.status)}</span>
          ${meta}
        </div>
        ${realm.unlocked
          ? `<a class="btn btn-ice" href="#play" data-realm="${escapeHtml(realm.id)}">Play ${escapeHtml(realm.name)}</a>`
          : `<button class="btn btn-ghost" disabled>Not revealed</button>`}
      </article>`;
  }).join("");
}

function renderVoteCards() {
  const grid = $('[data-vote-grid]');
  if (!grid) return;

  grid.innerHTML = SITE_CONFIG.votes.map((vote) => `
    <a class="vote-card" href="${escapeAttribute(vote.url)}" target="_blank" rel="noopener noreferrer" data-reveal>
      <span class="vote-name">${escapeHtml(vote.name)}</span>
      <span class="vote-reward">${escapeHtml(vote.reward)}</span>
      <span class="btn btn-ghost">Vote Now</span>
    </a>
  `).join("");
}

function initPlatformTabs() {
  const tabs = $$('[data-platform-tab]');
  const views = $$('[data-platform-view]');
  if (!tabs.length || !views.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const platform = tab.dataset.platformTab;
      tabs.forEach((btn) => btn.classList.toggle("active", btn === tab));
      views.forEach((view) => view.classList.toggle("active", view.dataset.platformView === platform));
    });
  });
}

function initCopyButtons() {
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest('[data-copy]');
    if (!btn) return;
    const value = resolveCopyValue(btn.dataset.copy);
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      showToast(`Copied ${value}`);
    } catch {
      fallbackCopy(value);
      showToast(`Copied ${value}`);
    }
  });
}

function resolveCopyValue(key) {
  switch (key) {
    case "java": return getJavaAddress();
    case "bedrock-address": return SITE_CONFIG.server.bedrockAddress;
    case "bedrock-port": return SITE_CONFIG.server.bedrockPort;
    case "bedrock-full": return `${SITE_CONFIG.server.bedrockAddress}:${SITE_CONFIG.server.bedrockPort}`;
    default: return key || "";
  }
}

function fallbackCopy(value) {
  const input = document.createElement("input");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function initBedrockDeepLink() {
  const link = $('[data-bedrock-deeplink]');
  if (!link) return;
  const { bedrockName, bedrockAddress, bedrockPort } = SITE_CONFIG.server;
  link.href = `minecraft://?addExternalServer=${encodeURIComponent(bedrockName)}|${bedrockAddress}:${bedrockPort}`;
}

function initRevealAnimations() {
  const items = $$('[data-reveal]');
  if (!items.length) return;

  items.forEach((item) => {
    item.style.opacity = "0";
    item.style.transform = "translateY(18px)";
    item.style.transition = "opacity .55s cubic-bezier(.2,.8,.2,1), transform .55s cubic-bezier(.2,.8,.2,1)";
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  items.forEach((item) => observer.observe(item));
}

let toastTimer;
function showToast(message) {
  let toast = $(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
