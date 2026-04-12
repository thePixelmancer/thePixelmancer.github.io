/**
 * journey.js  —  Angelo's Career Map
 * ════════════════════════════════════
 *
 * Edit node positions and connections here.
 * Canvas internal resolution: 1200 × 1000
 *
 * ── Color reference ────────────────────────────────────────────────────────
 *
 *   Independent      / green    #4ade80
 *   Shapescape       / purple   #c084fc
 *   Tsunami          / blue     #60a5fa
 *   Simply Brilliant / amber    #fbbf24
 *   Origin           / gray     #9ca3af
 *
 */

JourneyMap.init(function (map) {

  // ─── Nodes ───────────────────────────────────────────────────────────────

  const modder = map.originNode(200, 800, {
    label:       "Java Modder",
    color:       "#4ade80",
    description: "Started tinkering with Java mods. The spark that started everything.",
    period:      "2016",
    labelAbove:  false,
  });

  const freelance = map.majorNode(450, 800, {
    company:     "Independent",
    title:       "Freelance Designer",
    color:       "#4ade80",
    description: "Went out on my own. Bedrock contracts, asset work, learning the ecosystem.",
    period:      "2017 – 2018",
    labelAbove:  false,
  });

  const builder = map.majorNode(700, 780, {
    company:     "Independent",
    title:       "Minecraft Builder",
    color:       "#4ade80",
    description: "Went out on my own. Bedrock contracts, asset work, learning the ecosystem.",
    period:      "2018 – 2019",
    labelAbove:  false,
  });

  const shapeAsset = map.majorNode(980, 600, {
    company:     "Shapescape",
    title:       "Asset Creator",
    color:       "#c084fc",
    description: "First studio. Building assets and learning how a real pipeline operates.",
    period:      "2019 – 2020",
    labelAbove:  false,
  });

  const shapeLead = map.minorNode(800, 540, {
    company:     "Shapescape",
    title:       "Branch Lead",
    color:       "#c084fc",
    description: "Promoted. Stepped up into a leadership role within the studio.",
    period:      "2020 – 2021",
    labelAbove:  false,
  });

  const shapeDirector = map.minorNode(600, 500, {
    company:     "Shapescape",
    title:       "Art Director",
    color:       "#c084fc",
    description: "Art direction across projects — style guides, reviews, visual identity.",
    period:      "2021 – 2022",
    labelAbove:  false,
  });

  const pixelmancer = map.minorNode(500, 350, {
    company:     "Independent",
    title:       "Art Director",
    color:       "#4ade80",
    description: "Art direction across projects — style guides, reviews, visual identity.",
    period:      "2022 – Present",
    labelAbove:  false,
    current:     true,
  });

  const tsunamiDev = map.majorNode(800, 300, {
    company:     "Tsunami Studios",
    title:       "Asset Creator & Developer",
    color:       "#60a5fa",
    description: "Boss behaviors, scripting, art pipelines, full-stack add-on work.",
    period:      "2022 – 2023",
    labelAbove:  false,
  });

  const tsunamiLead = map.minorNode(750, 100, {
    company:     "Tsunami Studios",
    title:       "Project Lead",
    color:       "#60a5fa",
    description: "Promoted to lead. Steering technical and creative direction.",
    period:      "2023 – Present",
    labelAbove:  false,
    current:     true,
  });

  const simplyBrilliant = map.majorNode(450, 100, {
    company:     "Simply Brilliant",
    title:       "Asset Creator & Developer",
    color:       "#fbbf24",
    description: "New chapter, running parallel. Unannounced projects, new creative horizons.",
    period:      "2023 – Present",
    labelAbove:  false,
    current:     true,
  });

  // ─── Roads ───────────────────────────────────────────────────────────────

  map.road(modder,       freelance);
  map.road(freelance,    builder);
  map.road(builder,      shapeAsset);
  map.road(shapeAsset,   shapeLead);
  map.road(shapeLead,    shapeDirector);
  map.road(shapeDirector, pixelmancer);
  map.road(pixelmancer,  tsunamiDev);
  map.road(pixelmancer,  simplyBrilliant);
  map.road(tsunamiDev,   tsunamiLead);

});