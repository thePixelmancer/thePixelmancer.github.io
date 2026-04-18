const PARALLAX_POINTER_KEY = "parallax:lastPointer";

// Different movement strengths for each layer (back to front)
const movementFactors = [5, 20, 55]; // pixels max offset
// Different scales for each layer to enhance parallax effect
const scales = [1.05, 1.1, 1.15]; // scale factors

function createParallaxLayers() {
  const body = document.body;

  // Layer 1 - Back
  const layer1 = document.createElement("div");
  layer1.className = "fixed inset-0 z-[1] origin-center will-change-transform";
  layer1.innerHTML = `<img src="images/bgz0.png" alt="" class="absolute inset-0 w-full h-full object-cover" />`;

  // Layer 2 - Middle
  const layer2 = document.createElement("div");
  layer2.className = "fixed inset-0 z-[2] origin-center will-change-transform";
  layer2.innerHTML = `<img src="images/bgz1.png" alt="" class="absolute inset-0 w-full h-full object-cover" />`;

  // Layer 3 - Front
  const layer3 = document.createElement("div");
  layer3.className = "fixed inset-0 z-[3] origin-center will-change-transform";
  layer3.innerHTML = `
    <img src="images/bgz2.png" alt="" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-dark-900/80"></div>
  `;

  // Insert layers at the beginning of body in correct order (back to front)
  body.insertBefore(layer3, body.firstChild); // front layer (highest z-index)
  body.insertBefore(layer2, body.firstChild); // middle layer
  body.insertBefore(layer1, body.firstChild); // back layer (lowest z-index)

  return [layer1, layer2, layer3];
}

function readSavedPointer() {
  try {
    const raw = sessionStorage.getItem(PARALLAX_POINTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") return null;
    return {
      x: Math.max(-1, Math.min(1, parsed.x)),
      y: Math.max(-1, Math.min(1, parsed.y)),
    };
  } catch {
    return null;
  }
}

function savePointer(x, y) {
  try {
    sessionStorage.setItem(PARALLAX_POINTER_KEY, JSON.stringify({ x, y }));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
}

function initParallax() {
  const layers = createParallaxLayers();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const saved = readSavedPointer();
  const target = {
    x: saved?.x ?? 0,
    y: saved?.y ?? 0,
  };
  const current = {
    x: target.x,
    y: target.y,
  };

  function applyTransforms(x, y) {
    layers.forEach((layer, index) => {
      if (!layer) return;
      const movement = movementFactors[index];
      const scale = scales[index];
      const translateX = -x * movement;
      const translateY = -y * movement;
      layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    });
  }

  // Set the first frame immediately so the background starts at a stable position.
  applyTransforms(current.x, current.y);

  if (prefersReducedMotion) return;

  function updateTargetFromPointer(clientX, clientY) {
    target.x = (clientX / window.innerWidth) * 2 - 1;
    target.y = (clientY / window.innerHeight) * 2 - 1;
    savePointer(target.x, target.y);
  }

  window.addEventListener("pointermove", (e) => {
    updateTargetFromPointer(e.clientX, e.clientY);
  });

  const LERP = 0.1;
  function tick() {
    current.x += (target.x - current.x) * LERP;
    current.y += (target.y - current.y) * LERP;
    applyTransforms(current.x, current.y);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initParallax);
} else {
  initParallax();
}
