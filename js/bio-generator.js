/**
 * Bio Generator
 * Populates attributes, disciplines, and experience log from data/bio.json.
 */

const EXPERIENCE_COLORS = {
  fuchsia: "text-fuchsia-400",
  blue:    "text-blue-400",
  amber:   "text-amber-400",
  gray:    "text-gray-400",
};

const DEFAULT_LORE = {
  title: "Lore",
  paragraphs: [
    "Started as a Java modder in 2016 and never really stopped - just gradually shifted toward the professional side. Since 2019 I've been deep in Bedrock: entity AI, custom animations, art pipelines, and the tooling that makes all of it less painful.",
    "I work across the full stack of an add-on - behaviors, scripting, modeling, textures, and the build systems that tie it together. Currently at Tsunami Studios while contributing to unannounced work at Simply Brilliant.",
  ],
};

async function loadBioData() {
  const res = await fetch("./data/bio.json");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderStats(stats, containerId = "bio-stats") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const yearsActive = new Date().getFullYear() - 2018;

  const rows = [
    { label: "Projects Completed", value: stats.projects_completed },
    { label: "Projects Led",       value: stats.projects_lead      },
    { label: "Years Active",       value: yearsActive              },
  ];

  container.innerHTML = rows.map(({ label, value }) => `
    <div class="flex items-center justify-between">
      <dt class="text-xs text-gray-500 uppercase tracking-widest">${label}</dt>
      <dd class="font-title text-sm text-amber-300">${value}</dd>
    </div>
  `).join("");
}

function getLore(data) {
  if (!data || !data.lore || !Array.isArray(data.lore.paragraphs)) {
    return DEFAULT_LORE;
  }

  return {
    title: data.lore.title || DEFAULT_LORE.title,
    paragraphs: data.lore.paragraphs.length ? data.lore.paragraphs : DEFAULT_LORE.paragraphs,
  };
}

function entryCard(entry) {
  const colorClass = EXPERIENCE_COLORS[entry.color] ?? EXPERIENCE_COLORS.gray;
  return `
    <div class="flex flex-col gap-1">
      <span class="px-2 py-1 font-title uppercase border text-xs inline-flex items-center self-start bg-white/8 ${colorClass}">${entry.studio}</span>
      <h4 class="font-title text-sm text-gray-100">${entry.role}</h4>
      <p class="text-xs text-gray-500 leading-relaxed">${entry.projects}</p>
      <span class="text-xs text-gray-600">${entry.period}</span>
    </div>`;
}

function renderExperience(experience) {
  const container = document.getElementById("bio-experience");
  if (!container) return;

  // Group consecutive concurrent entries into pairs
  const rows = [];
  let i = 0;
  while (i < experience.length) {
    if (experience[i].concurrent && experience[i + 1]?.concurrent) {
      rows.push({ type: "pair", entries: [experience[i], experience[i + 1]] });
      i += 2;
    } else {
      rows.push({ type: "single", entry: experience[i] });
      i++;
    }
  }

  container.innerHTML = rows.map((row, ri) => {
    const isLast = ri === rows.length - 1;
    const connector = isLast ? "" : `<div class="w-px flex-1 bg-dark-700"></div>`;

    if (row.type === "pair") {
      return `
        <div class="flex gap-4 ${isLast ? "" : "pb-6"} relative">
          <div class="flex flex-col items-center gap-1 flex-shrink-0">
            <div class="w-3 h-3 border-2 border-amber-400 bg-dark-900 z-10 flex-shrink-0"></div>
            ${connector}
          </div>
          <div class="grid grid-cols-2 gap-4 flex-1 pb-2">
            ${row.entries.map(entryCard).join("")}
          </div>
        </div>`;
    }

    return `
      <div class="flex gap-4 ${isLast ? "" : "pb-6"} relative">
        <div class="flex flex-col items-center gap-1 flex-shrink-0">
          <div class="w-3 h-3 border-2 border-amber-400 bg-dark-900 z-10 flex-shrink-0"></div>
          ${connector}
        </div>
        <div class="flex flex-col gap-1 pb-2">
          ${entryCard(row.entry)}
        </div>
      </div>`;
  }).join("");
}

async function loadBioPage() {
  try {
    const data = await loadBioData();
    renderStats(data.stats);
    renderExperience([...data.experience].reverse());
  } catch (err) {
    console.error("[Bio] load failed:", err);
  }
}

window.BioProfile = {
  getLore,
  loadBioData,
  renderStats,
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("bio-stats") || document.getElementById("bio-experience")) {
    loadBioPage();
  }
});
