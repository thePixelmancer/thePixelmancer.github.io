// Paste these positions into js/journey.js
const nodePositions = {
  builder: [-353, 114],
  freelance: [-169, 256],
  modder: [-502, 315],
  nitric: [210, 268],
  pixelmancer: [135, -17],
  shapeAsset: [-517, -166],
  shapeDirector: [-261, -161],
  shapeLead: [-363, -291],
  simplyBrilliant: [484, 132],
  tsunamiDev: [105, -323],
  tsunamiLead: [389, -325],
  xp: [58, 270],
};

const regionSeedPoints = {
  independent: [
    [131, 271],
    [-354, 114],
    [141, -14],
    [-111, 155],
  ],
  javaModding: [
    [-717, 543],
    [-498, 317],
  ],
  shapescape: [
    [-517, -171],
    [-362, -44],
    [-259, -159],
    [-546, 41],
    [-374, -273],
  ],
  simplyBrilliant: [[545, 269]],
  tsunamiStudios: [
    [121, -300],
    [391, -320],
    [-98, -329],
  ],
};
const regionDefinitions = [
  {
    id: "javaModding",
    color: "#9ca3af",
    tooltip: "guild-java-modding",
    fallbackPoints: [[-520, 300]],
  },
  {
    id: "independent",
    color: "#4ade80",
    tooltip: "guild-independent",
    fallbackPoints: [
      [-320, 280],
      [90, 280],
      [20, -60],
    ],
  },
  {
    id: "shapescape",
    color: "#c084fc",
    tooltip: "guild-shapescape",
    fallbackPoints: [
      [-60, 120],
      [-200, 20],
      [-340, -30],
    ],
  },
  {
    id: "tsunamiStudios",
    color: "#60a5fa",
    tooltip: "guild-tsunami-studios",
    fallbackPoints: [
      [430, -150],
      [520, -300],
    ],
  },
  {
    id: "simplyBrilliant",
    color: "#fbbf24",
    tooltip: "guild-simply-brilliant",
    fallbackPoints: [[340, -410]],
  },
];

function getNodePosition(key, fallbackX, fallbackY) {
  const position = nodePositions[key];
  if (!Array.isArray(position) || position.length < 2) return [fallbackX, fallbackY];

  const x = Number(position[0]);
  const y = Number(position[1]);
  return [Number.isFinite(x) ? x : fallbackX, Number.isFinite(y) ? y : fallbackY];
}

function getRegionPoints(regionId, fallbackPoints) {
  const configuredPoints = regionSeedPoints[regionId];
  if (!Array.isArray(configuredPoints) || !configuredPoints.length) return fallbackPoints;

  const normalizedPoints = configuredPoints
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const x = Number(point[0]);
      const y = Number(point[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return [x, y];
    })
    .filter(Boolean);

  return normalizedPoints.length ? normalizedPoints : fallbackPoints;
}

