"use strict";

window.JourneyMap = (function () {

  // -- Canvas constants ----------------------------------------------------------

  const CW       = 1200; // internal canvas width
  const CH       = 1000; // internal canvas height

  const MAJOR_S  = 20;   // major node half-size (square)
  const MINOR_S  = 13;   // minor node half-size (diamond)
  const ORIGIN_R = 14;   // origin node radius (circle)
  const LABEL_GAP = 10;  // gap between marker edge and first label line
  const LINE_H    = 20;  // vertical spacing between label lines
  const DASH_ON   = 10;  // road dash: painted segment length
  const DASH_OFF  = 7;   // road dash: gap segment length

  // -- Text styles ---------------------------------------------------------------
  // Used in node label arrays: { text, style } where style is one of these keys.

  const TEXT_STYLES = {
    title:   { size: 19, fillColor: "#f3f4f6", strokeColor: 0, strokeWeight: 5 },
    company: { size: 16, fillColor: "#9ca3af", strokeColor: 0, strokeWeight: 4 },
    period:  { size: 11,  fillColor: "#f3f4f6", strokeColor: 0, strokeWeight: 4 },
    purple:  { size: 16, fillColor: "#c084fc", strokeColor: 0, strokeWeight: 4 },
    blue:    { size: 16, fillColor: "#60a5fa", strokeColor: 0, strokeWeight: 4 },
    green:   { size: 16, fillColor: "#4ade80", strokeColor: 0, strokeWeight: 4 },
    amber:   { size: 16, fillColor: "#fbbf24", strokeColor: 0, strokeWeight: 4 },
    gray:    { size: 16, fillColor: "#9ca3af", strokeColor: 0, strokeWeight: 4 },
  };

  // -- State ---------------------------------------------------------------------

  let p5inst       = null;
  let nodes        = [];
  let roads        = [];
  let regions      = [];
  let mapLabels    = [];
  let hovered      = null;
  let imageCache   = {};
  let pendingIcons = [];

  // -- Tooltip -------------------------------------------------------------------

  const tip      = document.getElementById("journey-tooltip");
  const tipBar   = document.getElementById("jt-accent-bar");
  const tipCo    = document.getElementById("jt-company");
  const tipTitle = document.getElementById("jt-title");
  const tipDesc  = document.getElementById("jt-desc");
  const tipPeriod = document.getElementById("jt-period");

  function showTip(node) {
    const wrap = document.getElementById("journey-canvas-wrap");
    const rect = wrap.getBoundingClientRect();
    const px   = node.x / (CW / rect.width);
    const py   = node.y / (CH / rect.height);

    const tw = 244, th = 180;
    let left = px + 20, top = py - 18;
    if (left + tw > rect.width  - 8) left = px - tw - 20;
    if (top  + th > rect.height - 8) top  = rect.height - th - 8;
    if (top  < 4) top  = 4;
    if (left < 4) left = 4;

    tip.style.left = left + "px";
    tip.style.top  = top  + "px";

    const color  = node.opts.color || "#9ca3af";
    const labels = node.opts.label || [];

    if (tipBar)   tipBar.style.background = color;
    tipCo.textContent    = labels[0]?.text || "";
    tipCo.style.color    = color;

    tipTitle.textContent = labels[1]?.text || "";

    const desc = node.opts.description || "";
    tipDesc.textContent   = desc;
    tipDesc.classList.toggle("hidden", !desc);

    const period = labels.length > 2 ? (labels[labels.length - 1]?.text || "") : "";
    tipPeriod.textContent = period;
    tipPeriod.classList.toggle("hidden", !period);

    tip.classList.remove("hidden");
  }

  function hideTip() {
    tip.classList.add("hidden");
  }

  // -- Utilities -----------------------------------------------------------------

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  // -- Drawing helpers -----------------------------------------------------------

  function pxText(str, x, y, style) {
    const { size, fillColor, alignH = "center", strokeColor = 0, strokeWeight = 5 } = style;
    const p = p5inst;
    p.textSize(size);
    p.textAlign(
      alignH === "center" ? p.CENTER : alignH === "left" ? p.LEFT : p.RIGHT,
      p.BASELINE,
    );
    p.stroke(strokeColor);
    p.strokeWeight(strokeWeight);
    p.fill(fillColor);
    p.text(str, x, y);
  }

  function dashedLine(x1, y1, x2, y2, colorStr, weight) {
    const p   = p5inst;
    const dx  = x2 - x1, dy = y2 - y1;
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
      t  += seg;
      on  = !on;
    }
    p.noStroke();
  }

  // -- Road ---------------------------------------------------------------------

  function drawRoad(road) {
    const color = road.color || road.b.opts.color || "#6b7280";
    dashedLine(road.a.x, road.a.y, road.b.x, road.b.y, "rgba(0,0,0,0.55)", 7);
    dashedLine(road.a.x, road.a.y, road.b.x, road.b.y, "#1a1408",          4);
    dashedLine(road.a.x, road.a.y, road.b.x, road.b.y, color,              2.5);
  }

  // -- Node labels ---------------------------------------------------------------
  // node.opts.label: array of { text, style }
  // Lines stack downward from the anchor point.
  // labelOffset [dx, dy] shifts the anchor from the node center.
  // Default: [0, markerEdge + LABEL_GAP + LINE_H] (below the marker).

  function drawLabel(x, y, markerEdge, node) {
    const labels = node.opts.label;
    if (!labels?.length) return;
    const [dx, dy] = node.opts.labelOffset ?? [0, markerEdge + LABEL_GAP + LINE_H];
    for (let i = 0; i < labels.length; i++) {
      pxText(labels[i].text, x + dx, y + dy + LINE_H * i, { alignH: "center", ...labels[i].style });
    }
  }

  // -- Pulse animations ----------------------------------------------------------
  // Drawn behind the node body. Double-ring + soft glow.

  function pulseRect(p, x, y, S, rgb) {
    const t  = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90;

    for (const [phase, mult] of [[t, 1], [t2, 0.6]]) {
      const alpha = Math.round((1 - phase) * 120 * mult);
      if (alpha <= 0) continue;
      const ps = S + 8 + phase * 28;
      p.noFill();
      p.stroke(rgb[0], rgb[1], rgb[2], alpha);
      p.strokeWeight(2);
      p.rect(x - ps, y - ps, ps * 2, ps * 2);
    }

    const gAlpha = 30 + Math.sin((p.frameCount / 90) * Math.PI * 2) * 12;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], gAlpha);
    p.rect(x - S - 6, y - S - 6, (S + 6) * 2, (S + 6) * 2);
  }

  function pulseDiamond(p, x, y, S, rgb) {
    const t  = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90;

    for (const [phase, mult] of [[t, 1], [t2, 0.6]]) {
      const alpha = Math.round((1 - phase) * 120 * mult);
      if (alpha <= 0) continue;
      const ps = S + 7 + phase * 22;
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

    for (const [phase, mult] of [[t, 1], [t2, 0.6]]) {
      const alpha = Math.round((1 - phase) * 120 * mult);
      if (alpha <= 0) continue;
      p.noFill();
      p.stroke(rgb[0], rgb[1], rgb[2], alpha);
      p.strokeWeight(2);
      p.ellipse(x, y, (R + 8 + phase * 24) * 2, (R + 8 + phase * 24) * 2);
    }

    const gAlpha = 30 + Math.sin((p.frameCount / 90) * Math.PI * 2) * 12;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], gAlpha);
    p.ellipse(x, y, (R + 5) * 2, (R + 5) * 2);
  }

  // -- Node rendering ------------------------------------------------------------

  function drawNode(node) {
    const p   = p5inst;
    const { x, y, kind, opts } = node;
    const hov = node === hovered;
    const rgb = hexToRgb(opts.color || "#9ca3af");
    const cr  = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a / 255})`;

    if (kind === "origin") {
      const r = ORIGIN_R;
      if (opts.current) pulseCircle(p, x, y, r, rgb);

      p.fill("rgba(0,0,0,0.5)"); p.noStroke();
      p.ellipse(x + 3, y + 3, r * 2, r * 2);              // shadow

      p.fill("#0d0b07"); p.stroke(cr(190)); p.strokeWeight(2);
      p.ellipse(x, y, r * 2, r * 2);                       // body

      p.noFill(); p.stroke(cr(110)); p.strokeWeight(1);
      p.ellipse(x, y, r * 1.1 * 2, r * 1.1 * 2);          // inner ring

      p.fill(cr(230)); p.noStroke();
      p.ellipse(x, y, 7, 7);                               // center dot

      if (hov) {
        p.noFill(); p.stroke(cr(160)); p.strokeWeight(1.5);
        p.ellipse(x, y, (r + 9) * 2, (r + 9) * 2);        // hover ring
      }

      drawLabel(x, y, r, node);

    } else if (kind === "major") {
      const S = MAJOR_S + (hov ? 2 : 0);
      if (opts.current) pulseRect(p, x, y, MAJOR_S, rgb);

      p.fill("rgba(0,0,0,0.5)"); p.noStroke();
      p.rect(x - S + 4, y - S + 4, S * 2, S * 2);         // shadow

      p.fill(17, 24, 40); p.stroke(cr(220)); p.strokeWeight(2.5);
      p.rect(x - S, y - S, S * 2, S * 2);                  // body

      const img = imageCache[opts.iconPath];
      if (img) {
        p.image(img, x - S + 3, y - S + 3, S * 2 - 6, S * 2 - 6);
      } else {
        p.fill(rgb[0], rgb[1], rgb[2], 28); p.noStroke();
        p.rect(x - S + 4, y - S + 4, S * 2 - 8, S * 2 - 8); // tinted fill
      }

      drawLabel(x, y, MAJOR_S, node);

    } else if (kind === "promotion") {
      const S = MINOR_S + (hov ? 2 : 0);
      if (opts.current) pulseDiamond(p, x, y, MINOR_S, rgb);

      p.push();
      p.translate(x, y);
      p.rotate(p.QUARTER_PI);

      p.fill("rgba(0,0,0,0.5)"); p.noStroke();
      p.rect(-S + 3, -S + 3, S * 2, S * 2);               // shadow

      p.fill(17, 24, 40); p.stroke(cr(220)); p.strokeWeight(2);
      p.rect(-S, -S, S * 2, S * 2);                        // body

      p.fill(rgb[0], rgb[1], rgb[2], 185); p.noStroke();
      p.rect(-S * 0.44, -S * 0.44, S * 0.88, S * 0.88);   // inner fill

      p.pop();
      drawLabel(x, y, MINOR_S + 4, node);
    }
  }

  // -- Region polygon ------------------------------------------------------------

  function drawRegion(region) {
    const p    = p5inst;
    const pts  = region.points;
    if (!pts || pts.length < 3) return;
    const rgb  = hexToRgb(region.color || "#6b7280");
    const alph = region.alpha ?? 40;

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

  // -- Map label -----------------------------------------------------------------

  function drawMapLabel(lbl) {
    const p   = p5inst;
    const rgb = hexToRgb(lbl.color || "#9ca3af");
    p.textFont("Silkscreen");
    p.textSize(lbl.size || 22);
    p.textAlign(p.CENTER, p.BASELINE);
    p.noStroke();
    p.fill(0, 0, 0, 120);
    p.text(lbl.text, lbl.x + 1, lbl.y + 1);
    p.fill(rgb[0], rgb[1], rgb[2], lbl.opacity ?? 140);
    p.text(lbl.text, lbl.x, lbl.y);
  }

  // -- p5 sketch -----------------------------------------------------------------

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
        p.clear();
        for (const r of regions)   drawRegion(r);
        for (const l of mapLabels) drawMapLabel(l);
        for (const r of roads)     drawRoad(r);
        for (const n of nodes)     drawNode(n);
      };

      p.mouseMoved = function () {
        const mx = p.mouseX, my = p.mouseY;
        if (mx < 0 || my < 0 || mx > CW || my > CH) {
          if (hovered) { hovered = null; hideTip(); if (!p.isLooping()) p.redraw(); }
          return;
        }

        let found = null;
        for (const node of nodes) {
          const hitR = node.kind === "major"     ? MAJOR_S  + 12
                     : node.kind === "promotion" ? MINOR_S  + 12
                     :                             ORIGIN_R + 12;
          if (Math.hypot(node.x - mx, node.y - my) < hitR) { found = node; break; }
        }

        if (found !== hovered) {
          hovered = found;
          const wrap = document.getElementById("journey-canvas-wrap");
          if (found) { showTip(found); wrap.style.cursor = "pointer"; }
          else       { hideTip();      wrap.style.cursor = "default"; }
          if (!p.isLooping()) p.redraw();
        }
      };

      p.mouseExited = function () {
        if (hovered) { hovered = null; hideTip(); if (!p.isLooping()) p.redraw(); }
      };
    });
  }

  // -- Public API ----------------------------------------------------------------

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
      roads.push({ a: nodeA, b: nodeB, color: color || null });
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
    styles: TEXT_STYLES,
    init(setupCallback) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => createSketch(setupCallback));
      } else {
        createSketch(setupCallback);
      }
    },
  };
})();
