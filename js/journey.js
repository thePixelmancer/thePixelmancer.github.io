JourneyMap.init(function (map) {
  const S = JourneyMap.styles;

  // ─── Nodes ───────────────────────────────────────────────────────────────

  const modder = map.originNode(-390, 350, {
    color:       "#4ade80",
    description: "Started tinkering with Java mods. The spark that started everything.",
    label: [
      { text: "Java Modder", style: S.title },
      { text: "2016",        style: S.period },
    ],
  });

  const freelance = map.majorNode(-140, 350, {
    color:       "#4ade80",
    description: "Went out on my own. Bedrock contracts, asset work, learning the ecosystem.",
    label: [
      { text: "Freelance Designer", style: S.title  },
      { text: "Independent",        style: S.green  },
      { text: "2017 – 2018",        style: S.period },
    ],
  });

  const builder = map.majorNode(110, 330, {
    color:       "#4ade80",
    description: "Hands-on build work. Detailed environments and game-ready structures.",
    label: [
      { text: "Minecraft Builder", style: S.title  },
      { text: "Independent",       style: S.green  },
      { text: "2018 – 2019",       style: S.period },
    ],
  });

  const shapeAsset = map.majorNode(390, 150, {
    color:       "#c084fc",
    description: "First studio. Building assets and learning how a real pipeline operates.",
    label: [
      { text: "Asset Creator", style: S.title  },
      { text: "Shapescape",    style: S.purple },
      { text: "2019 – 2020",   style: S.period },
    ],
  });

  const shapeLead = map.minorNode(210, 90, {
    color:       "#c084fc",
    description: "Promoted. Stepped up into a leadership role within the studio.",
    label: [
      { text: "Branch Lead",  style: S.title  },
      { text: "Shapescape",   style: S.purple },
      { text: "2020 – 2021",  style: S.period },
    ],
  });

  const shapeDirector = map.minorNode(10, 50, {
    color:       "#c084fc",
    description: "Art direction across projects — style guides, reviews, visual identity.",
    label: [
      { text: "Art Director", style: S.title  },
      { text: "Shapescape",   style: S.purple },
      { text: "2021 – 2022",  style: S.period },
    ],
  });

  const pixelmancer = map.minorNode(-90, -100, {
    color:       "#4ade80",
    current:     true,
    description: "Running my own brand. Creative direction, client work, and personal projects.",
    label: [
      { text: "Art Director",   style: S.title  },
      { text: "Independent",    style: S.green  },
      { text: "2022 – Present", style: S.period },
    ],
  });

  const tsunamiDev = map.majorNode(210, -150, {
    color:       "#60a5fa",
    description: "Boss behaviors, scripting, art pipelines, full-stack add-on work.",
    label: [
      { text: "Asset Creator & Developer", style: S.title  },
      { text: "Tsunami Studios",           style: S.blue   },
      { text: "2022 – 2023",               style: S.period },
    ],
  });

  const tsunamiLead = map.minorNode(160, -350, {
    color:       "#60a5fa",
    current:     true,
    description: "Promoted to lead. Steering technical and creative direction.",
    label: [
      { text: "Project Lead",    style: S.title  },
      { text: "Tsunami Studios", style: S.blue   },
      { text: "2023 – Present",  style: S.period },
    ],
  });

  const simplyBrilliant = map.majorNode(-140, -350, {
    color:       "#fbbf24",
    current:     true,
    description: "New chapter, running parallel. Unannounced projects, new creative horizons.",
    label: [
      { text: "Asset Creator & Developer", style: S.title  },
      { text: "Simply Brilliant",          style: S.amber  },
      { text: "2023 – Present",            style: S.period },
    ],
  });

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
