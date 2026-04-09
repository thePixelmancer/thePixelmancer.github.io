// ─── Tag colors ───────────────────────────────────────────────────────────────
// Full class strings so Tailwind's scanner picks them all up.

const TAG_COLOR = {
  purple:  { text: "text-purple-400",  border: "border-purple-500/40"  },
  blue:    { text: "text-blue-400",    border: "border-blue-500/40"    },
  green:   { text: "text-green-400",   border: "border-green-500/40"   },
  amber:   { text: "text-amber-400",   border: "border-amber-500/40"   },
  orange:  { text: "text-orange-400",  border: "border-orange-500/40"  },
  fuchsia: { text: "text-fuchsia-400", border: "border-fuchsia-500/40" },
  gray:    { text: "text-gray-400",    border: "border-gray-600"       },
};
const TAG_COLOR_DEFAULT = { text: "text-gray-400", border: "border-gray-600" };

function tagColor(color) {
  return TAG_COLOR[color] ?? TAG_COLOR_DEFAULT;
}

// Title hover color derived from primary tag
const TITLE_HOVER = {
  purple:  "group-hover:text-purple-400",
  blue:    "group-hover:text-blue-400",
  green:   "group-hover:text-green-400",
  amber:   "group-hover:text-amber-400",
  orange:  "group-hover:text-orange-400",
  fuchsia: "group-hover:text-fuchsia-400",
  gray:    "group-hover:text-gray-300",
};

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
  if (item === "divider") return `<hr class="divider" />`;

  const tags        = item.tags ?? [];
  const primaryTag  = tags.find(t => t.primary) ?? tags[0];
  const secondTags  = tags.filter(t => t !== primaryTag);
  const titleHover  = TITLE_HOVER[primaryTag?.color] ?? "";

  const primaryPill = primaryTag
    ? `<span class="marker ${tagColor(primaryTag.color).text}">${primaryTag.name}</span>`
    : `<span></span>`;

  const secondPills = secondTags.map(t =>
    `<span class="marker ${tagColor(t.color).text}">${t.name}</span>`
  ).join("");

  const separator = secondTags.length
    ? `<span class="text-dark-700 select-none mx-0.5">|</span>`
    : "";

  const imageEl = item.image
    ? `<img src="${item.image}" alt="" class="size-30 bg-gray-800 border-3 border-dark-700 flex-shrink-0 object-cover image-rendering-pixelated" />`
    : "";

  const statsEl = item.stats?.length
    ? `<div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 border-t border-dark-700 pt-2">
        ${item.stats.map(s => `
          <div class="flex items-center gap-1.5">
            <span class="text-[8px] tracking-widest text-gray-600 uppercase">${s.label}:</span>
            <span class="text-[9px] text-gray-300">${s.value}</span>
          </div>`).join("")}
       </div>`
    : "";

  return `
    <article class="card group" data-tags="${tags.map(t => t.name).join(",")}">
      <a href="${item.href}" class="no-underline flex flex-col gap-0">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            ${primaryPill}
            ${separator}
            ${secondPills}
          </div>
          ${statusCube(item.status)}
        </div>
        <div class="flex gap-4">
          ${imageEl}
          <div class="flex flex-col gap-1 flex-1 min-w-0">
            <h3 class="font-title text-base ${titleHover} transition-colors">${item.title}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">${item.description}</p>
            ${statsEl}
          </div>
        </div>
      </a>
    </article>`;
}

// ─── Filter strip ─────────────────────────────────────────────────────────────

let allItems = [];

function buildFilters(items) {
  const strip = document.getElementById("forge-filters");
  if (!strip) return;

  const tags = [...new Set(
    items.filter(i => i !== "divider").flatMap(i => (i.tags ?? []).map(t => t.name))
  )].sort();

  strip.innerHTML = [
    `<button class="journal-filter active" data-tag="all">All</button>`,
    ...tags.map(t => `<button class="journal-filter" data-tag="${t}">${t}</button>`)
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
    i => i !== "divider" && (i.tags ?? []).some(t => t.name === tag)
  );
  container.innerHTML = filtered.map(createForgeItemHTML).join("");
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadForgeItems() {
  try {
    const res = await fetch("./data/forge-items.json");
    allItems = await res.json();
    buildFilters(allItems);
    document.getElementById("forge-items-container").innerHTML = allItems.map(createForgeItemHTML).join("");
  } catch (err) {
    console.error("[Forge] load failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadForgeItems);
