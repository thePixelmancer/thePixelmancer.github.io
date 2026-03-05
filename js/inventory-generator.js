/**
 * Inventory Generator
 *
 * All styling via Tailwind classes — no inline styles, no dynamic concatenation.
 * Listeners attached once at buildGrid(), never re-added.
 * paintSlot() only swaps className on the inner div.
 */

// ─── Tier → Tailwind class maps ───────────────────────────────────────────────
// Full literal class strings so Tailwind's scanner picks them all up.

const TIER_CLASSES = {
  common: { border: "border-gray-500", glow: "shadow-gray-500/30", bg: "bg-gray-500/10", text: "text-gray-500", particle: "bg-gray-500" },
  uncommon: { border: "border-green-500", glow: "shadow-green-500/30", bg: "bg-green-500/10", text: "text-green-500", particle: "bg-green-500" },
  rare: { border: "border-blue-400", glow: "shadow-blue-400/30", bg: "bg-blue-400/10", text: "text-blue-400", particle: "bg-blue-400" },
  epic: { border: "border-purple-500", glow: "shadow-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-500", particle: "bg-purple-500" },
  legendary: { border: "border-amber-400", glow: "shadow-amber-400/40", bg: "bg-amber-400/10", text: "text-amber-400", particle: "bg-amber-400" },
};
const T_DEF = TIER_CLASSES.common;
const SLOTS = 15;
const TIP_OFFSET = 18;

function tc(tier) {
  return TIER_CLASSES[(tier ?? "").toLowerCase()] ?? T_DEF;
}

// ─── Shared Tailwind class strings ───────────────────────────────────────────
// Written out in full so the scanner sees them.

const SLOT_BASE = "w-full aspect-square relative overflow-hidden border-2 transition-all duration-100 hover:scale-105";
const SLOT_EMPTY = "border-dark-700 bg-dark-900/60 cursor-default";
const SLOT_EMPTY_H = "border-gray-500 bg-dark-900/60 cursor-copy";
const SLOT_HELD = "border-white/60 opacity-40 cursor-grabbing";
const SLOT_ITEM_H = "cursor-grab"; // hovered item slot — border/glow come from tier classes

const IMG_BASE = "w-full h-full object-cover block pointer-events-none select-none [image-rendering:pixelated]";

// ─── State ────────────────────────────────────────────────────────────────────

let items = new Array(SLOTS).fill(null);
let held = null;
let audioCtx = null;
let audioCache = {};

const slotInner = new Array(SLOTS);

// ─── Audio ────────────────────────────────────────────────────────────────────

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

async function loadAudio(url) {
  if (audioCache[url]) return audioCache[url];
  try {
    const ctx = getAudioCtx();
    const buf = await (await fetch(url)).arrayBuffer();
    audioCache[url] = await ctx.decodeAudioData(buf);
    return audioCache[url];
  } catch (e) {
    console.warn("[Inventory] audio load failed:", url, e);
    return null;
  }
}

