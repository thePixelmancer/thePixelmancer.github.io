/**
 * Skills Generator
 * Populates skill tag containers and handles spellbook modal per skill.
 */

// ─── State ────────────────────────────────────────────────────────────────────

let skillsData = null;

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadSkills() {
  try {
    const res = await fetch("./data/skills.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    skillsData = await res.json();
    injectSkillTags(skillsData);
    buildSpellbookModal();
  } catch (err) {
    console.error("[Skills] load failed:", err);
  }
}

// ─── Inject tags into containers ──────────────────────────────────────────────

function injectSkillTags(data) {
  Object.entries(data).forEach(([pathKey, path]) => {
    const container = document.getElementById(path.containerId);
    if (!container) {
      console.warn(`[Skills] Container not found: ${path.containerId}`);
      return;
    }

    const isArt = pathKey === "art";
    const hoverClasses = isArt
      ? "hover:border-fuchsia-400 hover:text-fuchsia-200"
      : "hover:border-blue-400 hover:text-blue-200";

    const tags = path.skills
      .map(
        (skill) => `
        <button
          type="button"
          class="skill-tag card px-3 py-2 text-xs border-dark-700 text-gray-300 cursor-pointer ${hoverClasses} transition-all duration-100"
          data-path="${pathKey}"
          data-skill="${skill.id}"
          aria-label="Open ${skill.label} spellbook">
          ${skill.label}
        </button>
      `,
      )
      .join("");

    container.innerHTML = tags;
  });
}

// ─── Spellbook Modal ──────────────────────────────────────────────────────────

function buildSpellbookModal() {
  if (document.getElementById("spellbookModal")) return;

  const style = document.createElement("style");
  style.textContent = `
    .scroll-content-scrollbar::-webkit-scrollbar { width: 8px; }
    .scroll-content-scrollbar::-webkit-scrollbar-track { background: rgb(17,24,40); }
    .scroll-content-scrollbar::-webkit-scrollbar-thumb { background: rgb(55,65,81); border-radius: 2px; }
    .scroll-content-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(75,85,99); }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "spellbookModal";
  modal.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden p-4";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "spellbookTitle");

  modal.innerHTML = `
    <div class="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-gray-200">

      <!-- Header -->
      <header class="flex justify-between items-center px-6 py-4 border-b-4 border-dark-700 bg-dark-900 shadow-sharp">
        <div class="flex items-center gap-3">
          <span id="spellbookIcon" class="text-xl text-amber-300" aria-hidden="true">✦</span>
          <div>
            <h3 id="spellbookTitle" class="font-title text-base text-amber-300"></h3>
            <p id="spellbookPath" class="text-[9px] mt-0.5 uppercase tracking-widest text-gray-500"></p>
          </div>
        </div>
        <button
          type="button"
          onclick="closeSpellbook()"
          class="font-title text-[9px] px-3 py-1 text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Close spellbook">
          ✕ Close
        </button>
      </header>

      <!-- Content -->
      <div id="spellbookContent" class="scroll-content-scrollbar flex-1 overflow-y-auto px-8 py-6 bg-dark-800">
        <!-- injected -->
      </div>

      <!-- Footer -->
      <footer class="px-6 py-4 border-t-4 border-dark-700 bg-dark-900"></footer>

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
    if (tag) openSpellbook(tag.dataset.path, tag.dataset.skill);
  });
}

function openSpellbook(pathKey, skillId) {
  if (!skillsData) return;

  const path = skillsData[pathKey];
  const skill = path?.skills.find((s) => s.id === skillId);
  if (!path || !skill) return;

  const isArt = pathKey === "art";
  const accentColor = isArt ? "bg-fuchsia-500" : "bg-blue-500";

  document.getElementById("spellbookIcon").textContent = path.icon;
  document.getElementById("spellbookTitle").textContent = skill.label;
  document.getElementById("spellbookPath").textContent = path.label;

  const content = document.getElementById("spellbookContent");
  content.innerHTML = skill.spells
    .map(
      (spell) => `
    <div class="flex items-start gap-4 py-4 border-b border-dark-700 last:border-b-0">
      <div class="w-12 h-12 flex-shrink-0 border-2 border-dark-700 bg-dark-900 flex items-center justify-center">
        <img
          src="${spell.icon}"
          alt=""
          class="w-full h-full object-cover [image-rendering:pixelated]"
          onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')"
        />
        <span class="hidden text-xl text-gray-600">✦</span>
      </div>
      <div class="flex flex-col gap-1.5 flex-1">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 ${accentColor}"></span>
          <h4 class="font-title text-xs uppercase text-gray-100">${spell.title}</h4>
        </div>
        <p class="text-xs text-gray-400 leading-relaxed">${spell.description}</p>
      </div>
    </div>
  `,
    )
    .join("");

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