JourneyMap.init(function (map) {
  const S = JourneyMap.styles;
  const orangeStyle = { ...S.amber, fillColor: "#fb923c" };
  const params = new URLSearchParams(window.location.search);
  const DEV_LAYOUT_ALLOWED = params.get("dev-layout") === "1";

  function formatExportSnippet(layout) {
    const lines = ["// Paste these positions into js/journey.js", "const nodePositions = {"];
    const nodeKeys = Object.keys(layout.nodePositions).sort();
    for (const key of nodeKeys) {
      const pos = layout.nodePositions[key];
      lines.push(`  ${key}: [${pos.x}, ${pos.y}],`);
    }
    lines.push("};");
    lines.push("");
    lines.push("const regionSeedPoints = {");
    const regionKeys = Object.keys(layout.regionSeedPoints).sort();
    for (const key of regionKeys) {
      const points = layout.regionSeedPoints[key];
      if (points.length === 1) {
        lines.push(`  ${key}: [[${points[0][0]}, ${points[0][1]}]],`);
        continue;
      }

      lines.push(`  ${key}: [`);
      for (const point of points) {
        lines.push(`    [${point[0]}, ${point[1]}],`);
      }
      lines.push("  ],");
    }
    lines.push("};");
    return lines.join("\n");
  }

  map.preloadIcon("images/icon_placeholder.png");
  map.preloadIcon("images/banner.png");
  map.preloadIcon("images/tsunami_logo.png");
  map.preloadIcon("images/avatar.png");
  map.preloadIcon("images/shapescape_logo.jpg");

  // ─── Nodes ───────────────────────────────────────────────────────────────

  const modder = map.originNode(...getNodePosition("modder", -520, 300), {
    devKey: "modder",
    color: "#4ade80",
    description: "Started tinkering with Java mods. The spark that started everything.",
    label: [
      { text: "Java Modder", style: S.title },
      { text: "2016", style: S.period },
    ],
  });

  const freelance = map.majorNode(...getNodePosition("freelance", -320, 280), {
    devKey: "freelance",
    color: "#4ade80",
    iconPath: "images/icon_placeholder.png",
    description: "Started professional freelance work across design, web, and Minecraft content production.",
    label: [
      { text: "Freelance Designer", style: S.title },
      { text: "Independent", style: S.green },
      { text: "2017 - 2018", style: S.period },
    ],
  });

  const builder = map.majorNode(...getNodePosition("builder", 90, 280), {
    devKey: "builder",
    color: "#4ade80",
    iconPath: "images/icon_placeholder.png",
    description: "Moved from building toward 3D modeling and production-ready asset workflows.",
    label: [
      { text: "Minecraft Builder", style: S.title },
      { text: "Independent", style: S.green },
      { text: "2018", style: S.period },
    ],
  });

  const shapeAsset = map.majorNode(...getNodePosition("shapeAsset", -60, 120), {
    devKey: "shapeAsset",
    color: "#c084fc",
    iconPath: "images/shapescape_logo.jpg",
    description: "Joined Shapescape as an Asset Creator and began shipping marketplace content at studio scale.",
    label: [
      { text: "Asset Creator", style: S.title },
      { text: "Shapescape", style: S.purple },
      { text: "2018 - 2019", style: S.period },
    ],
  });

  const shapeLead = map.minorNode(...getNodePosition("shapeLead", -200, 20), {
    devKey: "shapeLead",
    color: "#c084fc",
    description:
      "Promoted to Branch Lead, overseeing art quality and advising project direction. Also contributed dragon work to DragonFire for Spectral Studios via Cubecraft licensing.",
    label: [
      { text: "Branch Lead", style: S.title },
      { text: "Shapescape", style: S.purple },
      { text: "2019 - 2021", style: S.period },
    ],
  });

  const shapeDirector = map.minorNode(...getNodePosition("shapeDirector", -340, -30), {
    devKey: "shapeDirector",
    color: "#c084fc",
    description: "Briefly served as Art Director, leading style decisions and visual consistency.",
    label: [
      { text: "Art Director", style: S.title },
      { text: "Shapescape", style: S.purple },
      { text: "2021", style: S.period },
    ],
  });

  const pixelmancer = map.majorNode(...getNodePosition("pixelmancer", 20, -60), {
    devKey: "pixelmancer",
    color: "#4ade80",
    current: true,
    iconPath: "images/avatar.png",
    description: "Running my own creative brand while shipping client work, original add-ons, and creator tooling.",
    label: [
      { text: "Add-On Developer", style: S.title },
      { text: "Independent", style: S.green },
      { text: "2022 - Present", style: S.period },
    ],
  });
  const xp = map.minorNode(...getNodePosition("xp", 250, -250), {
    devKey: "xp",
    color: "#4ade80",
    description: "Running my own creative brand while shipping client work, original add-ons, and creator tooling.",
    label: [
      { text: "Developer", style: S.title },
      { text: "XP GAMES", style: S.green },
      { text: "2022", style: S.period },
    ],
  });
  const nitric = map.minorNode(...getNodePosition("nitric", 318, 132), {
    devKey: "nitric",
    color: "#fb923c",
    description: "Client collaboration work delivered for Nitric Studios.",
    label: [
      { text: "Developer", style: S.title },
      { text: "Nitric Studios", style: orangeStyle },
      { text: "2022", style: S.period },
    ],
  });
  const tsunamiDev = map.majorNode(...getNodePosition("tsunamiDev", 430, -150), {
    devKey: "tsunamiDev",
    color: "#60a5fa",
    iconPath: "images/tsunami_logo.png",
    description: "Joined Tsunami as Developer and Artist, delivering systems, assets, and gameplay content.",
    label: [
      { text: "Artist & Developer", style: S.title },
      { text: "Tsunami Studios", style: S.blue },
      { text: "2022 - 2023", style: S.period },
    ],
  });

  const tsunamiLead = map.minorNode(...getNodePosition("tsunamiLead", 520, -300), {
    devKey: "tsunamiLead",
    color: "#60a5fa",
    current: true,
    description: "Promoted to Project Lead, guiding technical execution and creative direction.",
    label: [
      { text: "Project Lead", style: S.title },
      { text: "Tsunami Studios", style: S.blue },
      { text: "2023 - Present", style: S.period },
    ],
  });

  const simplyBrilliant = map.majorNode(...getNodePosition("simplyBrilliant", 340, -410), {
    devKey: "simplyBrilliant",
    color: "#fbbf24",
    iconPath: "images/icon_placeholder.png",
    current: true,
    description: "Collaborating on vanilla+ marketplace projects with a strong base-game quality bar.",
    label: [
      { text: "Collaborator", style: S.title },
      { text: "Simply Brilliant", style: S.amber },
      { text: "Dec 2025 - Present", style: S.period },
    ],
  });

  map.defineVoronoiRegions(
    regionDefinitions.map((region) => ({
      id: region.id,
      color: region.color,
      tooltip: region.tooltip,
      points: getRegionPoints(region.id, region.fallbackPoints),
    })),
    {
      padding: 220,
      alpha: 34,
    },
  );

  // ─── Roads ───────────────────────────────────────────────────────────────

  map.road(modder, freelance);
  map.road(freelance, builder);
  map.road(builder, shapeAsset);
  map.road(shapeAsset, shapeLead);
  map.road(shapeLead, shapeDirector);
  map.road(shapeDirector, pixelmancer);
  map.road(pixelmancer, tsunamiDev);
  map.dottedRoad(pixelmancer, xp);
  map.dottedRoad(pixelmancer, nitric);
  map.road(pixelmancer, simplyBrilliant);
  map.road(tsunamiDev, tsunamiLead);

  if (DEV_LAYOUT_ALLOWED) {
    const wrap = document.getElementById("journey-canvas-wrap");
    if (wrap && !document.getElementById("journey-dev-layout-banner")) {
      const banner = document.createElement("div");
      banner.id = "journey-dev-layout-banner";
      banner.textContent = "DEV LAYOUT MODE: drag nodes/seeds, shift+click seed deletes, shift+click region adds, P exports";
      banner.style.position = "absolute";
      banner.style.left = "10px";
      banner.style.top = "10px";
      banner.style.zIndex = "40";
      banner.style.padding = "6px 8px";
      banner.style.fontFamily = "Silkscreen, monospace";
      banner.style.fontSize = "10px";
      banner.style.letterSpacing = "0.08em";
      banner.style.color = "#fde68a";
      banner.style.background = "rgba(17, 24, 40, 0.92)";
      banner.style.border = "2px solid rgba(251, 146, 60, 0.55)";
      banner.style.pointerEvents = "none";
      wrap.appendChild(banner);
    }

    map.enableDevLayout({
      onExport(payload) {
        const layout = {
          nodePositions: {},
          regionSeedPoints: {},
        };

        for (const row of payload.nodes || []) {
          layout.nodePositions[row.id] = { x: row.x, y: row.y };
        }

        for (const region of payload.regions || []) {
          layout.regionSeedPoints[region.id] = region.points;
        }

        const snippet = formatExportSnippet(layout);
        console.log("[JourneyMap] Exported node positions:\n" + snippet);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(snippet)
            .then(() => {
              console.info("[JourneyMap] Node positions copied to clipboard.");
            })
            .catch(() => {
              console.info("[JourneyMap] Clipboard write failed. Copy from console output.");
            });
        }
      },
    });
  }
});