async function playSound(url) {
  if (!url) return;
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") await ctx.resume();
  const buf = await loadAudio(url);
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

let tooltip = null;

function buildTooltip() {
  tooltip = document.createElement("div");
  tooltip.className =
    "fixed top-0 left-0 z-[10000] pointer-events-none w-80 hidden flex-col gap-3 p-4 bg-dark-900 border-2 border-dark-800 shadow-sharp";
  document.body.appendChild(tooltip);
}

function showTooltip(item, mx, my) {
  const t = tc(item.tier);
  tooltip.style.display = "flex";

  tooltip.innerHTML = `
    <img src="${item.image}" alt="${item.title}"
      class="w-full aspect-square object-cover block border-2 ${t.border} bg-dark-800 image-rendering-pixelated"
      onerror="this.style.display='none'"/>
    <span class="text-sm leading-relaxed text-gray-100">${item.title}</span>
    <span class="text-lg font-title uppercase tracking-widest ${t.text}">${item.tier ?? "common"}</span>
    ${item.description ? `<span class="text-gray-400 text-xs">${item.description}</span>` : ""}
    ${item.consumable ? `<span class="text-sm text-yellow-300 font-title">▶ Right-click to use</span>` : ""}
  `;

  placeTooltip(mx, my);
}

function placeTooltip(mx, my) {
  if (tooltip.style.display === "none") return;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  const tw = tooltip.offsetWidth,
    th = tooltip.offsetHeight;
  let x = mx + TIP_OFFSET,
    y = my + TIP_OFFSET;
  if (x + tw > vw - 8) x = mx - tw - TIP_OFFSET;
  if (y + th > vh - 8) y = my - th - TIP_OFFSET;
  tooltip.style.transform = `translate(${Math.max(8, x)}px,${Math.max(8, y)}px)`;
}

function hideTooltip() {
  tooltip.style.display = "none";
}

// ─── Ghost ───────────────────────────────────────────────────────────────────

let ghost = null;

function buildGhost() {
  ghost = document.createElement("img");
  ghost.className = "fixed top-0 left-0 z-[9998] w-12 h-12 object-cover pointer-events-none hidden opacity-90 image-rendering-pixelated shadow-sharp";
  document.body.appendChild(ghost);
}

function showGhost(item, mx, my) {
  const t = tc(item.tier);
  ghost.src = item.image;
  ghost.className = `fixed top-0 left-0 z-[9998] w-12 h-12 object-cover pointer-events-none hidden opacity-90 image-rendering-pixelated shadow-sharp border-1 ${t.border}`;
  ghost.classList.remove("hidden");
  placeGhost(mx, my);
}

function placeGhost(mx, my) {
  ghost.style.transform = `translate(${mx - 24}px,${my - 24}px)`;
}

function hideGhost() {
  ghost.classList.add("hidden");
}

// ─── Paint slot (className swap only, no inline styles) ───────────────────────

function paintSlot(i, hovered = false) {
  const inner = slotInner[i];
  const item = items[i];

  if (!item) {
    inner.className = `${SLOT_BASE} ${hovered ? SLOT_EMPTY_H : SLOT_EMPTY}`;
    inner.innerHTML = "";
    return;
  }

  const t = tc(item.tier);
  const isHeld = held === i;

  if (isHeld) {
    inner.className = `${SLOT_BASE} ${t.border} ${t.bg} ${SLOT_HELD}`;
  } else if (hovered) {
    inner.className = `${SLOT_BASE} ${t.border} ${t.bg} ${t.glow} shadow-lg ${SLOT_ITEM_H}`;
  } else {
    inner.className = `${SLOT_BASE} ${t.border} ${t.bg} ${SLOT_ITEM_H}`;
  }

  inner.innerHTML = `
    <img src="${item.image}" alt="${item.title}" draggable="false" class="${IMG_BASE}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
    <span class="hidden items-center justify-center absolute inset-0 text-gray-600 text-2xl">?</span>
    ${
      item.consumable ?
        `<span class="absolute bottom-0.5 right-1 font-title text-3xs text-yellow-300 pointer-events-none [text-shadow:0_0_4px_rgba(0,0,0,1)]">USE</span>`
      : ""
    }`;
}

function paintAll() {
  for (let i = 0; i < SLOTS; i++) paintSlot(i);
}

// ─── Grid build ───────────────────────────────────────────────────────────────

function buildGrid(container) {
  container.innerHTML = "";

  const bag = document.createElement("div");
  bag.className = "card";

  const grid = document.createElement("ul");
  grid.className = "grid grid-cols-5 gap-2";
  grid.setAttribute("aria-label", "Inventory");
  grid.addEventListener("contextmenu", (e) => e.preventDefault());

  for (let i = 0; i < SLOTS; i++) {
    const li = document.createElement("li");
    const inner = document.createElement("div");
    li.appendChild(inner);
    slotInner[i] = inner;

    li.addEventListener("mouseenter", (e) => {
      if (held === i) return;
      paintSlot(i, true);
      if (items[i]) showTooltip(items[i], e.clientX, e.clientY);
    });

    li.addEventListener("mousemove", (e) => {
      placeTooltip(e.clientX, e.clientY);
    });

    li.addEventListener("mouseleave", () => {
      paintSlot(i, false);
      hideTooltip();
    });

    li.addEventListener("click", (e) => {
      hideTooltip();

      if (held === null) {
        if (!items[i]) return;
        held = i;
        paintSlot(i);
        showGhost(items[i], e.clientX, e.clientY);
      } else if (held === i) {
        held = null;
        hideGhost();
        paintAll();
      } else {
        const tmp = items[i];
        items[i] = items[held];
        items[held] = tmp;
        held = null;
        hideGhost();
        paintAll();
      }
    });

    li.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      if (held !== null) return;
      const item = items[i];
      if (!item?.consumable) return;
      hideTooltip();
      await consumeItem(i);
    });

    grid.appendChild(li);
  }

  bag.appendChild(grid);
  container.appendChild(bag);
  paintAll();
}

