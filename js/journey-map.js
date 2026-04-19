"use strict";

window.JourneyMap = (function () {
  // -- Canvas constants ----------------------------------------------------------

  const FALLBACK_VIEW_W = 800; // fallback canvas width when container has no measurable width yet
  const FALLBACK_VIEW_H = 600; // fallback canvas height when container has no measurable height yet
  const FALLBACK_WORLD_W = 800; // default world width used when no map content exists
  const FALLBACK_WORLD_H = 600; // default world height used when no map content exists
  const CONTENT_FIT_PAD = 100; // extra world-space padding around computed content bounds
  const LABEL_HALF_W = 170; // half-width reserved for labels when computing content bounds
  const MOBILE_START_ZOOM_MULT = 1.0; // initial zoom multiplier on phones relative to fitted min zoom
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
  const REGION_PADDING = 120; // extra world-space padding around Voronoi regions
  const REGION_ALPHA = 100; // fill alpha for regions
  const PHONE_BREAKPOINT_PX = 768; // viewport breakpoint where phone-specific zoom start is used
  const MIN_BOUNDS_SIZE = 1; // lower bound to avoid divide-by-zero when fitting zoom
  const EDGE_FADE_PX = 20; // fade distance at canvas edges before hard clip
  const DEBUG_REGION_POINT_SCREEN_RADIUS = 5; // on-screen radius for region debug dots
  const DEV_REGION_POINT_SCREEN_RADIUS = 9; // on-screen radius for editable dev Voronoi seeds
  const CURRENT_FLAG_OFFSET = 18; // vertical gap between a current node and its flag marker
  const CURRENT_FLAG_POLE_H = 34; // pole height for the current-state flag marker
  const CURRENT_FLAG_W = 44; // banner width for the current-state flag marker
  const CURRENT_FLAG_H = 44; // banner height for the current-state flag marker
  const CURRENT_FLAG_TAIL_H = 8; // swallowtail cut depth for the current-state flag marker
  const CURRENT_FLAG_CROSSBAR_W = 30; // crossbar width for the current-state flag marker
  const CURRENT_FLAG_IMAGE_PATH = "images/banner.png"; // banner art used for current-state markers
  const WORLD_MAP_IMAGE_PATH = "images/worldmap.png"; // world background art drawn behind map layers
  const WORLD_MAP_SOURCE_W = 320; // source art width used for 4:3 scaling
  const WORLD_MAP_SOURCE_H = 240; // source art height used for 4:3 scaling

  const DEBUG = {
    showNodes: true,
    showRoads: true,
    showLabels: true,
    showRegionPoints: false,
  };

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
  const ROAD_DOT_SPACING = 18; // distance between dotted-road dots
  const ROAD_DOT_OUTER_R = 3.2; // outer dot radius for dotted roads
  const ROAD_DOT_INNER_R = 2.1; // inner dot radius for dotted roads

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
  let manualVoronoiRegions = [];
  let manualVoronoiConfig = {
    enabled: false,
  };
  let manualRegionSeedPoints = [];
  let mapLabels = [];
  let hovered = null;
  let hoveredRegion = null;
  let hoveredRegionSeedPoint = null;
  let imageCache = {};
  let pendingIcons = [];
  let guildHallDocPromise = null;
  let regionTipRequestToken = 0;
  let lastMouseScreen = { x: 0, y: 0 };
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
  let devLayout = {
    enabled: false,
    showGuide: true,
    onExport: null,
  };
  let devDragState = null;
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
  const regionTip = document.getElementById("journey-region-tooltip");
  const regionTipContent = document.getElementById("jr-content");

  function formatPeriodHTML(period) {
    if (typeof period !== "string") return "";
    return period.replace(/Present/gi, '<span style="color:#fbbf24">Present</span>');
  }

  function showTip(node) {
    const wrap = document.getElementById("journey-canvas-wrap");
    const rect = wrap.getBoundingClientRect();
    const paperRect = wrap.parentElement?.getBoundingClientRect() || rect;
    const px = (lastMouseScreen.x / viewW) * rect.width;
    const py = (lastMouseScreen.y / viewH) * rect.height;

    const tw = 244,
      th = 180;
    let left = px + 20,
      top = py + 18;
    if (paperRect.left + left + tw > window.innerWidth - 8) left = px - tw - 20;
    if (paperRect.top + top + th > window.innerHeight - 8) top = py - th - 18;
    left = clamp(left, 4 - paperRect.left, window.innerWidth - tw - paperRect.left - 8);
    top = clamp(top, 4 - paperRect.top, window.innerHeight - th - paperRect.top - 8);

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
    tipPeriod.innerHTML = formatPeriodHTML(period);
    tipPeriod.classList.toggle("hidden", !period);

    tip.classList.remove("hidden");
  }

  function hideTip() {
    tip.classList.add("hidden");
  }

  function hideRegionTip() {
    if (!regionTip) return;
    regionTipRequestToken += 1;
    regionTip.classList.add("hidden");
  }

  async function loadGuildHallDocument() {
    if (guildHallDocPromise) return guildHallDocPromise;
    guildHallDocPromise = fetch("./guild-hall.html")
      .then((response) => {
        if (!response.ok) return null;
        return response.text();
      })
      .then((html) => {
        if (!html) return null;
        const parser = new DOMParser();
        return parser.parseFromString(html, "text/html");
      })
      .catch(() => null);
    return guildHallDocPromise;
  }

  async function buildGuildElementTooltipHTML(id) {
    const doc = await loadGuildHallDocument();
    if (!doc) return "";
    const card = doc.getElementById(id);
    if (!card) return "";
    const clone = card.cloneNode(true);
    clone.classList.remove("hidden");
    if (clone.classList.contains("flex-col") && !clone.classList.contains("flex")) {
      clone.classList.add("flex");
    }
    clone.removeAttribute("aria-hidden");
    clone.removeAttribute("tabindex");
    if (clone.style?.display === "none") clone.style.removeProperty("display");
    return clone.outerHTML;
  }

  async function showRegionTip(region, screenPt) {
    if (!regionTip || !regionTipContent || !screenPt) return;

    const wrap = document.getElementById("journey-canvas-wrap");
    const rect = wrap.getBoundingClientRect();
    const paperRect = wrap.parentElement?.getBoundingClientRect() || rect;
    const px = (screenPt.x / viewW) * rect.width;
    const py = (screenPt.y / viewH) * rect.height;

    const tw = Math.min(280, Math.max(220, rect.width - 24));
    const th = 230;
    let left = px + 18;
    let top = py + 18;

    if (paperRect.left + left + tw > window.innerWidth - 8) left = px - tw - 18;
    if (paperRect.top + top + th > window.innerHeight - 8) top = py - th - 18;
    left = clamp(left, 4 - paperRect.left, window.innerWidth - tw - paperRect.left - 8);
    top = clamp(top, 4 - paperRect.top, window.innerHeight - th - paperRect.top - 8);

    regionTip.style.left = `${left}px`;
    regionTip.style.top = `${top}px`;

    const requestToken = ++regionTipRequestToken;
    const tooltip = region.tooltip;
    if (typeof tooltip !== "string" || !tooltip.trim()) {
      hideRegionTip();
      return;
    }

    const tooltipText = tooltip.trim();
    const guildHtml = await buildGuildElementTooltipHTML(tooltipText);
    if (requestToken !== regionTipRequestToken) return;
    if (!guildHtml) {
      hideRegionTip();
      return;
    }
    regionTipContent.innerHTML = guildHtml;
    regionTip.classList.remove("hidden");
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

  function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0],
        yi = points[i][1];
      const xj = points[j][0],
        yj = points[j][1];
      const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function findRegionAt(x, y) {
    for (const region of manualVoronoiRegions) {
      if (!region.points?.length) continue;
      if (!pointInPolygon(x, y, region.points)) continue;
      return {
        id: region.id,
        color: region.color,
        tooltip: region.tooltip,
      };
    }
    return null;
  }

  function getRegionSeedHitRadius() {
    return Math.max(DEV_REGION_POINT_SCREEN_RADIUS / camera.zoom, 1.5 / camera.zoom);
  }

  function findRegionSeedPointAt(x, y) {
    if (!devLayout.enabled) return null;
    const hitRadius = getRegionSeedHitRadius();
    for (let index = manualRegionSeedPoints.length - 1; index >= 0; index--) {
      const point = manualRegionSeedPoints[index];
      if (Math.hypot(point.x - x, point.y - y) <= hitRadius) return point;
    }
    return null;
  }

  function setHoveredRegion(region, screenPt = null) {
    const prevColor = hoveredRegion?.color || null;
    const nextColor = region?.color || null;
    hoveredRegion = region;

    if (region) {
      showRegionTip(region, screenPt);
      if (!hovered) updateCursor("pointer");
    } else {
      hideRegionTip();
      if (!hovered) updateCursor(activePointers.size ? "grabbing" : "grab");
    }

    const changed = prevColor !== nextColor;
    if (changed && p5inst && !p5inst.isLooping()) p5inst.redraw();
  }

  function refreshLayoutState() {
    recomputeContentBounds();
    rebuildManualVoronoiRegions();
    clampCamera();
  }

  function setRegionSeedPointHover(point) {
    if (point === hoveredRegionSeedPoint) return;
    hoveredRegionSeedPoint = point;
    if (point) updateCursor("pointer");
    else if (!hovered && !hoveredRegion) updateCursor(activePointers.size ? "grabbing" : "grab");
    if (p5inst && !p5inst.isLooping()) p5inst.redraw();
  }

  function updateRegionSeedPoint(seedPoint, x, y) {
    const region = manualVoronoiConfig.regions?.find((entry) => entry.id === seedPoint.regionId);
    if (!region || !Array.isArray(region.points) || seedPoint.pointIndex < 0 || seedPoint.pointIndex >= region.points.length) {
      return null;
    }

    region.points[seedPoint.pointIndex] = [x, y];
    refreshLayoutState();
    const updated = manualRegionSeedPoints.find(
      (point) => point.regionId === seedPoint.regionId && point.pointIndex === seedPoint.pointIndex,
    );
    if (updated) hoveredRegionSeedPoint = updated;
    return updated || null;
  }

  function addRegionSeedPoint(regionId, x, y) {
    const region = manualVoronoiConfig.regions?.find((entry) => entry.id === regionId);
    if (!region) return null;
    if (!Array.isArray(region.points)) region.points = [];
    region.points.push([x, y]);
    refreshLayoutState();
    return manualRegionSeedPoints.find(
      (point) => point.regionId === regionId && point.pointIndex === region.points.length - 1,
    );
  }

  function removeRegionSeedPoint(seedPoint) {
    const region = manualVoronoiConfig.regions?.find((entry) => entry.id === seedPoint.regionId);
    if (!region || !Array.isArray(region.points) || seedPoint.pointIndex < 0 || seedPoint.pointIndex >= region.points.length) {
      return false;
    }

    region.points.splice(seedPoint.pointIndex, 1);
    refreshLayoutState();
    hoveredRegionSeedPoint = null;
    return true;
  }

  function exportNodePositions() {
    const payload = {
      nodes: nodes.map((node) => ({
        id: node.opts.devKey || node.opts.id || `${node.kind}-${nodes.indexOf(node) + 1}`,
        x: Math.round(node.x),
        y: Math.round(node.y),
        kind: node.kind,
      })),
      regions: (manualVoronoiConfig.regions || []).map((region) => ({
        id: region.id || region.tooltip || region.color,
        color: region.color,
        tooltip: region.tooltip,
        points: (region.points || []).map((point) => [Math.round(Number(point[0]) || 0), Math.round(Number(point[1]) || 0)]),
      })),
    };

    if (typeof devLayout.onExport === "function") {
      devLayout.onExport(payload);
      return payload;
    }

    console.log("[JourneyMap] Node positions", payload);
    return payload;
  }

  // -- Utilities -----------------------------------------------------------------

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function normalizeHexColor(color) {
    if (typeof color !== "string" || !color) return "#9ca3af";
    const c = color.trim().toLowerCase();
    if (c.startsWith("#")) {
      if (c.length === 4) {
        return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
      }
      if (c.length === 7) return c;
    }
    return "#9ca3af";
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

      if (node.opts.current) {
        const poleBottom = node.y - markerEdge - CURRENT_FLAG_OFFSET;
        const poleTop = poleBottom - CURRENT_FLAG_POLE_H;
        expandBounds(
          node.x - CURRENT_FLAG_CROSSBAR_W / 2 - 3,
          poleTop - 4,
          node.x + CURRENT_FLAG_CROSSBAR_W / 2 + 3,
          poleBottom,
        );
      }
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

  function rebuildManualVoronoiRegions() {
    manualVoronoiRegions = [];
    manualRegionSeedPoints = [];
    if (!manualVoronoiConfig.enabled) return;
    if (!window.d3?.Delaunay) return;

    const seeds = [];
    for (const region of manualVoronoiConfig.regions || []) {
      const color = normalizeHexColor(region.color);
      const regionId = typeof region.id === "string" && region.id.trim() ? region.id.trim() : region.tooltip || color;
      for (const pt of region.points || []) {
        if (!Array.isArray(pt) || pt.length < 2) continue;
        const x = Number(pt[0]);
        const y = Number(pt[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        manualRegionSeedPoints.push({
          x,
          y,
          color,
          tooltip: region.tooltip,
          regionId,
          pointIndex: seeds.filter((seed) => seed.regionId === regionId).length,
        });
        seeds.push({
          x,
          y,
          tooltip: region.tooltip,
          color,
          regionId,
        });
      }
    }

    if (!seeds.length) return;

    const pad = Math.max(0, REGION_PADDING);
    const minX = contentBounds.minX - pad;
    const minY = contentBounds.minY - pad;
    const maxX = contentBounds.maxX + pad;
    const maxY = contentBounds.maxY + pad;

    if (seeds.length === 1) {
      manualVoronoiRegions.push({
        id: seeds[0].regionId,
        points: [
          [minX, minY],
          [maxX, minY],
          [maxX, maxY],
          [minX, maxY],
        ],
        tooltip: seeds[0].tooltip,
        color: seeds[0].color,
        stroke: false,
      });
      return;
    }

    const delaunay = window.d3.Delaunay.from(
      seeds,
      (seed) => seed.x,
      (seed) => seed.y,
    );
    const voronoi = delaunay.voronoi([minX, minY, maxX, maxY]);

    for (let i = 0; i < seeds.length; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon || polygon.length < 3) continue;

      const points = [];
      for (const [x, y] of polygon) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        points.push([x, y]);
      }
      if (points.length < 3) continue;

      manualVoronoiRegions.push({
        id: seeds[i].regionId,
        points,
        tooltip: seeds[i].tooltip,
        color: seeds[i].color,
        stroke: false,
      });
    }
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

  function dottedLine(x1, y1, x2, y2, colorStr, radius, spacing = ROAD_DOT_SPACING) {
    const p = p5inst;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const steps = Math.max(1, Math.floor(len / spacing));

    p.push();
    p.noStroke();
    p.fill(colorStr);
    for (let index = 0; index <= steps; index++) {
      const distance = Math.min(index * spacing, len);
      p.circle(x1 + ux * distance, y1 + uy * distance, radius * 2);
    }
    p.pop();
  }

  // -- Road ---------------------------------------------------------------------

  function drawRoad(road) {
    const color = road.color || road.a.opts.color || "#6b7280";
    if (road.style === "dotted") {
      dottedLine(road.a.x, road.a.y, road.b.x, road.b.y, ROAD_OUTLINE_COLOR, ROAD_DOT_OUTER_R);
      dottedLine(road.a.x, road.a.y, road.b.x, road.b.y, color, ROAD_DOT_INNER_R);
      return;
    }

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

  function saturateRgb(rgb, amount = 1.25) {
    const avg = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return [
      Math.max(0, Math.min(255, Math.round(avg + (rgb[0] - avg) * amount))),
      Math.max(0, Math.min(255, Math.round(avg + (rgb[1] - avg) * amount))),
      Math.max(0, Math.min(255, Math.round(avg + (rgb[2] - avg) * amount))),
    ];
  }

  function brightenRgb(rgb, amount = 0.2) {
    return [
      Math.max(0, Math.min(255, Math.round(rgb[0] + (255 - rgb[0]) * amount))),
      Math.max(0, Math.min(255, Math.round(rgb[1] + (255 - rgb[1]) * amount))),
      Math.max(0, Math.min(255, Math.round(rgb[2] + (255 - rgb[2]) * amount))),
    ];
  }

  function drawCurrentGlow(p, x, y, baseSize, rgb, pulse01) {
    const glowRadius = baseSize + 8 + pulse01 * 5;
    const glowAlpha = 34 + pulse01 * 20;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], glowAlpha);
    p.circle(x, y, glowRadius * 2);
  }

  function drawCurrentFlag(p, x, y, baseSize, rgb, pulse01) {
    const poleBottom = y - baseSize - CURRENT_FLAG_OFFSET;
    const poleTop = poleBottom - CURRENT_FLAG_POLE_H;
    const bannerLeft = x - CURRENT_FLAG_W / 2;
    const bannerTop = poleTop + 5;
    const bannerImg = imageCache[CURRENT_FLAG_IMAGE_PATH];

    if (!bannerImg) return;

    p.push();
    p.translate(0, -pulse01 * 1.4);
    p.drawingContext.save();
    p.drawingContext.shadowColor = "rgba(0,0,0,0.3)";
    p.drawingContext.shadowBlur = 6;
    p.drawingContext.shadowOffsetX = 2;
    p.drawingContext.shadowOffsetY = 2;
    p.drawingContext.imageSmoothingEnabled = false;
    p.image(bannerImg, bannerLeft, bannerTop, CURRENT_FLAG_W, CURRENT_FLAG_H);
    p.drawingContext.restore();

    p.pop();
  }

  function pulseCurrentAura(p, x, y, baseSize, rgb) {
    const t = (p.frameCount % 120) / 120;
    const t2 = ((p.frameCount + 40) % 120) / 120;

    for (const [phase, mult] of [
      [t, 1],
      [t2, 0.7],
    ]) {
      const alpha = Math.round((1 - phase) * 85 * mult);
      if (alpha <= 0) continue;
      const radius = baseSize + 12 + phase * 34;
      p.noFill();
      p.stroke(rgb[0], rgb[1], rgb[2], alpha);
      p.strokeWeight(2);
      p.circle(x, y, radius * 2);
    }

    const glow = 22 + Math.sin((p.frameCount / 120) * Math.PI * 2) * 8;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], glow);
    p.circle(x, y, (baseSize + 10) * 2);
  }

  function drawWorldBackground() {
    const p = p5inst;
    if (!p) return;
    const bg = imageCache[WORLD_MAP_IMAGE_PATH];
    if (!bg) return;

    const boundsW = Math.max(contentBounds.maxX - contentBounds.minX, 1);
    const boundsH = Math.max(contentBounds.maxY - contentBounds.minY, 1);
    const bgScale = Math.max(boundsW / WORLD_MAP_SOURCE_W, boundsH / WORLD_MAP_SOURCE_H);
    const drawW = WORLD_MAP_SOURCE_W * bgScale;
    const drawH = WORLD_MAP_SOURCE_H * bgScale;
    const centerX = (contentBounds.minX + contentBounds.maxX) / 2;
    const centerY = (contentBounds.minY + contentBounds.maxY) / 2;

    p.push();
    p.imageMode(p.CENTER);
    p.image(bg, centerX, centerY, drawW, drawH);
    p.pop();
  }

  // -- Node rendering ------------------------------------------------------------

  function drawNode(node) {
    const p = p5inst;
    const { x, y, kind, opts } = node;
    const hov = node === hovered;
    const baseRgb = hexToRgb(opts.color || "#9ca3af");
    const currentPulse = opts.current ? (Math.sin((p.frameCount / 45) * Math.PI * 2) + 1) / 2 : 0;
    const rgb = opts.current ? saturateRgb(baseRgb, 1.35) : baseRgb;
    const cr = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a / 255})`;

    if (opts.current) {
      const base =
        kind === "major" ? MAJOR_S
        : kind === "promotion" ? MINOR_S + 4
        : ORIGIN_S;
      drawCurrentGlow(p, x, y, base, rgb, currentPulse);
      drawCurrentFlag(p, x, y, base, rgb, currentPulse);
    }

    if (kind === "origin") {
      const S = ORIGIN_S + (hov ? 1 : 0) + (opts.current ? currentPulse * 1.4 : 0);

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
      const S = MAJOR_S + (hov ? 2 : 0) + (opts.current ? currentPulse * 2.2 : 0);

      p.fill("rgba(0,0,0,0.5)");
      p.noStroke();
      p.rect(x - S + 4, y - S + 4, S * 2, S * 2); // shadow

      p.fill(17, 24, 40);
      p.stroke(cr(220));
      p.strokeWeight(2.5);
      p.rect(x - S, y - S, S * 2, S * 2); // body

      const img = imageCache[opts.iconPath];
      if (img) {
        p.image(img, x - S, y - S, S * 2, S * 2);
      } else {
        p.fill(rgb[0], rgb[1], rgb[2], 28);
        p.noStroke();
        p.rect(x - S + 4, y - S + 4, S * 2 - 8, S * 2 - 8); // tinted fill
      }

      drawLabel(x, y, MAJOR_S, node);
    } else if (kind === "promotion") {
      const S = MINOR_S + (hov ? 2 : 0) + (opts.current ? currentPulse * 1.8 : 0);

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
    const isHoveredColor = hoveredRegion?.color === region.color;
    const alph = Math.min(REGION_ALPHA, 255);

    if (!isHoveredColor && !devLayout.enabled) return;

    const fillRgb = brightenRgb(rgb, 0.2);
    const fillAlpha = devLayout.enabled && !isHoveredColor ? 32 : Math.min(alph + 44, 190);
    p.noStroke();
    p.fill(fillRgb[0], fillRgb[1], fillRgb[2], fillAlpha);
    p.beginShape();
    for (const [x, y] of pts) p.vertex(x, y);
    p.endShape(p.CLOSE);
  }

  function getOuterBoundaryEdges(selectedRegions) {
    const edgeCounts = new Map();

    for (const region of selectedRegions) {
      const pts = region.points;
      const pointCount = pts.length;
      if (pointCount < 3) continue;

      // d3 Voronoi polygons are typically closed with last == first; skip degenerate closing edge.
      const maxIndex = pts[0][0] === pts[pointCount - 1][0] && pts[0][1] === pts[pointCount - 1][1] ? pointCount - 1 : pointCount;

      for (let i = 0; i < maxIndex; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % maxIndex];
        const key = makeEdgeKey(a, b);
        const existing = edgeCounts.get(key);
        if (existing) existing.count += 1;
        else edgeCounts.set(key, { count: 1, a, b });
      }
    }

    const edges = [];
    for (const edge of edgeCounts.values()) {
      if (edge.count === 1) edges.push(edge);
    }
    return edges;
  }

  function drawCollectiveRegionOutlines() {
    const p = p5inst;
    if (!p || !manualVoronoiRegions.length) return;

    const groups = new Map();
    for (const region of manualVoronoiRegions) {
      if (!region.points?.length || !region.color) continue;
      if (!groups.has(region.color)) groups.set(region.color, []);
      groups.get(region.color).push(region);
    }

    p.push();
    p.noFill();
    p.stroke(31, 41, 55, 215);
    p.strokeWeight(1.15);
    p.drawingContext.lineJoin = "round";
    p.drawingContext.lineCap = "round";

    for (const [color, groupedRegions] of groups.entries()) {
      if (hoveredRegion?.color && color === hoveredRegion.color) continue;
      const edges = getOuterBoundaryEdges(groupedRegions);
      for (const edge of edges) {
        p.line(edge.a[0], edge.a[1], edge.b[0], edge.b[1]);
      }
    }

    p.pop();
  }

  function makePointKey(x, y) {
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  }

  function makeEdgeKey(a, b) {
    const aKey = makePointKey(a[0], a[1]);
    const bKey = makePointKey(b[0], b[1]);
    return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
  }

  function drawHoveredRegionOutline() {
    if (!hoveredRegion?.color) return;
    const p = p5inst;
    if (!p) return;

    const baseRgb = hexToRgb(hoveredRegion.color);
    const outerRgb = brightenRgb(baseRgb, 0.45);

    const selected = manualVoronoiRegions.filter((region) => region.color === hoveredRegion.color && region.points?.length >= 3);
    if (!selected.length) return;
    const edges = getOuterBoundaryEdges(selected);
    if (!edges.length) return;

    p.push();
    p.noFill();
    p.stroke(outerRgb[0], outerRgb[1], outerRgb[2], 196);
    p.strokeWeight(2.4);
    p.drawingContext.lineJoin = "round";
    p.drawingContext.lineCap = "round";

    for (const edge of edges) {
      p.line(edge.a[0], edge.a[1], edge.b[0], edge.b[1]);
    }

    p.pop();
  }

  function drawRegionDebugPoints() {
    if ((!DEBUG.showRegionPoints && !devLayout.enabled) || !manualRegionSeedPoints.length) return;
    const p = p5inst;
    if (!p) return;

    const radius = devLayout.enabled ? getRegionSeedHitRadius() : Math.max(DEBUG_REGION_POINT_SCREEN_RADIUS / camera.zoom, 1 / camera.zoom);

    p.push();
    for (const point of manualRegionSeedPoints) {
      const rgb = hexToRgb(point.color || "#9ca3af");
      const isHovered = hoveredRegionSeedPoint?.regionId === point.regionId && hoveredRegionSeedPoint?.pointIndex === point.pointIndex;
      p.noStroke();
      p.fill(rgb[0], rgb[1], rgb[2], devLayout.enabled ? 225 : 240);
      p.circle(point.x, point.y, radius * 2);
      p.noFill();
      p.stroke(0, 0, 0, 190);
      p.strokeWeight(Math.max(1 / camera.zoom, 0.75 / camera.zoom));
      p.circle(point.x, point.y, radius * 2);

      if (devLayout.enabled) {
        p.stroke(255, 255, 255, isHovered ? 255 : 140);
        p.strokeWeight(Math.max(2 / camera.zoom, 1.25 / camera.zoom));
        p.line(point.x - radius * 0.45, point.y, point.x + radius * 0.45, point.y);
        p.line(point.x, point.y - radius * 0.45, point.x, point.y + radius * 0.45);
      }
    }
    p.pop();
  }

  function drawVoronoiDevCells() {
    if (!devLayout.enabled || !manualVoronoiRegions.length) return;
    const p = p5inst;
    if (!p) return;

    p.push();
    p.noFill();
    p.strokeWeight(Math.max(1.1 / camera.zoom, 0.8 / camera.zoom));

    for (const region of manualVoronoiRegions) {
      if (!region.points?.length) continue;
      const rgb = hexToRgb(region.color || "#9ca3af");
      p.stroke(rgb[0], rgb[1], rgb[2], 120);
      p.beginShape();
      for (const [x, y] of region.points) p.vertex(x, y);
      p.endShape(p.CLOSE);
    }

    p.pop();
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
    userSetup(publicAPI);

    new p5(function (p) {
      p5inst = p;

      p.preload = function () {
        for (const { path } of pendingIcons) imageCache[path] = p.loadImage(path);
        imageCache[WORLD_MAP_IMAGE_PATH] = p.loadImage(WORLD_MAP_IMAGE_PATH);
      };

      p.setup = function () {
        const wrap = document.getElementById("journey-canvas-wrap");
        const cnv = p.createCanvas(FALLBACK_VIEW_W, FALLBACK_VIEW_H);
        const canvasEl = cnv.elt;
        cnv.parent(wrap);
        cnv.style("background", "transparent");
        canvasEl.style.touchAction = "none";
        canvasEl.style.imageRendering = "pixelated";
        canvasEl.style.imageRendering = "crisp-edges";
        p.textFont("Silkscreen");
        p.pixelDensity(1);
        p.noSmooth();
        p.frameRate(30);
        p.noLoop();

  recomputeContentBounds();
        rebuildManualVoronoiRegions();
        recomputeContentBounds();
        updateViewSize();
        p.resizeCanvas(viewW, viewH);
        resetCamera();

        if (nodes.some((n) => n.opts.current)) p.loop();

        canvasEl.addEventListener("pointerdown", (event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;

          syncPointer(event.pointerId, event);
          canvasEl.setPointerCapture(event.pointerId);

          if (devLayout.enabled && activePointers.size === 1) {
            const point = getCanvasPoint(event.clientX, event.clientY);
            const world = screenToWorld(point.x, point.y);
            const regionSeedPoint = findRegionSeedPointAt(world.x, world.y);
            if (event.shiftKey && regionSeedPoint) {
              const removed = removeRegionSeedPoint(regionSeedPoint);
              setHoveredNode(null);
              setRegionSeedPointHover(null);
              setHoveredRegion(findRegionAt(world.x, world.y), point);
              if (removed && p5inst && !p5inst.isLooping()) p5inst.redraw();
              return;
            }

            if (regionSeedPoint) {
              devDragState = {
                type: "region-seed",
                pointerId: event.pointerId,
                regionSeedPoint,
                offsetX: world.x - regionSeedPoint.x,
                offsetY: world.y - regionSeedPoint.y,
              };
              setHoveredNode(null);
              setHoveredRegion({ id: regionSeedPoint.regionId, color: regionSeedPoint.color, tooltip: regionSeedPoint.tooltip });
              setRegionSeedPointHover(regionSeedPoint);
              updateCursor("grabbing");
              return;
            }

            if (event.shiftKey) {
              const targetRegion = findRegionAt(world.x, world.y);
              if (targetRegion?.id) {
                const addedPoint = addRegionSeedPoint(targetRegion.id, world.x, world.y);
                if (addedPoint) {
                  devDragState = {
                    type: "region-seed",
                    pointerId: event.pointerId,
                    regionSeedPoint: addedPoint,
                    offsetX: 0,
                    offsetY: 0,
                  };
                  setHoveredNode(null);
                  setHoveredRegion(targetRegion);
                  setRegionSeedPointHover(addedPoint);
                  updateCursor("grabbing");
                  if (p5inst && !p5inst.isLooping()) p5inst.redraw();
                  return;
                }
              }
            }

            const node = findNodeAt(world.x, world.y);
            if (node) {
              devDragState = {
                type: "node",
                pointerId: event.pointerId,
                node,
                offsetX: world.x - node.x,
                offsetY: world.y - node.y,
              };
              setHoveredRegion(null);
              setHoveredNode(node);
              updateCursor("grabbing");
              return;
            }
          }

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
          setHoveredRegion(null);
        });

        canvasEl.addEventListener("pointermove", (event) => {
          if (activePointers.has(event.pointerId)) syncPointer(event.pointerId, event);

          if (devDragState && devDragState.pointerId === event.pointerId) {
            const point = getCanvasPoint(event.clientX, event.clientY);
            const world = screenToWorld(point.x, point.y);
            if (devDragState.type === "region-seed") {
              const updatedPoint = updateRegionSeedPoint(
                devDragState.regionSeedPoint,
                world.x - devDragState.offsetX,
                world.y - devDragState.offsetY,
              );
              if (updatedPoint) {
                devDragState.regionSeedPoint = updatedPoint;
                setRegionSeedPointHover(updatedPoint);
              }
            } else {
              devDragState.node.x = world.x - devDragState.offsetX;
              devDragState.node.y = world.y - devDragState.offsetY;
              refreshLayoutState();
              if (hovered === devDragState.node) showTip(devDragState.node);
            }
            if (p5inst && !p5inst.isLooping()) p5inst.redraw();
            return;
          }

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
          if (devDragState && devDragState.pointerId === event.pointerId) {
            activePointers.delete(event.pointerId);
            devDragState = null;
            if (!activePointers.size) {
              setRegionSeedPointHover(null);
            }
            if (!activePointers.size) updateCursor("grab");
            if (p5inst && !p5inst.isLooping()) p5inst.redraw();
            return;
          }

          const wasDragPointer = dragState && dragState.pointerId === event.pointerId ? dragState : null;
          activePointers.delete(event.pointerId);

          if (activePointers.size >= 2) {
            startPinch();
          } else {
            pinchState = null;
          }

          if (wasDragPointer && !wasDragPointer.moved) {
            const point = getCanvasPoint(event.clientX, event.clientY);
            lastMouseScreen = { x: point.x, y: point.y };
            const world = screenToWorld(point.x, point.y);
            const node = findNodeAt(world.x, world.y);
            if (node) {
              setHoveredRegion(null);
              setHoveredNode(node);
            } else {
              setHoveredNode(null);
              setHoveredRegion(findRegionAt(world.x, world.y), point);
            }
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

        window.addEventListener("keydown", (event) => {
          if (!devLayout.enabled) return;
          const tag = (event.target && event.target.tagName ? event.target.tagName : "").toLowerCase();
          if (tag === "input" || tag === "textarea") return;

          if (event.code === "KeyP") {
            event.preventDefault();
            exportNodePositions();
          }
        });

        if (window.ResizeObserver) {
          wrapResizeObserver?.disconnect();
          wrapResizeObserver = new ResizeObserver(() => {
            updateViewSize();
            p.resizeCanvas(viewW, viewH);
            resetCamera();
            setHoveredNode(null);
            setHoveredRegion(null);
          });
          wrapResizeObserver.observe(wrap);
        }

        window.addEventListener("resize", () => {
          updateViewSize();
          p.resizeCanvas(viewW, viewH);
          resetCamera();
          setHoveredNode(null);
          setHoveredRegion(null);
        });
      };

      p.draw = function () {
        p.noSmooth();
        p.drawingContext.imageSmoothingEnabled = false;
        p.clear();
        p.push();
        p.translate(viewW / 2 + camera.panX, viewH / 2 + camera.panY);
        p.scale(camera.zoom);
        drawWorldBackground();
        for (const r of manualVoronoiRegions) drawRegion(r);
        for (const r of regions) drawRegion(r);
        drawVoronoiDevCells();
        drawCollectiveRegionOutlines();
        drawHoveredRegionOutline();
        if (DEBUG.showLabels) {
          for (const l of mapLabels) drawMapLabel(l);
        }
        if (DEBUG.showRoads) {
          for (const r of roads) drawRoad(r);
        }
        if (DEBUG.showNodes) {
          for (const n of nodes) drawNode(n);
        }
        drawRegionDebugPoints();
        p.pop();
        applyEdgeFade();
      };

      p.mouseMoved = function () {
        if (dragState || pinchState || activePointers.size) return;
        lastMouseScreen = { x: p.mouseX, y: p.mouseY };
        const world = screenToWorld(p.mouseX, p.mouseY);
        const regionSeedPoint = findRegionSeedPointAt(world.x, world.y);
        if (regionSeedPoint) {
          setHoveredNode(null);
          setHoveredRegion({ id: regionSeedPoint.regionId, color: regionSeedPoint.color, tooltip: regionSeedPoint.tooltip }, { x: p.mouseX, y: p.mouseY });
          setRegionSeedPointHover(regionSeedPoint);
          return;
        }

        setRegionSeedPointHover(null);
        const node = findNodeAt(world.x, world.y);
        if (node) {
          setHoveredRegion(null);
          setHoveredNode(node);
          if (hovered) showTip(hovered);
          return;
        }

        setHoveredNode(null);
        setHoveredRegion(findRegionAt(world.x, world.y), { x: p.mouseX, y: p.mouseY });
      };

      p.mouseExited = function () {
        setHoveredNode(null);
        setHoveredRegion(null);
        setRegionSeedPointHover(null);
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
      roads.push({ a: nodeA, b: nodeB, color: color || null, style: "regular" });
    },
    dottedRoad(nodeA, nodeB, color) {
      roads.push({ a: nodeA, b: nodeB, color: color || null, style: "dotted" });
    },
    preloadIcon(path) {
      pendingIcons.push({ path });
    },
    region(points, color) {
      regions.push({ points, color: color || "#6b7280" });
    },
    label(text, x, y, opts = {}) {
      mapLabels.push({ text, x, y, ...opts });
    },
    defineVoronoiRegions(regionsData = []) {
      const normalized = [];
      for (const region of regionsData) {
        if (!region || typeof region !== "object") continue;
        if (!region.color) continue;

        const normalizedColor = normalizeHexColor(region.color);
        const tooltipData = typeof region.tooltip === "string" ? region.tooltip : "";

        normalized.push({
          id: typeof region.id === "string" && region.id.trim() ? region.id.trim() : tooltipData || normalizedColor,
          color: normalizedColor,
          tooltip: tooltipData,
          points: Array.isArray(region.points) ? region.points : [],
        });
      }

      manualVoronoiConfig = {
        ...manualVoronoiConfig,
        enabled: true,
        regions: normalized,
      };
    },
    enableDevLayout(config = {}) {
      devLayout = {
        ...devLayout,
        enabled: true,
        ...config,
      };
      console.info("[JourneyMap] Dev layout mode enabled. Drag nodes and region seeds. Shift+click a seed to delete it or a region to add one. Press P to print layout data.");
    },
    exportNodePositions,
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
