/**
 * Achievements Generator
 * Populates the Guild Hall trophy grid from data/achievements.json.
 */

// All class strings written in full so Tailwind's scanner picks them up at build time.
const ACHIEVEMENT_COLORS = {
  blue:   { heading: "text-blue-300",   role: "text-blue-400",   border: "#60a5fa", shadow: "rgba(96,165,250,0.3)",  topGlow: "rgba(96,165,250,0.08)",  via: "rgba(96,165,250,0.6)"  },
  purple: { heading: "text-purple-300", role: "text-purple-400", border: "#c084fc", shadow: "rgba(192,132,252,0.3)", topGlow: "rgba(192,132,252,0.08)", via: "rgba(192,132,252,0.6)" },
  yellow: { heading: "text-yellow-300", role: "text-yellow-400", border: "#fbbf24", shadow: "rgba(245,158,11,0.3)",  topGlow: "rgba(245,158,11,0.08)",  via: "rgba(245,158,11,0.6)"  },
  green:  { heading: "text-green-300",  role: "text-green-400",  border: "#4ade80", shadow: "rgba(74,222,128,0.3)",  topGlow: "rgba(74,222,128,0.08)",  via: "rgba(74,222,128,0.6)"  },
  orange: { heading: "text-orange-300", role: "text-orange-400", border: "#fb923c", shadow: "rgba(251,146,60,0.3)",  topGlow: "rgba(251,146,60,0.08)",  via: "rgba(251,146,60,0.6)"  },
};

const ICONS = {
  star: `<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />`,
  book: `<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />`,
  badge: `<path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />`,
  heart: `<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />`,
  fire:  `<path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />`,
};

async function loadAchievements() {
  try {
    const res = await fetch("./data/achievements.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderAchievements(data);
  } catch (err) {
    console.error("[Achievements] load failed:", err);
  }
}

function renderAchievements(achievements) {
  const container = document.getElementById("achievements-container");
  if (!container) return;

  const current = achievements.filter((a) => a.current);
  const past    = achievements.filter((a) => !a.current);

  // Two rows: current teams centered in a 2-col grid, past teams in a 3-col grid
  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto w-full">
      ${current.map(createCardHTML).join("")}
    </div>
    ${past.length ? `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${past.map(createCardHTML).join("")}
    </div>` : ""}
  `;
}

function createCardHTML(item) {
  const c = ACHIEVEMENT_COLORS[item.color] ?? ACHIEVEMENT_COLORS.blue;
  const iconPath = ICONS[item.icon] ?? ICONS.star;

  const borderImageAttr = item.borderImage
    ? `style="border-image-source:url(images/borders/${item.borderImage})"`
    : "";

  return `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer"
       class="card flex flex-col items-center gap-3 p-8 relative overflow-hidden no-underline
              hover:-translate-y-1 transition-transform duration-150" ${borderImageAttr}
       style="border-top: 4px solid ${c.border}; box-shadow: var(--shadow-sharp), 0 0 30px ${c.topGlow}">

      <div class="absolute top-0 inset-x-0 h-px pointer-events-none"
           style="background: linear-gradient(90deg, transparent, ${c.via}, transparent)"></div>

      <div class="w-20 h-20 border-4 border-dark-700 bg-dark-900 flex items-center justify-center"
           style="box-shadow: 0 0 20px ${c.shadow}">
        <svg class="w-12 h-12 ${c.heading}" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          ${iconPath}
        </svg>
      </div>

      <h3 class="font-title text-base ${c.heading} text-center">${item.name}</h3>
      <span class="marker ${c.role}">${item.role}</span>
      <span class="text-xs text-gray-600 tracking-widest mt-auto">${item.year}</span>
    </a>
  `;
}

document.addEventListener("DOMContentLoaded", loadAchievements);
