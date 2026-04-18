// ─── Tag colors ───────────────────────────────────────────────────────────────
// Full class strings so Tailwind's scanner picks them all up.

const DEFAULT_BADGE_CLASSES = "bg-dark-800 text-gray-100 border-dark-700";

const TAG_BADGE_BY_COLOR = {
  amber: "bg-amber-900 text-amber-100 border-amber-600",
  blue: "bg-blue-900 text-blue-100 border-blue-600",
  fuchsia: "bg-fuchsia-900 text-fuchsia-100 border-fuchsia-600",
  green: "bg-green-900 text-green-100 border-green-600",
  purple: "bg-purple-900 text-purple-100 border-purple-600",
  orange: "bg-orange-900 text-orange-100 border-orange-600",
  gray: "bg-dark-800 text-gray-100 border-dark-700",
  white: "bg-dark-800 text-white border-white/60",
};

let tagColorLookup = new Map();

// Title hover color derived from primary tag
const TITLE_HOVER = {
  purple:  "group-hover:text-purple-400",
  blue:    "group-hover:text-blue-400",
  green:   "group-hover:text-green-400",
  amber:   "group-hover:text-amber-400",
  orange:  "group-hover:text-orange-400",
  fuchsia: "group-hover:text-fuchsia-400",
  gray:    "group-hover:text-gray-300",
  white:   "group-hover:text-gray-100",
};

function normalizeTagName(name) {
  return String(name || "").trim().toLowerCase();
}

function normalizeTag(tag) {
  if (typeof tag === "string") return { name: tag, primary: false };
  if (tag && typeof tag === "object") return { name: tag.name || "", primary: !!tag.primary, color: tag.color };
  return { name: "", primary: false };
}

function getTagColorName(tag) {
  if (tag.color) return tag.color;
  const normalized = normalizeTagName(tag.name);
  return tagColorLookup.get(normalized) || "white";
}

function getBadgeClasses(tag) {
  const color = getTagColorName(tag);
  return TAG_BADGE_BY_COLOR[color] || DEFAULT_BADGE_CLASSES;
}

function titleCaseTag(tag) {
  return String(tag || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createSingleTagHTML(tag) {
  const classes = getBadgeClasses(tag);
  return `<span class="px-2 py-1 font-title uppercase border text-xs inline-flex items-center ${classes}">${tag.name}</span>`;
}

function createTagBadgesHTML(tags) {
  const primaryTag = tags.find((t) => t.primary) ?? tags[0];
  if (!primaryTag) return "";

  const secondTags = tags.filter((t) => t !== primaryTag);
  const separator = secondTags.length ? `<span class="text-dark-700 select-none mx-0.5">|</span>` : "";
  const secondPills = secondTags.map(createSingleTagHTML).join("");

  return `${createSingleTagHTML(primaryTag)}${separator}${secondPills}`;
}

function createForgeTitleStackHTML(item, titleHover) {
  return `
    <div class="flex flex-col gap-0.5">
      <h3 class="font-basic text-lg text-gray-100 ${titleHover} transition-colors leading-tight font-semibold">${item.title}</h3>
    </div>`;
}

function createForgeDescriptionHTML(text) {
  if (!text) return "";
  return `<p class="mt-1 text-sm text-gray-400 leading-relaxed">${text}</p>`;
}

// ─── Status cube ──────────────────────────────────────────────────────────────

const STATUS = {
  active:   { dot: "bg-green-500", ping: "bg-green-400",  pulse: true  },
  wip:      { dot: "bg-amber-500", ping: "bg-amber-400",  pulse: true  },
  archived: { dot: "bg-gray-600",  ping: "",              pulse: false },
};

function statusCube(status) {
  const s = STATUS[status] ?? STATUS.archived;
  if (s.pulse) {
    return `<span class="relative flex w-3 h-3 flex-shrink-0">
      <span class="animate-ping absolute inline-flex h-full w-full ${s.ping} opacity-75"></span>
      <span class="relative inline-flex w-3 h-3 ${s.dot}"></span>
    </span>`;
  }
  return `<span class="inline-flex w-3 h-3 flex-shrink-0 ${s.dot}"></span>`;
}

// ─── Card HTML ────────────────────────────────────────────────────────────────

function createForgeItemHTML(item) {
  if (item === "divider") return `<hr class="border-dark-700 border-dashed border-t-4 md:col-span-2" />`;

  const tags        = (item.tags ?? []).map(normalizeTag).filter((t) => t.name);
  const primaryTag  = tags.find(t => t.primary) ?? tags[0];
  const titleHover  = TITLE_HOVER[getTagColorName(primaryTag || {})] ?? "";
  const tagBadges = createTagBadgesHTML(tags);

  const imageEl = item.image
    ? `<img src="${item.image}" alt="" class="size-30 bg-gray-800 border-3 border-dark-700 flex-shrink-0 object-cover image-rendering-pixelated" />`
    : "";

  return `
    <article class="p-4 bg-dark-800 border-3 border-dark-700 transition-all duration-100 ease-in-out group" data-tags="${tags.map(t => t.name).join(",")}">
      <a href="${item.href}" class="no-underline flex flex-col gap-0">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2 flex-wrap">
            ${tagBadges}
          </div>
          ${statusCube(item.status)}
        </div>
        <div class="flex gap-4">
          ${imageEl}
          <div class="flex flex-col gap-2 flex-1 min-w-0">
            ${createForgeTitleStackHTML(item, titleHover)}
            ${createForgeDescriptionHTML(item.description)}
          </div>
        </div>
      </a>
    </article>`;
}

// ─── Filter strip ─────────────────────────────────────────────────────────────

let allItems = [];

function readTagDefinitions(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.tags || [];
}

function setTagColorLookup(definitions) {
  const map = new Map();
  (definitions || []).forEach((entry) => {
    if (!entry?.name || !entry?.color) return;
    map.set(normalizeTagName(entry.name), String(entry.color).toLowerCase());
  });
  tagColorLookup = map;
}

function buildFilters(items) {
  const strip = document.getElementById("forge-filters");
  if (!strip) return;

  const tags = [...new Set(
    items.filter(i => i !== "divider").flatMap(i => (i.tags ?? []).map((t) => normalizeTag(t).name).filter(Boolean))
  )].sort();

  strip.innerHTML = [
    `<button class="journal-filter active" data-tag="all">All</button>`,
    ...tags.map(t => `<button class="journal-filter" data-tag="${t}">${titleCaseTag(t)}</button>`)
  ].join("");

  strip.addEventListener("click", e => {
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    strip.querySelectorAll(".journal-filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyFilter(btn.dataset.tag);
  });
}

function applyFilter(tag) {
  const container = document.getElementById("forge-items-container");
  if (!container) return;

  if (tag === "all") {
    container.innerHTML = allItems.map(createForgeItemHTML).join("");
    return;
  }

  const filtered = allItems.filter(
    i => i !== "divider" && (i.tags ?? []).map(normalizeTag).some(t => t.name === tag)
  );
  container.innerHTML = filtered.map(createForgeItemHTML).join("");
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadForgeItems() {
  try {
    const [itemsRes, tagsRes] = await Promise.all([fetch("./data/forge-items.json"), fetch("./data/tags.json")]);
    const payload = await itemsRes.json();
    const tagPayload = await tagsRes.json();

    allItems = Array.isArray(payload) ? payload : payload.items || [];
    setTagColorLookup(readTagDefinitions(tagPayload));

    buildFilters(allItems);
    document.getElementById("forge-items-container").innerHTML = allItems.map(createForgeItemHTML).join("");
  } catch (err) {
    console.error("[Forge] load failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadForgeItems);
