/**
 * Skills Generator
 * Renders two Path cards (Development / Art & Design).
 * Each skill tag opens a spellbook modal — first-iteration layout, paper colors.
 */

// ─── State ────────────────────────────────────────────────────────────────────

let skillsData = null;

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadSkills() {
  try {
    const res = await fetch("./data/skills.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    skillsData = await res.json();
    renderPaths(skillsData);
    buildSpellbookModal();
  } catch (err) {
    console.error("[Skills] load failed:", err);
  }
}

// ─── Path cards ───────────────────────────────────────────────────────────────

function renderPaths(data) {
  const devContainer = document.getElementById("development-skills-container");
  const artContainer = document.getElementById("art-skills-container");
  if (!devContainer) return;

  devContainer.className = "";
  devContainer.innerHTML = buildPathCard(data.development, "development");

  if (artContainer) {
    artContainer.className = "";
    artContainer.innerHTML = buildPathCard(data.art, "art");
  }
}

function buildPathCard(path, pathKey) {
  const isArt        = pathKey === "art";
  const accentBorder = isArt ? "border-fuchsia-500/40" : "border-blue-500/40";
  const accentText   = isArt ? "text-fuchsia-300"       : "text-blue-300";
  const accentDot    = isArt ? "bg-fuchsia-400"          : "bg-blue-400";
  const accentHover  = isArt
    ? "hover:border-fuchsia-400 hover:text-fuchsia-200"
    : "hover:border-blue-400 hover:text-blue-200";

  const tags = path.categories.map(cat => `
    <button
      type="button"
      class="skill-tag card px-3 py-2 text-xs border-dark-700 text-gray-300 cursor-pointer ${accentHover} transition-all duration-100"
      data-path="${pathKey}"
      data-category="${cat.id}"
      aria-label="Open ${cat.label} spellbook">
      ${cat.label}
    </button>
  `).join("");

  return `
    <div class="card flex flex-col gap-3 ${accentBorder}">
      <div class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-xs ${accentDot}" aria-hidden="true"></span>
        <h3 class="font-title text-base ${accentText}">${path.label}</h3>
      </div>
      <p class="text-xs text-gray-500 leading-relaxed">${path.description}</p>
      <div class="flex flex-wrap gap-2">
        ${tags}
      </div>
    </div>
  `;
}

// ─── Spellbook Modal ──────────────────────────────────────────────────────────

function buildSpellbookModal() {
  if (document.getElementById("spellbookModal")) return;

  const style = document.createElement("style");
  style.textContent = `
    .spellbook-paper {
      background-color: #c4b08a;
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.13'/%3E%3C/svg%3E"),
        linear-gradient(160deg, #cfc0a0 0%, #c4b08a 40%, #cbb99a 70%, #b89e72 100%);
    }

    .spellbook-paper-dark {
      background-color: #a8925e;
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E"),
        linear-gradient(160deg, #b8a070 0%, #a8925e 50%, #9e8550 100%);
    }

    .spellbook-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(100,70,30,0.5) rgba(100,70,30,0.1);
    }
    .spellbook-scrollbar::-webkit-scrollbar { width: 8px; }
    .spellbook-scrollbar::-webkit-scrollbar-track { background: rgba(100,70,30,0.1); }
    .spellbook-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,70,30,0.45); }
    .spellbook-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100,70,30,0.65); }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "spellbookModal";
  modal.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden p-4";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "spellbookTitle");

  modal.innerHTML = `
    <div class="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[12px_12px_0px_rgba(0,0,0,0.7)] border-4"
      style="border-color:#6b4e27;">

      <!-- Header — darker paper tone -->
      <header class="spellbook-paper-dark flex-shrink-0 flex justify-between items-center px-6 py-4 border-b-4"
        style="border-color:#6b4e27;">
        <div class="flex items-center gap-3">
          <span id="spellbookIcon" class="text-xl" style="color:#3d2a0a;" aria-hidden="true">✦</span>
          <div>
            <h3 id="spellbookTitle" class="font-title text-base" style="color:#1e1208;letter-spacing:0.06em;"></h3>
            <p id="spellbookPath" class="text-xs mt-0.5 uppercase tracking-widest" style="color:rgba(30,18,8,0.55);"></p>
          </div>
        </div>
        <button
          type="button"
          onclick="closeSpellbook()"
          class="font-title text-xs px-3 py-2 border-2 transition-colors duration-100"
          style="color:rgba(30,18,8,0.6);border-color:rgba(80,50,15,0.4);background:rgba(0,0,0,0.1);"
          onmouseover="this.style.borderColor='rgba(80,50,15,0.8)'"
          onmouseout="this.style.borderColor='rgba(80,50,15,0.4)'"
          aria-label="Close spellbook">
          ✕ Close
        </button>
      </header>

      <!-- Spell list — lighter paper -->
      <div id="spellbookContent"
        class="spellbook-paper spellbook-scrollbar flex-1 overflow-y-auto flex flex-col divide-y"
        style="border-color:#6b4e27;--tw-divide-opacity:0.3;divide-color:rgba(107,78,39,0.3);">
        <!-- injected -->
      </div>

      <!-- Footer -->
      <footer class="spellbook-paper-dark flex-shrink-0 px-6 py-3 border-t-4 flex items-center justify-center"
        style="border-color:#6b4e27;">
        <p class="font-title text-xs uppercase tracking-widest" style="color:rgba(30,18,8,0.35);">End of Scroll</p>
      </footer>

    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSpellbook();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSpellbook();
  });

  document.addEventListener("click", (e) => {
    const tag = e.target.closest(".skill-tag");
    if (tag) openSpellbook(tag.dataset.path, tag.dataset.category);
  });
}

