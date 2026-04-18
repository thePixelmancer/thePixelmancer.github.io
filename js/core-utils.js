(function (global) {
  const DEFAULT_BADGE_CLASSES = "bg-dark-800 text-gray-100 border-dark-700";

  const TAG_BADGE_BY_COLOR = {
    amber: "bg-amber-900 text-amber-100 border-amber-600",
    blue: "bg-blue-900 text-blue-100 border-blue-600",
    fuchsia: "bg-fuchsia-900 text-fuchsia-100 border-fuchsia-600",
    green: "bg-green-900 text-green-100 border-green-600",
    orange: "bg-orange-900 text-orange-100 border-orange-600",
    purple: "bg-purple-900 text-purple-100 border-purple-600",
  };

  function normalizeTagName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function normalizeTagEntry(tag) {
    if (typeof tag === "string") return { name: tag, primary: false };
    if (tag && typeof tag === "object") {
      return {
        name: tag.name || "",
        primary: !!tag.primary,
        color: tag.color,
      };
    }
    return { name: "", primary: false };
  }

  function titleCaseTag(tag) {
    return String(tag || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function readTagDefinitions(payload) {
    if (Array.isArray(payload)) return payload;
    return payload?.tags || [];
  }

  function extractCollection(payload, dataKey) {
    if (Array.isArray(payload)) return payload;
    if (dataKey && Array.isArray(payload?.[dataKey])) return payload[dataKey];
    return payload?.items || payload?.quests || payload?.skills || [];
  }

  async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadJSON(url) {
    return fetchJSON(url);
  }

  async function loadDataWithTags({ dataUrl, dataKey, tagsUrl = "./data/tags.json" }) {
    const [payload, tagPayload] = await Promise.all([fetchJSON(dataUrl), fetchJSON(tagsUrl)]);
    return {
      data: extractCollection(payload, dataKey),
      tagDefinitions: readTagDefinitions(tagPayload),
    };
  }

  function createTagManager({
    badgeByColor = TAG_BADGE_BY_COLOR,
    defaultBadgeClasses = DEFAULT_BADGE_CLASSES,
  } = {}) {
    let tagColorLookup = new Map();

    function setTagColorLookup(definitions) {
      const map = new Map();
      (definitions || []).forEach((entry) => {
        if (!entry?.name || !entry?.color) return;
        map.set(normalizeTagName(entry.name), String(entry.color).toLowerCase());
      });
      tagColorLookup = map;
    }

    function getTagColorName(tagName, explicitColor) {
      if (explicitColor) return String(explicitColor).toLowerCase();
      const normalized = normalizeTagName(tagName);
      return tagColorLookup.get(normalized) || "white";
    }

    function getBadgeClasses(tagName, explicitColor) {
      const color = getTagColorName(tagName, explicitColor);
      return badgeByColor[color] || defaultBadgeClasses;
    }

    return {
      normalizeTagName,
      normalizeTagEntry,
      setTagColorLookup,
      getTagColorName,
      getBadgeClasses,
    };
  }

  function createSequentialRevealer({
    itemSelector = ".sequential-reveal-item",
    visibleClass = "is-visible",
    baseDelay = 30,
    staggerDelay = 55,
  } = {}) {
    let runId = 0;

    return function reveal(container) {
      const items = Array.from(container.querySelectorAll(itemSelector));
      if (!items.length) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      items.forEach((item) => item.classList.remove(visibleClass));

      if (prefersReducedMotion) {
        items.forEach((item) => item.classList.add(visibleClass));
        return;
      }

      runId += 1;
      const activeRun = runId;

      items.forEach((item, index) => {
        window.setTimeout(() => {
          if (activeRun !== runId) return;
          item.classList.add(visibleClass);
        }, baseDelay + index * staggerDelay);
      });
    };
  }

  function createModalController({
    modalId,
    closeSelector = "[data-modal-close]",
    hiddenClass = "hidden",
    openClass = "flex",
  }) {
    let listenersAttached = false;

    function getModal() {
      return document.getElementById(modalId);
    }

    function close() {
      const modal = getModal();
      if (!modal) return;
      modal.classList.add(hiddenClass);
      modal.classList.remove(openClass);
    }

    function open() {
      const modal = getModal();
      if (!modal) return;
      modal.classList.remove(hiddenClass);
      modal.classList.add(openClass);
    }

    function attachListeners() {
      if (listenersAttached) return;
      const modal = getModal();
      if (!modal) return;

      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          close();
          return;
        }
        if (event.target.closest(closeSelector)) {
          close();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
      });

      listenersAttached = true;
    }

    return {
      attachListeners,
      close,
      getModal,
      open,
    };
  }

  global.AngeloCore = {
    createModalController,
    createSequentialRevealer,
    createTagManager,
    loadJSON,
    loadDataWithTags,
    normalizeTagEntry,
    normalizeTagName,
    readTagDefinitions,
    titleCaseTag,
  };
})(window);