JourneyMap.init(function (map) {
  const S = JourneyMap.styles;
  map.preloadIcon("images/icon_placeholder.png");

  // ─── Nodes ───────────────────────────────────────────────────────────────

  const modder = map.originNode(-390, 350, {
    color: "#4ade80",
    description: "Started tinkering with Java mods. The spark that started everything.",
    label: [
      { text: "Java Modder", style: S.title },
      { text: "2016", style: S.period },
    ],
  });

  const freelance = map.majorNode(-140, 350, {
    color: "#4ade80",
    iconPath: "images/icon_placeholder.png",
    description: "Started professional freelance work across design, web, and Minecraft content production.",
    label: [
      { text: "Freelance Designer", style: S.title },
      { text: "Independent", style: S.green },
      { text: "2017 – 2018", style: S.period },
    ],
  });

  const builder = map.majorNode(110, 330, {
    color: "#4ade80",
    iconPath: "images/icon_placeholder.png",
    description: "Moved from building toward 3D modeling and production-ready asset workflows.",
    label: [
      { text: "Minecraft Builder", style: S.title },
      { text: "Independent", style: S.green },
      { text: "2018", style: S.period },
    ],
  });

  const shapeAsset = map.majorNode(390, 150, {
    color: "#c084fc",
    iconPath: "images/icon_placeholder.png",
    description: "Joined Shapescape as an Asset Creator and began shipping marketplace content at studio scale.",
    label: [
      { text: "Asset Creator", style: S.title },
      { text: "Shapescape", style: S.purple },
      { text: "2018 - 2019", style: S.period },
    ],
  });

  const shapeLead = map.minorNode(210, 90, {
    color: "#c084fc",
    description: "Promoted to Branch Lead, overseeing art quality and advising project direction. Also contributed dragon work to DragonFire for Spectral Studios via Cubecraft licensing.",
    label: [
      { text: "Branch Lead", style: S.title },
      { text: "Shapescape", style: S.purple },
      { text: "2019 - 2021", style: S.period },
    ],
  });

  const shapeDirector = map.minorNode(10, 50, {
    color: "#c084fc",
    description: "Briefly served as Art Director, leading style decisions and visual consistency.",
    label: [
      { text: "Art Director", style: S.title },
      { text: "Shapescape", style: S.purple },
      { text: "2021", style: S.period },
    ],
  });

  const pixelmancer = map.minorNode(-90, -100, {
    color: "#4ade80",
    current: true,
    description: "Running my own creative brand while shipping client work, original add-ons, and creator tooling.",
    label: [
      { text: "Art Director", style: S.title },
      { text: "Independent", style: S.green },
      { text: "2022 – Present", style: S.period },
    ],
  });

  const tsunamiDev = map.majorNode(210, -150, {
    color: "#60a5fa",
    iconPath: "images/icon_placeholder.png",
    description: "Joined Tsunami as Developer and Artist, delivering systems, assets, and gameplay content.",
    label: [
      { text: "Asset Creator & Developer", style: S.title },
      { text: "Tsunami Studios", style: S.blue },
      { text: "2022 – 2023", style: S.period },
    ],
  });

  const tsunamiLead = map.minorNode(160, -350, {
    color: "#60a5fa",
    current: true,
    description: "Promoted to Project Lead, guiding technical execution and creative direction.",
    label: [
      { text: "Project Lead", style: S.title },
      { text: "Tsunami Studios", style: S.blue },
      { text: "2023 – Present", style: S.period },
    ],
  });

  const simplyBrilliant = map.majorNode(-140, -350, {
    color: "#fbbf24",
    iconPath: "images/icon_placeholder.png",
    current: true,
    description: "Collaborating on vanilla+ marketplace projects with a strong base-game quality bar.",
    label: [
      { text: "Asset Creator & Developer", style: S.title },
      { text: "Simply Brilliant", style: S.amber },
      { text: "Dec 2025 - Present", style: S.period },
    ],
  });

  map.defineVoronoiRegions(
    [
      {
        color: "#9ca3af",
        tooltip: "guild-java-modding",
        points: [[-500, 350]],
      },
      {
        color: "#4ade80",
        tooltip: "guild-independent",
        points: [
          [-140, 350],
          [110, 330],
          [-90, -100],
          [-200, 100],
        ],
      },
      {
        color: "#c084fc",
        tooltip: "guild-shapescape",
        points: [
          [390, 150],
          [210, 90],
          [10, 50],
        ],
      },
      {
        color: "#60a5fa",
        tooltip: "guild-tsunami-studios",
        points: [
          [210, -150],
          [160, -350],
        ],
      },
      {
        color: "#fbbf24",
        tooltip: "guild-simply-brilliant",
        points: [
          [-140, -350],
          [-440, -250],
        ],
      },
    ],
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
  map.road(pixelmancer, simplyBrilliant);
  map.road(tsunamiDev, tsunamiLead);
});
