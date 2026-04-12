/**
 * journey-map.js  —  RPG Career Map Drawing Library
 * ═══════════════════════════════════════════════════
 *
 * A small, modular p5.js drawing library.
 * Exposes one global: JourneyMap
 *
 * ── Usage ──────────────────────────────────────────────────────────────────────
 *
 *   JourneyMap.init(function(map) {
 *
 *     const start = map.originNode(120, 300, {
 *       label:       "The Beginning",
 *       color:       "#9ca3af",
 *       description: "Where it all started.",
 *       period:      "2016",
 *     });
 *
 *     const shapescape = map.majorNode(320, 240, {
 *       company:     "Shapescape",
 *       title:       "Asset Creator",
 *       color:       "#c084fc",
 *       description: "First studio role.",
 *       period:      "2019 – 2021",
 *       labelAbove:  true,
 *     });
 *
 *     const lead = map.minorNode(480, 200, {
 *       company:     "Shapescape",
 *       title:       "Branch Lead",
 *       color:       "#c084fc",
 *       description: "Promoted.",
 *       period:      "2021 – 2022",
 *       labelAbove:  true,
 *     });
 *
 *     const tsunami = map.majorNode(700, 280, {
 *       company:     "Tsunami Studios",
 *       title:       "Developer",
 *       color:       "#60a5fa",
 *       period:      "2022 – Present",
 *       current:     true,
 *     });
 *
 *     map.road(start, shapescape);
 *     map.road(shapescape, lead);
 *     map.road(lead, tsunami);
 *
 *     map.compass(1340, 540);
 *     map.cartouche(30, 20, { title: "Angelo's World" });
 *   });
 *
 * ── API Reference ───────────────────────────────────────────────────────────────
 *
 *   map.originNode(x, y, opts)   → node
 *     opts: label, color, description, period, labelAbove
 *
 *   map.majorNode(x, y, opts)    → node
 *     opts: company, title, description, color, current, period, iconPath, labelAbove
 *
 *   map.minorNode(x, y, opts)    → node
 *     opts: company, title, description, color, current, period, labelAbove
 *
 *   map.road(nodeA, nodeB, color?)
 *
 *   map.compass(x, y, size?)
 *
 *   map.cartouche(x, y, opts)
 *
 *   map.preloadIcon(path)
 *
 */

"use strict";