// ─── Consume ─────────────────────────────────────────────────────────────────

async function consumeItem(i) {
  const item = items[i];
  if (!item) return;

  playSound(item.sound);

  const flash = document.createElement("div");
  flash.className = "absolute inset-0 z-10 pointer-events-none bg-white/90 transition-opacity duration-300";
  slotInner[i].appendChild(flash);
  spawnParticles(slotInner[i], tc(item.tier));

  setTimeout(() => {
    flash.classList.add("opacity-0");
  }, 60);
  setTimeout(() => {
    items[i] = null;
    paintSlot(i);
  }, 360);
}

function spawnParticles(el, t) {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 28 + Math.random() * 32;
    const size = 3 + Math.round(Math.random() * 4) + "px";
    const p = document.createElement("div");

    // Fixed position + size via style (purely positional, not colour/design)
    p.style.cssText = `position:fixed;z-index:9997;pointer-events:none;width:${size};height:${size};top:${cy}px;left:${cx}px;`;
    p.className = `${t.particle} transition-[transform,opacity] duration-[380ms] ease-out -translate-x-1/2 -translate-y-1/2`;
    document.body.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
      p.style.opacity = "0";
    });
    setTimeout(() => p.remove(), 400);
  }
}

// ─── Global handlers ─────────────────────────────────────────────────────────

document.addEventListener("mousemove", (e) => {
  if (held !== null) {
    placeGhost(e.clientX, e.clientY);
    hideTooltip();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && held !== null) {
    held = null;
    hideGhost();
    paintAll();
  }
});

document.addEventListener("mousedown", (e) => {
  if (held === null) return;
  const grid = document.querySelector("#inventory-container ul");
  if (grid && !grid.contains(e.target)) {
    held = null;
    hideGhost();
    paintAll();
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────

async function initInventory() {
  const container = document.getElementById("inventory-container");
  if (!container) return;

  buildTooltip();
  buildGhost();

  container.innerHTML = `<div class="p-6 text-center text-gray-500 font-basic text-lg">Loading inventory…</div>`;

  try {
    const res = await fetch("./data/inventory.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    items = new Array(SLOTS).fill(null);
    (Array.isArray(data) ? data : []).forEach((item, i) => {
      if (i < SLOTS && item?.title) items[i] = item;
    });

    buildGrid(container);
  } catch (err) {
    console.error("[Inventory] load failed:", err);
    container.innerHTML = `<div class="m-4 p-4 text-center text-red-400 border-2 border-red-800 bg-red-950/20 font-basic text-lg">⚠ Inventory failed to load</div>`;
  }
}

document.addEventListener("DOMContentLoaded", initInventory);
