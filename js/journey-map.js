"use strict";

window.JourneyMap = (function () {
  // -- Canvas constants ----------------------------------------------------------

  const FALLBACK_VIEW_W = 800; // fallback canvas width when container has no measurable width yet
  const FALLBACK_VIEW_H = 600; // fallback canvas height when container has no measurable height yet
  const FALLBACK_WORLD_W = 800; // default world width used when no map content exists
  const FALLBACK_WORLD_H = 600; // default world height used when no map content exists
  const CONTENT_FIT_PAD = 140; // extra world-space padding around computed content bounds
  const LABEL_HALF_W = 170; // half-width reserved for labels when computing content bounds
  const MOBILE_START_ZOOM_MULT = 1.18; // initial zoom multiplier on phones relative to fitted min zoom
  const MAX_ZOOM_MULT = 4; // max zoom multiplier relative to fitted min zoom
  const MOBILE_USE_COVER_FIT = true; // if true, phone start fit uses cover (fills view and allows clipping)
  const WHEEL_ZOOM_SPEED = 0.0015; // wheel sensitivity for exponential zoom
  const DRAG_START_THRESHOLD_PX = 4; // pointer movement needed before drag is considered active
  const HIT_RADIUS_WORLD_PAD = 12; // extra world-space hit radius around node markers
  const HIT_RADIUS_SCREEN_MIN = 22; // minimum on-screen hit radius in pixels at high zoom-out
  const NODE_BOUNDS_PAD = 20; // extra marker padding included in content bounds
  const LABEL_TOP_PAD = 24; // top text offset used when estimating label bounds
  const MAP_LABEL_DEFAULT_SIZE = 22; // fallback map-region label font size
  const MAP_LABEL_WIDTH_FACTOR = 0.35; // estimated glyph width multiplier for map-label bounds
  const MAP_LABEL_MIN_HALF_W = 40; // minimum half-width used for map-label bounds
  const PHONE_BREAKPOINT_PX = 768; // viewport breakpoint where phone-specific zoom start is used
  const MIN_BOUNDS_SIZE = 1; // lower bound to avoid divide-by-zero when fitting zoom
  const EDGE_FADE_PX = 20; // fade distance at canvas edges before hard clip

  const MAJOR_S = 30; // major node half-size (square)
  const MINOR_S = 15; // minor node half-size (diamond)
  const ORIGIN_S = 14; // origin node half-size (square)
  const LABEL_GAP = 10; // gap between marker edge and first label line
  const LINE_H = 20; // vertical spacing between label lines
  const DASH_ON = 12; // road dash painted segment length
  const DASH_OFF = 8; // road dash gap segment length
  const ROAD_OUTLINE_W = 5; // road outline stroke width
  const ROAD_INNER_W = 3; // road inner stroke width
  const ROAD_OUTLINE_COLOR = "#1a1408"; // road outline color
  const ROAD_INNER_DASH_END_INSET = 0.9; // shorten each inner dash so outline is visible on dash ends

  // -- Text styles ---------------------------------------------------------------
  // Used in node label arrays: { text, style } where style is one of these keys.

  const TEXT_STYLES = {
    title: { size: 19, fillColor: "#f3f4f6", strokeColor: 0, strokeWeight: 5 },
    company: { size: 16, fillColor: "#9ca3af", strokeColor: 0, strokeWeight: 4 },
    period: { size: 11, fillColor: "#f3f4f6", strokeColor: 0, strokeWeight: 4 },
    purple: { size: 16, fillColor: "#c084fc", strokeColor: 0, strokeWeight: 4 },
    blue: { size: 16, fillColor: "#60a5fa", strokeColor: 0, strokeWeight: 4 },
    green: { size: 16, fillColor: "#4ade80", strokeColor: 0, strokeWeight: 4 },
    amber: { size: 16, fillColor: "#fbbf24", strokeColor: 0, strokeWeight: 4 },
    gray: { size: 16, fillColor: "#9ca3af", strokeColor: 0, strokeWeight: 4 },
  };

  // -- State ---------------------------------------------------------------------

  let p5inst = null;
  let nodes = [];
  let roads = [];
  let regions = [];
  let mapLabels = [];
  let hovered = null;
  let imageCache = {};
  let pendingIcons = [];
  let viewW = FALLBACK_VIEW_W;
  let viewH = FALLBACK_VIEW_H;
  let camera = {
    zoom: 1,
    minZoom: 1,
    maxZoom: 1,
    panX: 0,
    panY: 0,
  };
  let activePointers = new Map();
  let dragState = null;
  let pinchState = null;
  let wrapResizeObserver = null;
  let contentBounds = {
    minX: -FALLBACK_WORLD_W / 2,
    minY: -FALLBACK_WORLD_H / 2,
    maxX: FALLBACK_WORLD_W / 2,
    maxY: FALLBACK_WORLD_H / 2,
  };

  // -- Tooltip -------------------------------------------------------------------

  const tip = document.getElementById("journey-tooltip");
  const tipBar = document.getElementById("jt-accent-bar");
  const tipCo = document.getElementById("jt-company");
  const tipTitle = document.getElementById("jt-title");
  const tipDesc = document.getElementById("jt-desc");
  const tipPeriod = document.getElementById("jt-period");

  function showTip(node) {
    const wrap = document.getElementById("journey-canvas-wrap");
    const rect = wrap.getBoundingClientRect();
    const pt = worldToScreen(node.x, node.y);
    const px = (pt.x / viewW) * rect.width;
    const py = (pt.y / viewH) * rect.height;

    const tw = 244,
      th = 180;
    let left = px + 20,
      top = py - 18;
    if (left + tw > rect.width - 8) left = px - tw - 20;
    if (top + th > rect.height - 8) top = rect.height - th - 8;
    if (top < 4) top = 4;
    if (left < 4) left = 4;

    tip.style.left = left + "px";
    tip.style.top = top + "px";

    const color = node.opts.color || "#9ca3af";
    const labels = node.opts.label || [];

    if (tipBar) tipBar.style.background = color;
    tipCo.textContent = labels[0]?.text || "";
    tipCo.style.color = color;

    tipTitle.textContent = labels[1]?.text || "";

    const desc = node.opts.description || "";
    tipDesc.textContent = desc;
    tipDesc.classList.toggle("hidden", !desc);

    const period = labels.length > 2 ? labels[labels.length - 1]?.text || "" : "";
    tipPeriod.textContent = period;
    tipPeriod.classList.toggle("hidden", !period);

    tip.classList.remove("hidden");
  }

  function hideTip() {
    tip.classList.add("hidden");
  }

  function getHitRadius(node) {
    const base =
      node.kind === "major" ? MAJOR_S + HIT_RADIUS_WORLD_PAD
      : node.kind === "promotion" ? MINOR_S + HIT_RADIUS_WORLD_PAD
      : ORIGIN_S + HIT_RADIUS_WORLD_PAD;
    return Math.max(base, HIT_RADIUS_SCREEN_MIN / camera.zoom);
  }

  function findNodeAt(x, y) {
    for (const node of nodes) {
      if (Math.hypot(node.x - x, node.y - y) < getHitRadius(node)) return node;
    }
    return null;
  }

  function setHoveredNode(node) {
    if (node === hovered) return;
    hovered = node;

    if (node) {
      showTip(node);
      updateCursor("pointer");
    } else {
      hideTip();
      updateCursor(activePointers.size ? "grabbing" : "grab");
    }

    if (p5inst && !p5inst.isLooping()) p5inst.redraw();
  }

  // -- Utilities -----------------------------------------------------------------

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function expandBounds(minX, minY, maxX, maxY) {
    contentBounds.minX = Math.min(contentBounds.minX, minX);
    contentBounds.minY = Math.min(contentBounds.minY, minY);
    contentBounds.maxX = Math.max(contentBounds.maxX, maxX);
    contentBounds.maxY = Math.max(contentBounds.maxY, maxY);
  }

  function recomputeContentBounds() {
    contentBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

    for (const node of nodes) {
      const markerEdge =
        node.kind === "major" ? MAJOR_S
        : node.kind === "promotion" ? MINOR_S + 4
        : ORIGIN_S;
      const labels = node.opts.label || [];
      const [dx, dy] = node.opts.labelOffset ?? [0, markerEdge + LABEL_GAP + LINE_H];
      const labelTop = labels.length ? node.y + dy - LABEL_TOP_PAD : node.y;
      const labelBottom = labels.length ? node.y + dy + LINE_H * labels.length : node.y;
      expandBounds(
        node.x - Math.max(markerEdge + NODE_BOUNDS_PAD, labels.length ? LABEL_HALF_W - dx : 0),
        Math.min(node.y - markerEdge - NODE_BOUNDS_PAD, labelTop),
        node.x + Math.max(markerEdge + NODE_BOUNDS_PAD, labels.length ? LABEL_HALF_W + dx : 0),
        Math.max(node.y + markerEdge + NODE_BOUNDS_PAD, labelBottom),
      );
    }

    for (const region of regions) {
      if (!region.points?.length) continue;
      for (const [x, y] of region.points) expandBounds(x, y, x, y);
    }

    for (const lbl of mapLabels) {
      const size = lbl.size || MAP_LABEL_DEFAULT_SIZE;
      const halfW = Math.max((lbl.text?.length || 0) * size * MAP_LABEL_WIDTH_FACTOR, MAP_LABEL_MIN_HALF_W);
      expandBounds(lbl.x - halfW, lbl.y - size, lbl.x + halfW, lbl.y + size);
    }

    if (
      !Number.isFinite(contentBounds.minX) ||
      !Number.isFinite(contentBounds.minY) ||
      !Number.isFinite(contentBounds.maxX) ||
      !Number.isFinite(contentBounds.maxY)
    ) {
      contentBounds = {
        minX: -FALLBACK_WORLD_W / 2,
        minY: -FALLBACK_WORLD_H / 2,
        maxX: FALLBACK_WORLD_W / 2,
        maxY: FALLBACK_WORLD_H / 2,
      };
      return;
    }

    contentBounds = {
      minX: contentBounds.minX - CONTENT_FIT_PAD,
      minY: contentBounds.minY - CONTENT_FIT_PAD,
      maxX: contentBounds.maxX + CONTENT_FIT_PAD,
      maxY: contentBounds.maxY + CONTENT_FIT_PAD,
    };
  }

  function updateViewSize() {
    const wrap = document.getElementById("journey-canvas-wrap");
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const measuredW = Math.round(rect.width || wrap.clientWidth || 0);
    const measuredH = Math.round(rect.height || wrap.clientHeight || 0);
    viewW = measuredW > 0 ? measuredW : FALLBACK_VIEW_W;
    viewH = measuredH > 0 ? measuredH : FALLBACK_VIEW_H;
  }

  function clampCamera() {
    const boundsW = contentBounds.maxX - contentBounds.minX;
    const boundsH = contentBounds.maxY - contentBounds.minY;
    const contentW = boundsW * camera.zoom;
    const contentH = boundsH * camera.zoom;
    const minPanX = -viewW / 2 - contentBounds.minX * camera.zoom;
    const maxPanX = viewW / 2 - contentBounds.maxX * camera.zoom;
    const minPanY = -viewH / 2 - contentBounds.minY * camera.zoom;
    const maxPanY = viewH / 2 - contentBounds.maxY * camera.zoom;

    if (contentW <= viewW) camera.panX = -((contentBounds.minX + contentBounds.maxX) / 2) * camera.zoom;
    else camera.panX = clamp(camera.panX, maxPanX, minPanX);

    if (contentH <= viewH) camera.panY = -((contentBounds.minY + contentBounds.maxY) / 2) * camera.zoom;
    else camera.panY = clamp(camera.panY, maxPanY, minPanY);
  }

  function resetCamera() {
    const isPhone = window.matchMedia(`(max-width: ${PHONE_BREAKPOINT_PX}px)`).matches;
    const boundsW = Math.max(contentBounds.maxX - contentBounds.minX, MIN_BOUNDS_SIZE);
    const boundsH = Math.max(contentBounds.maxY - contentBounds.minY, MIN_BOUNDS_SIZE);
    const containZoom = Math.min(viewW / boundsW, viewH / boundsH);
    const coverZoom = Math.max(viewW / boundsW, viewH / boundsH);
    camera.minZoom = isPhone && MOBILE_USE_COVER_FIT ? coverZoom : containZoom;
    camera.maxZoom = camera.minZoom * MAX_ZOOM_MULT;
    camera.zoom = isPhone ? clamp(camera.minZoom * MOBILE_START_ZOOM_MULT, camera.minZoom, camera.maxZoom) : camera.minZoom;
    camera.panX = -((contentBounds.minX + contentBounds.maxX) / 2) * camera.zoom;
    camera.panY = -((contentBounds.minY + contentBounds.maxY) / 2) * camera.zoom;
  }

  function worldToScreen(x, y) {
    return {
      x: x * camera.zoom + camera.panX + viewW / 2,
      y: y * camera.zoom + camera.panY + viewH / 2,
    };
  }

  function screenToWorld(x, y) {
    return {
      x: (x - viewW / 2 - camera.panX) / camera.zoom,
      y: (y - viewH / 2 - camera.panY) / camera.zoom,
    };
  }

  function zoomAt(newZoom, screenX, screenY) {
    const targetZoom = clamp(newZoom, camera.minZoom, camera.maxZoom);
    const anchor = screenToWorld(screenX, screenY);
    camera.zoom = targetZoom;
    camera.panX = screenX - viewW / 2 - anchor.x * camera.zoom;
    camera.panY = screenY - viewH / 2 - anchor.y * camera.zoom;
    clampCamera();
    if (hovered) showTip(hovered);
    if (p5inst && !p5inst.isLooping()) p5inst.redraw();
  }

  function getCanvasPoint(clientX, clientY) {
    const wrap = document.getElementById("journey-canvas-wrap");
    const rect = wrap.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * viewW,
      y: ((clientY - rect.top) / rect.height) * viewH,
    };
  }

  function syncPointer(pointerId, event) {
    activePointers.set(pointerId, { x: event.clientX, y: event.clientY });
  }

  function startPinch() {
    if (activePointers.size < 2) {
      pinchState = null;
      return;
    }

    const [a, b] = Array.from(activePointers.values());
    const center = getCanvasPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    pinchState = {
      startDistance: Math.hypot(b.x - a.x, b.y - a.y),
      startZoom: camera.zoom,
      worldCenter: screenToWorld(center.x, center.y),
    };
    dragState = null;
    setHoveredNode(null);
  }

  function applyPinch() {
    if (!pinchState || activePointers.size < 2) return;

    const [a, b] = Array.from(activePointers.values());
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!distance || !pinchState.startDistance) return;

    const center = getCanvasPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    camera.zoom = clamp(pinchState.startZoom * (distance / pinchState.startDistance), camera.minZoom, camera.maxZoom);
    camera.panX = center.x - viewW / 2 - pinchState.worldCenter.x * camera.zoom;
    camera.panY = center.y - viewH / 2 - pinchState.worldCenter.y * camera.zoom;
    clampCamera();
    if (hovered) showTip(hovered);
    if (p5inst && !p5inst.isLooping()) p5inst.redraw();
  }

  function updateCursor(cursor) {
    const wrap = document.getElementById("journey-canvas-wrap");
    if (wrap) wrap.style.cursor = cursor;
  }

  // -- Drawing helpers -----------------------------------------------------------

  function pxText(str, x, y, style) {
    const { size, fillColor, alignH = "center", strokeColor = 0, strokeWeight = 5 } = style;
    const p = p5inst;
    p.textSize(size);
    p.textAlign(
      alignH === "center" ? p.CENTER
      : alignH === "left" ? p.LEFT
      : p.RIGHT,
      p.BASELINE,
    );
    p.stroke(strokeColor);
    p.strokeWeight(strokeWeight);
    p.fill(fillColor);
    p.text(str, x, y);
  }

  function dashedLine(x1, y1, x2, y2, colorStr, weight, dashEndInset = 0) {
    const p = p5inst;
    const dx = x2 - x1,
      dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const ux = dx / len,
      uy = dy / len;
    p.push();
    p.drawingContext.lineCap = "butt";
    p.strokeWeight(weight);
    p.stroke(colorStr);
    p.noFill();
    let t = 0,
      on = true;
    while (t < len) {
      const seg = on ? DASH_ON : DASH_OFF;
      const end = Math.min(t + seg, len);
      if (on) {
        const drawStart = t + dashEndInset;
        const drawEnd = end - dashEndInset;
        if (drawEnd > drawStart) p.line(x1 + ux * drawStart, y1 + uy * drawStart, x1 + ux * drawEnd, y1 + uy * drawEnd);
      }
      t += seg;
      on = !on;
    }
    p.noStroke();
    p.pop();
  }

  // -- Road ---------------------------------------------------------------------

  function drawRoad(road) {
    const color = road.color || road.b.opts.color || "#6b7280";
    dashedLine(road.a.x, road.a.y, road.b.x, road.b.y, ROAD_OUTLINE_COLOR, ROAD_OUTLINE_W, 0);
    dashedLine(road.a.x, road.a.y, road.b.x, road.b.y, color, ROAD_INNER_W, ROAD_INNER_DASH_END_INSET);
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
    const t = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90;

    for (const [phase, mult] of [
      [t, 1],
      [t2, 0.6],
    ]) {
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
    const t = (p.frameCount % 90) / 90;
    const t2 = ((p.frameCount + 30) % 90) / 90;

    for (const [phase, mult] of [
      [t, 1],
      [t2, 0.6],
    ]) {
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

  // -- Node rendering ------------------------------------------------------------

  function drawNode(node) {
    const p = p5inst;
    const { x, y, kind, opts } = node;
    const hov = node === hovered;
    const rgb = hexToRgb(opts.color || "#9ca3af");
    const cr = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a / 255})`;

    if (kind === "origin") {
      const S = ORIGIN_S + (hov ? 1 : 0);
      if (opts.current) pulseRect(p, x, y, ORIGIN_S, rgb);

      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.rect(x - S + 3, y - S + 3, S * 2, S * 2); // shadow

      p.fill("#0d0b07");
      p.stroke(cr(190));
      p.strokeWeight(2);
      p.rect(x - S, y - S, S * 2, S * 2); // body

      p.noFill();
      p.stroke(cr(110));
      p.strokeWeight(1);
      p.rect(x - S * 0.85, y - S * 0.85, S * 1.7, S * 1.7); // inner ring

      p.fill(cr(230));
      p.noStroke();
      p.rect(x - 3, y - 3, 6, 6); // center dot

      if (hov) {
        p.noFill();
        p.stroke(cr(160));
        p.strokeWeight(1.5);
        p.rect(x - (S + 8), y - (S + 8), (S + 8) * 2, (S + 8) * 2); // hover ring
      }

      drawLabel(x, y, ORIGIN_S, node);
    } else if (kind === "major") {
      const S = MAJOR_S + (hov ? 2 : 0);
      if (opts.current) pulseRect(p, x, y, MAJOR_S, rgb);

      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.rect(x - S + 4, y - S + 4, S * 2, S * 2); // shadow

      p.fill(17, 24, 40);
      p.stroke(cr(220));
      p.strokeWeight(2.5);
      p.rect(x - S, y - S, S * 2, S * 2); // body

      const img = imageCache[opts.iconPath];
      if (img) {
        p.image(img, x - S + 3, y - S + 3, S * 2 - 6, S * 2 - 6);
      } else {
        p.fill(rgb[0], rgb[1], rgb[2], 28);
        p.noStroke();
        p.rect(x - S + 4, y - S + 4, S * 2 - 8, S * 2 - 8); // tinted fill
      }

      drawLabel(x, y, MAJOR_S, node);
    } else if (kind === "promotion") {
      const S = MINOR_S + (hov ? 2 : 0);
      if (opts.current) pulseDiamond(p, x, y, MINOR_S, rgb);

      p.push();
      p.translate(x, y);
      p.rotate(p.QUARTER_PI);

      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.rect(-S + 3, -S + 3, S * 2, S * 2); // shadow

      p.fill(17, 24, 40);
      p.stroke(cr(220));
      p.strokeWeight(2);
      p.rect(-S, -S, S * 2, S * 2); // body

      p.fill(rgb[0], rgb[1], rgb[2], 185);
      p.noStroke();
      p.rect(-S * 0.44, -S * 0.44, S * 0.88, S * 0.88); // inner fill

      p.pop();
      drawLabel(x, y, MINOR_S + 4, node);
    }
  }

  // -- Region polygon ------------------------------------------------------------

  function drawRegion(region) {
    const p = p5inst;
    const pts = region.points;
    if (!pts || pts.length < 3) return;
    const rgb = hexToRgb(region.color || "#6b7280");
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
    const p = p5inst;
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

  function applyEdgeFade() {
    const p = p5inst;
    if (!p || EDGE_FADE_PX <= 0) return;

    const fade = Math.min(EDGE_FADE_PX, Math.floor(Math.min(viewW, viewH) / 2));
    if (fade <= 0) return;

    const ctx = p.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const top = ctx.createLinearGradient(0, 0, 0, fade);
    top.addColorStop(0, "rgba(0,0,0,1)");
    top.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, viewW, fade);

    const bottom = ctx.createLinearGradient(0, viewH, 0, viewH - fade);
    bottom.addColorStop(0, "rgba(0,0,0,1)");
    bottom.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, viewH - fade, viewW, fade);

    const left = ctx.createLinearGradient(0, 0, fade, 0);
    left.addColorStop(0, "rgba(0,0,0,1)");
    left.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, fade, viewH);

    const right = ctx.createLinearGradient(viewW, 0, viewW - fade, 0);
    right.addColorStop(0, "rgba(0,0,0,1)");
    right.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = right;
    ctx.fillRect(viewW - fade, 0, fade, viewH);

    ctx.restore();
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
        const cnv = p.createCanvas(FALLBACK_VIEW_W, FALLBACK_VIEW_H);
        const canvasEl = cnv.elt;
        cnv.parent(wrap);
        cnv.style("background", "transparent");
        canvasEl.style.touchAction = "none";
        p.textFont("Silkscreen");
        p.frameRate(30);
        p.noLoop();

        userSetup(publicAPI);

        recomputeContentBounds();
        updateViewSize();
        p.resizeCanvas(viewW, viewH);
        resetCamera();

        if (nodes.some((n) => n.opts.current)) p.loop();

        canvasEl.addEventListener("pointerdown", (event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;

          syncPointer(event.pointerId, event);
          canvasEl.setPointerCapture(event.pointerId);

          if (activePointers.size === 1) {
            dragState = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              startPanX: camera.panX,
              startPanY: camera.panY,
              moved: false,
            };
            pinchState = null;
          } else {
            startPinch();
          }

          updateCursor("grabbing");
          setHoveredNode(null);
        });

        canvasEl.addEventListener("pointermove", (event) => {
          if (activePointers.has(event.pointerId)) syncPointer(event.pointerId, event);

          if (pinchState && activePointers.size >= 2) {
            applyPinch();
            return;
          }

          if (!dragState || dragState.pointerId !== event.pointerId) return;

          const dx = event.clientX - dragState.startX;
          const dy = event.clientY - dragState.startY;
          if (Math.hypot(dx, dy) > DRAG_START_THRESHOLD_PX) dragState.moved = true;
          camera.panX = dragState.startPanX + dx;
          camera.panY = dragState.startPanY + dy;
          clampCamera();
          if (p5inst && !p5inst.isLooping()) p5inst.redraw();
        });

        const finishPointer = (event) => {
          const wasDragPointer = dragState && dragState.pointerId === event.pointerId ? dragState : null;
          activePointers.delete(event.pointerId);

          if (activePointers.size >= 2) {
            startPinch();
          } else {
            pinchState = null;
          }

          if (wasDragPointer && !wasDragPointer.moved) {
            const point = getCanvasPoint(event.clientX, event.clientY);
            const world = screenToWorld(point.x, point.y);
            setHoveredNode(findNodeAt(world.x, world.y));
          }

          if (dragState && dragState.pointerId === event.pointerId) {
            dragState = null;
          }

          if (!activePointers.size) updateCursor("grab");
        };

        canvasEl.addEventListener("pointerup", finishPointer);
        canvasEl.addEventListener("pointercancel", finishPointer);

        canvasEl.addEventListener(
          "wheel",
          (event) => {
            event.preventDefault();
            const point = getCanvasPoint(event.clientX, event.clientY);
            zoomAt(camera.zoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED), point.x, point.y);
          },
          { passive: false },
        );

        updateCursor("grab");

        if (window.ResizeObserver) {
          wrapResizeObserver?.disconnect();
          wrapResizeObserver = new ResizeObserver(() => {
            updateViewSize();
            p.resizeCanvas(viewW, viewH);
            resetCamera();
            setHoveredNode(null);
          });
          wrapResizeObserver.observe(wrap);
        }

        window.addEventListener("resize", () => {
          updateViewSize();
          p.resizeCanvas(viewW, viewH);
          resetCamera();
          setHoveredNode(null);
        });
      };

      p.draw = function () {
        p.clear();
        p.push();
        p.translate(viewW / 2 + camera.panX, viewH / 2 + camera.panY);
        p.scale(camera.zoom);
        for (const r of regions) drawRegion(r);
        for (const l of mapLabels) drawMapLabel(l);
        for (const r of roads) drawRoad(r);
        for (const n of nodes) drawNode(n);
        p.pop();
        applyEdgeFade();
      };

      p.mouseMoved = function () {
        if (dragState || pinchState || activePointers.size) return;
        const world = screenToWorld(p.mouseX, p.mouseY);
        setHoveredNode(findNodeAt(world.x, world.y));
      };

      p.mouseExited = function () {
        setHoveredNode(null);
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