window.JourneyMap = (function () {
  // ── Constants ─────────────────────────────────────────────────────────────────

  const CW = 1200; // canvas width  (internal resolution)
  const CH = 1000; // canvas height (internal resolution)

  const MAJOR_S   = 20;  // half-size of square marker
  const MINOR_S   = 13;  // half-size of diamond marker
  const ORIGIN_R  = 14;  // radius of origin circle
  const LABEL_GAP = 10;  // gap from marker edge to first label line
  const LINE_H    = 20;  // vertical spacing between label lines
  const DASH_ON   = 10;  // dashed line: on segment
  const DASH_OFF  = 7;   // dashed line: off segment

  // ── State ─────────────────────────────────────────────────────────────────────

  let p5inst     = null;
  let nodes      = [];
  let drawCalls  = [];
  let regions    = [];
  let mapLabels  = [];
  let hovered    = null;
  let imageCache = {};
  let pendingIcons = [];

  // ── Tooltip DOM ───────────────────────────────────────────────────────────────

  const tip     = document.getElementById("journey-tooltip");
  const tipCo   = document.getElementById("jt-company");
  const tipKind = document.getElementById("jt-kind");
  const tipTitle= document.getElementById("jt-title");
  const tipDesc = document.getElementById("jt-desc");
  const tipPeriod = document.getElementById("jt-period");

  function showTip(node) {
    const wrap = document.getElementById("journey-canvas-wrap");
    const rect = wrap.getBoundingClientRect();
    const sx = CW / rect.width;
    const sy = CH / rect.height;
    const px = node.x / sx;
    const py = node.y / sy;

    const tw = 244, th = 150;
    let left = px + 20, top = py - 18;
    if (left + tw > rect.width  - 8) left = px - tw - 20;
    if (top  + th > rect.height - 8) top  = rect.height - th - 8;
    if (top  < 4) top  = 4;
    if (left < 4) left = 4;

    tip.style.left = left + "px";
    tip.style.top  = top  + "px";
    tipCo.textContent     = node.opts.company || node.opts.label || "";
    tipKind.textContent   = { origin: "Origin", major: "Destination", promotion: "Promotion" }[node.kind] || "";
    tipTitle.textContent  = node.opts.title  || "";
    tipDesc.textContent   = node.opts.description || "";
    if (tipPeriod) {
      tipPeriod.textContent = node.opts.period || "";
      tipPeriod.style.display = node.opts.period ? "" : "none";
    }
    tip.classList.remove("hidden");
  }

  function hideTip() { tip.classList.add("hidden"); }

  // ── Utilities ─────────────────────────────────────────────────────────────────

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  // ── p5 drawing helpers ────────────────────────────────────────────────────────

  function pxText(str, x, y, style) {
    const { size, fillColor, alignH = "center", strokeColor = 0, strokeWeight = 5 } = style;
    const p = p5inst;
    p.textSize(size);
    p.textAlign(alignH === "center" ? p.CENTER : alignH === "left" ? p.LEFT : p.RIGHT, p.BASELINE);
    p.stroke(strokeColor);
    p.strokeWeight(strokeWeight);
    p.fill(fillColor);
    p.text(str, x, y);
  }

  function dashedLine(x1, y1, x2, y2, colorStr, weight) {
    const p = p5inst;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const ux = dx / len, uy = dy / len;
    p.strokeWeight(weight);
    p.stroke(colorStr);
    p.noFill();
    let t = 0, on = true;
    while (t < len) {
      const seg = on ? DASH_ON : DASH_OFF;
      const end = Math.min(t + seg, len);
      if (on) p.line(x1 + ux * t, y1 + uy * t, x1 + ux * end, y1 + uy * end);
      t += seg;
      on = !on;
    }
    p.noStroke();
  }

  function drawRoad(dc) {
    const color = dc.color || dc.b.opts.color || "#6b7280";
    dashedLine(dc.a.x, dc.a.y, dc.b.x, dc.b.y, "rgba(0,0,0,0.55)", 7);
    dashedLine(dc.a.x, dc.a.y, dc.b.x, dc.b.y, "#1a1408", 4);
    dashedLine(dc.a.x, dc.a.y, dc.b.x, dc.b.y, color, 2.5);
  }

  // ── Label renderer ────────────────────────────────────────────────────────────
  // Layout (top to bottom when labelAbove = false):
  //   1. Role / title  — largest, white
  //   2. Company       — smaller, accent color
  //   3. Period        — smallest, muted gray

  function drawLabel(x, y, markerEdge, node) {
    const above  = node.opts.labelAbove ?? false;
    const dir    = above ? -1 : 1;
    const o      = node.opts;

    // Starting y: first line sits just outside the marker edge
    // When going down (dir=1): first line baseline = markerEdge + gap + lineH
    // When going up  (dir=-1): first line baseline = -(markerEdge + gap)
    const base = y + dir * (markerEdge + LABEL_GAP + LINE_H);

    // ── Line 1: Role / title — big white ──────────────────────────────────────
    const roleName = o.title || o.label || "";
    pxText(roleName, x, base, {
      size:         19,
      fillColor:    "#f3f4f6",
      alignH:       "center",
      strokeColor:  0,
      strokeWeight: 5,
    });

    // ── Line 2: Company — smaller, accent color ────────────────────────────────
    if (o.company) {
      pxText(o.company, x, base + dir * LINE_H, {
        size:         11,
        fillColor:    o.color || "#ffffff",
        alignH:       "center",
        strokeColor:  0,
        strokeWeight: 4,
      });
    }

    // ── Line 3: Period — smallest, gray ───────────────────────────────────────
    if (o.period) {
      pxText(o.period, x, base + dir * LINE_H * 2, {
        size:         9,
        fillColor:    "#6b7280",
        alignH:       "center",
        strokeColor:  0,
        strokeWeight: 4,
      });
    }
  }

  // ── Current pulse helpers ─────────────────────────────────────────────────────
  // Each pulse matches the shape of its host node and has a double-ring + glow.

  function pulseRect(p, x, y, S, rgb) {
    const t  = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90; // staggered second ring

    for (const [phase, strokeMult] of [[t, 1], [t2, 0.6]]) {
      const expand = phase * 28;
      const alpha  = Math.round((1 - phase) * 120 * strokeMult);
      if (alpha <= 0) continue;
      const ps = S + 8 + expand;
      p.noFill();
      p.stroke(rgb[0], rgb[1], rgb[2], alpha);
      p.strokeWeight(2);
      p.rect(x - ps, y - ps, ps * 2, ps * 2);
    }

    // Soft glow behind the node
    const gAlpha = 30 + Math.sin((p.frameCount / 90) * Math.PI * 2) * 12;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], gAlpha);
    p.rect(x - S - 6, y - S - 6, (S + 6) * 2, (S + 6) * 2);
  }

  function pulseDiamond(p, x, y, S, rgb) {
    const t  = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90;

    for (const [phase, strokeMult] of [[t, 1], [t2, 0.6]]) {
      const expand = phase * 22;
      const alpha  = Math.round((1 - phase) * 120 * strokeMult);
      if (alpha <= 0) continue;
      const ps = S + 7 + expand;
      p.noFill();
      p.stroke(rgb[0], rgb[1], rgb[2], alpha);
      p.strokeWeight(2);
      p.push();
      p.translate(x, y);
      p.rotate(p.QUARTER_PI);
      p.rect(-ps, -ps, ps * 2, ps * 2);
      p.pop();
    }

    const gAlpha = 30 + Math.sin((p.frameCount / 90) * Math.PI * 2) * 12;
    p.noStroke();
    p.push();
    p.translate(x, y);
    p.rotate(p.QUARTER_PI);
    p.fill(rgb[0], rgb[1], rgb[2], gAlpha);
    p.rect(-(S + 5), -(S + 5), (S + 5) * 2, (S + 5) * 2);
    p.pop();
  }

  function pulseCircle(p, x, y, R, rgb) {
    const t  = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90;

    for (const [phase, strokeMult] of [[t, 1], [t2, 0.6]]) {
      const expand = phase * 24;
      const alpha  = Math.round((1 - phase) * 120 * strokeMult);
      if (alpha <= 0) continue;
      p.noFill();
      p.stroke(rgb[0], rgb[1], rgb[2], alpha);
      p.strokeWeight(2);
      p.ellipse(x, y, (R + 8 + expand) * 2, (R + 8 + expand) * 2);
    }

    const gAlpha = 30 + Math.sin((p.frameCount / 90) * Math.PI * 2) * 12;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], gAlpha);
    p.ellipse(x, y, (R + 5) * 2, (R + 5) * 2);
  }

  // ── Node draw ─────────────────────────────────────────────────────────────────

  function drawNode(node) {
    const p = p5inst;
    const { x, y, kind, opts } = node;
    const hov = node === hovered;
    const rgb = hexToRgb(opts.color || "#9ca3af");
    const cr  = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a / 255})`;

    if (kind === "origin") {
      const r = ORIGIN_R;

      // Current pulse — drawn BEHIND the node body
      if (opts.current) pulseCircle(p, x, y, r, rgb);

      // Shadow
      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.ellipse(x + 3, y + 3, r * 2, r * 2);
      // Body
      p.fill("#0d0b07");
      p.stroke(cr(190));
      p.strokeWeight(2);
      p.ellipse(x, y, r * 2, r * 2);
      // Inner ring
      p.noFill();
      p.stroke(cr(110));
      p.strokeWeight(1);
      p.ellipse(x, y, r * 1.1 * 2, r * 1.1 * 2);
      // Center dot
      p.fill(cr(230));
      p.noStroke();
      p.ellipse(x, y, 7, 7);
      // Hover ring
      if (hov) {
        p.noFill();
        p.stroke(cr(160));
        p.strokeWeight(1.5);
        p.ellipse(x, y, (r + 9) * 2, (r + 9) * 2);
      }

      drawLabel(x, y, r, node);

    } else if (kind === "major") {
      const S = MAJOR_S + (hov ? 2 : 0);

      // Current pulse — drawn BEHIND the node body
      if (opts.current) pulseRect(p, x, y, MAJOR_S, rgb);

      // Shadow
      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.rect(x - S + 4, y - S + 4, S * 2, S * 2);
      // Body
      p.fill(17, 24, 40);
      p.stroke(cr(220));
      p.strokeWeight(2.5);
      p.rect(x - S, y - S, S * 2, S * 2);

      // Icon or placeholder fill
      const img = imageCache[opts.iconPath];
      if (img) {
        p.image(img, x - S + 3, y - S + 3, S * 2 - 6, S * 2 - 6);
      } else {
        p.fill(rgb[0], rgb[1], rgb[2], 28);
        p.noStroke();
        p.rect(x - S + 4, y - S + 4, S * 2 - 8, S * 2 - 8);
      }

      drawLabel(x, y, MAJOR_S, node);

    } else if (kind === "promotion") {
      const S = MINOR_S + (hov ? 2 : 0);

      // Current pulse — drawn BEHIND the node body
      if (opts.current) pulseDiamond(p, x, y, MINOR_S, rgb);

      p.push();
      p.translate(x, y);
      p.rotate(p.QUARTER_PI);
      // Shadow
      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.rect(-S + 3, -S + 3, S * 2, S * 2);
      // Body
      p.fill(17, 24, 40);
      p.stroke(cr(220));
      p.strokeWeight(2);
      p.rect(-S, -S, S * 2, S * 2);
      // Inner fill
      p.fill(rgb[0], rgb[1], rgb[2], 185);
      p.noStroke();
      p.rect(-S * 0.44, -S * 0.44, S * 0.88, S * 0.88);
      p.pop();

      drawLabel(x, y, MINOR_S + 4, node);
    }
  }

  // ── Background ────────────────────────────────────────────────────────────────

  function drawBackground() { p5inst.clear(); }

  // ── Region polygon ────────────────────────────────────────────────────────────

  function drawRegion(dc) {
    const p = p5inst;
    const pts = dc.points;
    if (!pts || pts.length < 3) return;
    const rgb  = hexToRgb(dc.color || "#6b7280");
    const alph = dc.alpha ?? 40;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], alph);
    p.beginShape();
    for (const [x, y] of pts) p.vertex(x, y);
    p.endShape(p.CLOSE);
    p.noFill();
    p.stroke(rgb[0], rgb[1], rgb[2], Math.min(alph * 2.5, 120));
    p.strokeWeight(1);
    p.beginShape();
    for (const [x, y] of pts) p.vertex(x, y);
    p.endShape(p.CLOSE);
    p.noStroke();
  }

  // ── Map label ─────────────────────────────────────────────────────────────────

  function drawMapLabel(dc) {
    const p = p5inst;
    const rgb = hexToRgb(dc.color || "#9ca3af");
    p.textFont("Silkscreen");
    p.textSize(dc.size || 22);
    p.textAlign(p.CENTER, p.BASELINE);
    p.noStroke();
    p.fill(0, 0, 0, 120);
    p.text(dc.text, dc.x + 1, dc.y + 1);
    p.fill(rgb[0], rgb[1], rgb[2], dc.opacity ?? 140);
    p.text(dc.text, dc.x, dc.y);
  }

  // ── Compass & Cartouche (unchanged) ──────────────────────────────────────────

  function drawCompass(cx, cy, size) {
    const p   = p5inst;
    const s   = size || 28;
    const arm = s;

    p.push();
    p.translate(cx, cy);

    // Outer ring
    p.noFill();
    p.stroke("#4b3a1e");
    p.strokeWeight(1.5);
    p.ellipse(0, 0, s * 2.2, s * 2.2);

    // Cardinal arms
    const dirs = [
      [0, -arm, "N"],
      [0,  arm, "S"],
      [arm,  0, "E"],
      [-arm, 0, "W"],
    ];
    for (const [dx, dy, label] of dirs) {
      p.stroke("#a08050");
      p.strokeWeight(1.5);
      p.line(0, 0, dx * 0.55, dy * 0.55);
      p.noStroke();
      p.fill("#c8a060");
      p.triangle(dx * 0.55, dy * 0.55, -dy * 5, dx * 5, dx * arm, dy * arm);
      p.fill("#7a6040");
      p.triangle(dx * 0.55, dy * 0.55, dy * 5, -dx * 5, dx * arm, dy * arm);

      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.stroke(0);
      p.strokeWeight(3);
      p.fill(label === "N" ? "#f3c060" : "#a08050");
      p.text(label, dx * 1.38, dy * 1.38);
    }

    // Center dot
    p.noStroke();
    p.fill("#1a1408");
    p.ellipse(0, 0, 7, 7);
    p.fill("#f3c060");
    p.ellipse(0, 0, 4, 4);

    p.pop();
  }

  function drawCartouche(cx, cy, opts = {}) {
    const p = p5inst;
    const title    = opts.title    || "Career Map";
    const subtitle = opts.subtitle || "";
    const W = 220, H = subtitle ? 68 : 48, pad = 8;

    p.push();
    p.translate(cx, cy);

    // Shadow
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(4, 4, W, H, 2);

    // Background parchment
    p.fill(28, 20, 10, 220);
    p.stroke("#6b4c1e");
    p.strokeWeight(1.5);
    p.rect(0, 0, W, H, 2);

    // Inner border
    p.noFill();
    p.stroke("#4b3218");
    p.strokeWeight(0.8);
    p.rect(pad / 2, pad / 2, W - pad, H - pad, 1);

    // Title
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.stroke(0);
    p.strokeWeight(4);
    p.fill("#e8c880");
    p.text(title, W / 2, pad + 2);

    // Subtitle
    if (subtitle) {
      p.textSize(8);
      p.stroke(0);
      p.strokeWeight(3);
      p.fill("#a08050");
      p.text(subtitle, W / 2, pad + 22);
    }

    p.pop();
  }

  // ── p5 sketch factory ─────────────────────────────────────────────────────────

  function createSketch(userSetup) {
    new p5(function (p) {
      p5inst = p;

      p.preload = function () {
        for (const { path } of pendingIcons) imageCache[path] = p.loadImage(path);
      };

      p.setup = function () {
        const wrap = document.getElementById("journey-canvas-wrap");
        const cnv  = p.createCanvas(CW, CH);
        cnv.parent(wrap);
        cnv.style("background", "transparent");
        p.textFont("Silkscreen");
        p.frameRate(30);
        p.noLoop();

        userSetup(publicAPI);

        if (nodes.some((n) => n.opts.current)) p.loop();
      };

      p.draw = function () {
        drawBackground();
        for (const r  of regions)   drawRegion(r);
        for (const l  of mapLabels) drawMapLabel(l);
        for (const dc of drawCalls) {
          if (dc.kind === "road")      drawRoad(dc);
          if (dc.kind === "compass")   drawCompass(dc.x, dc.y, dc.size);
          if (dc.kind === "cartouche") drawCartouche(dc.x, dc.y, dc.opts);
        }
        for (const node of nodes) drawNode(node);
      };

      p.mouseMoved = function () {
        const mx = p.mouseX, my = p.mouseY;
        if (mx < 0 || my < 0 || mx > CW || my > CH) {
          if (hovered) { hovered = null; hideTip(); if (!p.isLooping()) p.redraw(); }
          return;
        }

        let found = null;
        for (const node of nodes) {
          const hitR = node.kind === "major"     ? MAJOR_S + 12
                     : node.kind === "promotion" ? MINOR_S + 12
                     : ORIGIN_R + 12;
          if (Math.hypot(node.x - mx, node.y - my) < hitR) { found = node; break; }
        }

        if (found !== hovered) {
          hovered = found;
          const wrap = document.getElementById("journey-canvas-wrap");
          if (found) { showTip(found); wrap.style.cursor = "pointer"; }
          else       { hideTip();      wrap.style.cursor = "default";  }
          if (!p.isLooping()) p.redraw();
        }
      };

      p.mouseExited = function () {
        if (hovered) { hovered = null; hideTip(); if (!p.isLooping()) p.redraw(); }
      };
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  const publicAPI = {
    originNode(x, y, opts = {}) {
      const node = { x, y, kind: "origin", opts: { color: "#9ca3af", ...opts } };
      nodes.push(node);
      return node;
    },
    majorNode(x, y, opts = {}) {
      const node = { x, y, kind: "major", opts: { color: "#c084fc", ...opts } };
      nodes.push(node);
      return node;
    },
    minorNode(x, y, opts = {}) {
      const node = { x, y, kind: "promotion", opts: { color: "#c084fc", ...opts } };
      nodes.push(node);
      return node;
    },
    road(nodeA, nodeB, color) {
      drawCalls.push({ kind: "road", a: nodeA, b: nodeB, color: color || null });
    },
    compass(x, y, size = 28) {
      drawCalls.push({ kind: "compass", x, y, size });
    },
    cartouche(x, y, opts = {}) {
      drawCalls.push({ kind: "cartouche", x, y, opts });
    },
    preloadIcon(path) {
      pendingIcons.push({ path });
    },
    region(points, color, alpha) {
      regions.push({ points, color: color || "#6b7280", alpha: alpha ?? 40 });
    },
    label(text, x, y, opts = {}) {
      mapLabels.push({ text, x, y, ...opts });
    },
  };

  return {
    init(setupCallback) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => createSketch(setupCallback));
      } else {
        createSketch(setupCallback);
      }
    },
  };
})();