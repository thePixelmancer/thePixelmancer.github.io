function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateReveal() {
  const revealEls = Array.from(document.querySelectorAll(".index-reveal"));
  revealEls.forEach((el, i) => {
    window.setTimeout(() => {
      el.classList.add("is-visible");
    }, 90 + i * 70);
  });
}

function parseCounterTarget(rawText) {
  const value = String(rawText || "").trim();
  const match = value.match(/(\d+)/);
  if (!match) return null;

  return {
    target: Number.parseInt(match[1], 10),
    prefix: value.slice(0, match.index),
    suffix: value.slice((match.index || 0) + match[1].length),
  };
}

function animateCounters() {
  const counters = Array.from(document.querySelectorAll("[data-count-up]"));
  counters.forEach((el, i) => {
    const parsed = parseCounterTarget(el.textContent);
    if (!parsed) return;

    const duration = 900 + i * 180;
    const startAt = performance.now() + 380 + i * 100;

    function tick(now) {
      if (now < startAt) {
        requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min((now - startAt) / duration, 1);
      const eased = easeOutCubic(progress);
      const next = Math.round(parsed.target * eased);
      el.textContent = `${parsed.prefix}${next}${parsed.suffix}`;

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function typeLine(lineEl, text, speed) {
  return new Promise((resolve) => {
    let index = 0;
    lineEl.textContent = "";
    lineEl.classList.add("typewriter-line", "is-typing");

    function step() {
      lineEl.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) {
        const variance = Math.random() * 22;
        window.setTimeout(step, speed + variance);
      } else {
        lineEl.classList.remove("is-typing");
        resolve();
      }
    }

    step();
  });
}

async function typeBioLines() {
  const lines = Array.from(document.querySelectorAll("[data-type-line]"));
  if (!lines.length) return;

  const [firstLine, ...remainingLines] = lines;
  const firstText = firstLine.textContent || "";
  const firstHeight = Math.ceil(firstLine.getBoundingClientRect().height);

  firstLine.textContent = "";
  firstLine.classList.add("typewriter-line");
  firstLine.style.minHeight = `${Math.max(firstHeight, 16)}px`;

  remainingLines.forEach((line) => {
    line.classList.add("typewriter-reveal-wait");
  });

  // Start after panel reveal so typing feels intentional.
  await new Promise((resolve) => window.setTimeout(resolve, 900));

  await typeLine(firstLine, firstText, 16);

  remainingLines.forEach((line, i) => {
    window.setTimeout(() => {
      line.classList.remove("typewriter-reveal-wait");
      line.classList.add("typewriter-reveal-in");
    }, i * 90);
  });
}

function initIndexAnimations() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    document.querySelectorAll(".index-reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  animateReveal();
  animateCounters();
  typeBioLines();
}

document.addEventListener("DOMContentLoaded", initIndexAnimations);