function openSpellbook(pathKey, categoryId) {
  if (!skillsData) return;

  const path     = skillsData[pathKey];
  const category = path?.categories.find(c => c.id === categoryId);
  if (!path || !category) return;

  const isArt       = pathKey === "art";
  const accentColor = isArt ? "#86198f" : "#1d4ed8";

  document.getElementById("spellbookIcon").textContent  = path.icon;
  document.getElementById("spellbookTitle").textContent = category.label;
  document.getElementById("spellbookPath").textContent  = path.label + " Path";

  const content = document.getElementById("spellbookContent");
  content.innerHTML = category.spells.map(spell => `
    <div class="flex items-start gap-4 px-6 py-5" style="border-color:rgba(107,78,39,0.25);">

      <!-- Icon -->
      <div class="w-12 h-12 flex-shrink-0 border-2 flex items-center justify-center overflow-hidden"
        style="border-color:rgba(107,78,39,0.5);background:rgba(0,0,0,0.12);">
        <img
          src="${spell.icon}"
          alt=""
          class="w-full h-full object-cover"
          style="image-rendering:pixelated;"
          onerror="this.style.display='none';this.nextElementSibling.style.removeProperty('display')"
        />
        <span style="display:none;font-size:20px;color:rgba(80,50,15,0.35);" aria-hidden="true">✦</span>
      </div>

      <!-- Text -->
      <div class="flex flex-col gap-1.5 min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 flex-shrink-0" style="background:${accentColor};"></span>
          <h4 class="font-title text-xs uppercase" style="color:#1e1208;letter-spacing:0.06em;">${spell.title}</h4>
        </div>
        <p class="text-xs leading-relaxed" style="color:rgba(40,24,8,0.7);">${spell.description}</p>
      </div>

    </div>
  `).join("");

  const scrollEl = document.getElementById("spellbookContent");
  if (scrollEl) scrollEl.scrollTop = 0;

  const modal = document.getElementById("spellbookModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeSpellbook() {
  const modal = document.getElementById("spellbookModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", loadSkills);