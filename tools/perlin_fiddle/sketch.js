// Simple Perlin Noise Display with Custom JavaScript
let worldSize = 256; // World viewport size - number of world coordinate units to display
let gridSize = 16; // Grid spacing in world coordinate units
let gridColor = "#ff0000ff"; // Grid color (default red)
let zoom = 1; // Visual zoom factor for display
let panX = 0; // Pan offset X
let panY = 0; // Pan offset Y

// Load saved code from localStorage, or use default
const savedCode = localStorage.getItem("perlinFiddleCode");
let customCode = savedCode || "";
let executeFunction = null;

function setup() {
  let canvas = createCanvas(512, 512);
  canvas.parent("p5-container");

  // Initialize with default code
  updateExecuteFunction();
  generateTerrain();
}

function draw() {
  // Clear background
  background(0);

  // Apply zoom and pan transformations
  push();
  translate(width / 2 + panX, height / 2 + panY);
  scale(zoom);
  translate(-width / 2, -height / 2);

  // Display the generated terrain
  drawGeneratedTerrain();

  // Draw grid overlay
  drawGrid();

  pop();

  // Display zoom info as a faint number in the corner
  fill(255, 255, 255, 100); // White with low opacity for faintness
  textAlign(RIGHT, TOP);
  text(zoom.toFixed(1) + "x", width - 10, 10);
  textAlign(LEFT, BASELINE); // Reset text alignment to default
}

let terrainImage; // Store the generated terrain as an image

function generateTerrain() {
  // Create a graphics buffer to draw the terrain
  let pg = createGraphics(width, height);
  pg.loadPixels();

  if (!executeFunction) {
    updateExecuteFunction();
  }

  // Get resolution from input field
  const resolutionInput = document.getElementById("resolutionInput");
  if (resolutionInput) {
    worldSize = parseInt(resolutionInput.value) || 512;
    worldSize = constrain(worldSize, 1, 4096);
  }

  // Pre-calculate scaling factors to avoid repeated map() calls
  const pixelWidth = width / worldSize;
  const pixelHeight = height / worldSize;
  // Use logical pixel indices as world coordinates for alignment with grid
  const xScale = 1; // Each logical pixel = 1 world coordinate unit
  const yScale = 1; // Each logical pixel = 1 world coordinate unit

  // Pre-calculate pixel boundaries for all logical pixels
  const pixelBoundsX = new Array(worldSize);
  const pixelBoundsY = new Array(worldSize);
  for (let i = 0; i < worldSize; i++) {
    pixelBoundsX[i] = {
      startX: Math.floor(i * pixelWidth),
      endX: Math.floor((i + 1) * pixelWidth),
      x: i, // World coordinate matches logical pixel index
    };
    pixelBoundsY[i] = {
      startY: Math.floor(i * pixelHeight),
      endY: Math.floor((i + 1) * pixelHeight),
      y: i, // World coordinate matches logical pixel index
    };
  }

  // Loop through every logical pixel
  for (let logicalX = 0; logicalX < worldSize; logicalX++) {
    const xBounds = pixelBoundsX[logicalX];
    const x = xBounds.x;

    for (let logicalY = 0; logicalY < worldSize; logicalY++) {
      const yBounds = pixelBoundsY[logicalY];
      const y = yBounds.y; // World coordinate for this pixel

      try {
        // Execute custom JavaScript code
        let result = executeFunction(x, y);

        // Determine color values with optimized type checking
        let r, g, b, a;
        const isObject = typeof result === "object" && result !== null;
        if (isObject && ("r" in result || "red" in result)) {
          // Handle RGB object - use Math.max/min for faster clamping
          r = Math.max(0, Math.min(255, (result.r || result.red || 0) * 255));
          g = Math.max(0, Math.min(255, (result.g || result.green || 0) * 255));
          b = Math.max(0, Math.min(255, (result.b || result.blue || 0) * 255));
          a = Math.max(0, Math.min(255, result.a || result.alpha || 255));
        } else {
          // Handle single value (grayscale) - optimize clamping and avoid repeated assignment
          result = Math.max(0, Math.min(1, result));
          r = g = b = result * 255;
          a = 255;
        }

        // Fill the pixel block with optimized nested loop
        const startX = xBounds.startX;
        const endX = xBounds.endX;
        const startY = yBounds.startY; // Correct Y bounds
        const endY = yBounds.endY; // Correct Y bounds

        for (let py = startY; py < endY; py++) {
          let baseIndex = (startX + py * width) * 4;
          for (let px = startX; px < endX; px++) {
            pg.pixels[baseIndex] = r; // Red
            pg.pixels[baseIndex + 1] = g; // Green
            pg.pixels[baseIndex + 2] = b; // Blue
            pg.pixels[baseIndex + 3] = a; // Alpha
            baseIndex += 4;
          }
        }
      } catch (error) {
        // If code fails, fill the pixel block with black - optimized version
        const startX = xBounds.startX;
        const endX = xBounds.endX;
        const startY = yBounds.startY;
        const endY = yBounds.endY;

        for (let py = startY; py < endY; py++) {
          let baseIndex = (startX + py * width) * 4;
          for (let px = startX; px < endX; px++) {
            pg.pixels[baseIndex] = 0; // Red
            pg.pixels[baseIndex + 1] = 0; // Green
            pg.pixels[baseIndex + 2] = 0; // Blue
            pg.pixels[baseIndex + 3] = 255; // Alpha
            baseIndex += 4;
          }
        }
      }
    }
  }

  pg.updatePixels();
  terrainImage = pg;
}

function drawGeneratedTerrain() {
  if (terrainImage) {
    // Disable image smoothing for crisp pixels when zoomed
    noSmooth();
    image(terrainImage, 0, 0);
  }
}

function drawGrid() {
  // Get grid size from input field
  const gridSizeInput = document.getElementById("gridSizeInput");
  if (gridSizeInput) {
    gridSize = parseInt(gridSizeInput.value) || 16;
    gridSize = Math.max(1, Math.min(worldSize, gridSize)); // Constrain between 1 and worldSize
  }

  // Get grid color from input field
  const gridColorInput = document.getElementById("gridColorInput");
  if (gridColorInput) {
    gridColor = gridColorInput.value;
  }

  // Convert hex color to RGB values
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 100 }; // Default to white if parsing fails
  };

  const rgb = hexToRgb(gridColor);

  // Draw a grid every gridSize world coordinates
  stroke(rgb.r, rgb.g, rgb.b, 255);
  strokeWeight(1 / zoom); // Keep stroke at 1 screen pixel regardless of zoom

  // Calculate screen pixel position for world coordinates
  // Since each logical pixel corresponds to one world coordinate,
  // we need to find which screen pixels correspond to world coordinates
  const pixelWidth = width / worldSize;
  const pixelHeight = height / worldSize;

  // Pre-calculate grid positions for vertical lines (at world coordinate boundaries)
  const verticalLines = [];
  for (let worldX = gridSize; worldX < worldSize; worldX += gridSize) {
    verticalLines.push(Math.floor(worldX * pixelWidth));
  }

  // Pre-calculate grid positions for horizontal lines (at world coordinate boundaries)
  const horizontalLines = [];
  for (let worldY = gridSize; worldY < worldSize; worldY += gridSize) {
    horizontalLines.push(Math.floor(worldY * pixelHeight));
  }

  // Draw all vertical lines
  for (let i = 0; i < verticalLines.length; i++) {
    line(verticalLines[i], 0, verticalLines[i], height);
  }

  // Draw all horizontal lines
  for (let i = 0; i < horizontalLines.length; i++) {
    line(0, horizontalLines[i], width, horizontalLines[i]);
  }
}

// Navigation helper functions
function isMouseOverCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

function constrainPan() {
  const maxPan = (width * (zoom - 1)) / 2;
  panX = Math.max(-maxPan, Math.min(maxPan, panX));
  panY = Math.max(-maxPan, Math.min(maxPan, panY));
}

function screenToWorld(screenX, screenY) {
  return {
    x: (screenX - width / 2 - panX) / zoom + width / 2,
    y: (screenY - height / 2 - panY) / zoom + height / 2,
  };
}

function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - width / 2) * zoom + width / 2 + panX,
    y: (worldY - height / 2) * zoom + height / 2 + panY,
  };
}

function mouseWheel(event) {
  if (!isMouseOverCanvas()) return;

  // Calculate world position under mouse before zoom
  const worldPos = screenToWorld(mouseX, mouseY);

  // Apply zoom
  zoom *= event.delta > 0 ? 0.9 : 1.1;
  zoom = Math.max(1.0, Math.min(20, zoom));

  // Adjust pan to keep world position under mouse
  const newScreenPos = worldToScreen(worldPos.x, worldPos.y);
  panX += mouseX - newScreenPos.x;
  panY += mouseY - newScreenPos.y;

  // Constrain pan to bounds
  constrainPan();

  return false; // Prevent page scrolling
}

function mouseDragged() {
  if (!isMouseOverCanvas()) return;

  // Pan the view
  panX += mouseX - pmouseX;
  panY += mouseY - pmouseY;

  // Constrain to bounds
  constrainPan();
}

function keyPressed() {
  // Resolution is now controlled by input field, no keyboard shortcuts
}

// Function to create an execution function from the JavaScript code
function updateExecuteFunction() {
  try {
    // Create a function that executes the custom code and returns the result
    executeFunction = new Function(
      "x",
      "y",
      `
            // Create math object with all math functions
            const math = {
              abs: (value) => Math.abs(value),
              sin: (value) => Math.sin(value),
              cos: (value) => Math.cos(value),
              clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
              ceil: (value) => Math.ceil(value),
              floor: (value) => Math.floor(value),
              trunc: (value) => Math.trunc(value),
              round: (value) => Math.round(value),
              mod: (value, denominator) => value % denominator,
              pow: (base, exponent) => Math.pow(base, exponent),
              sqrt: (value) => Math.sqrt(value),
              exp: (value) => Math.exp(value),
              pi: Math.PI,
              max: (a, b) => Math.max(a, b),
              min: (a, b) => Math.min(a, b),
              min_angle: (value) => {
                // Normalize angle to [-π, π]
                let angle = value % (2 * Math.PI);
                if (angle > Math.PI) angle -= 2 * Math.PI;
                if (angle < -Math.PI) angle += 2 * Math.PI;
                return angle;
              },
              asin: (value) => Math.asin(value),
              acos: (value) => Math.acos(value),
              atan: (value) => Math.atan(value),
              atan2: (y, x) => Math.atan2(y, x),
              random: (low, high) => Math.random() * (high - low) + low,
              random_integer: (low, high) => Math.floor(Math.random() * (high - low + 1)) + low,
              die_roll: (num, low, high) => {
                let sum = 0;
                for (let i = 0; i < num; i++) {
                  sum += Math.random() * (high - low) + low;
                }
                return sum / num;
              },
              die_roll_integer: (num, low, high) => {
                let sum = 0;
                for (let i = 0; i < num; i++) {
                  sum += Math.floor(Math.random() * (high - low + 1)) + low;
                }
                return Math.floor(sum / num);
              },
              hermite_blend: (value) => value * value * (3 - 2 * value),
              lerp: (start, end, t) => start + (end - start) * t,
              lerprotate: (start, end, t) => {
                // Linear interpolation for angles (shortest path)
                let diff = end - start;
                if (diff > Math.PI) diff -= 2 * Math.PI;
                if (diff < -Math.PI) diff += 2 * Math.PI;
                return start + diff * t;
              },
              ln: (value) => Math.log(value)
            };

            let query = {
              noise: noise
            };
            let variable = {
              originx: x,
              originz: y,
              worldx: x,
              worldz: y,
            };
            let v = variable; // Alias for variable - both reference the same object
            let q = query;
            
            // Execute user's custom code
            ${customCode}
            
            return 0;
        `
    );
  } catch (error) {
    console.error("Error in JavaScript code:", error);
    // Fallback to default noise
    executeFunction = function (x, y) {
      return 0;
    };
  }
}

// Function called from HTML button
function updateExpression() {
  // Get code from CodeMirror editor if available, otherwise fallback to textarea
  let code;
  if (typeof codeEditor !== "undefined" && codeEditor) {
    code = codeEditor.getValue();
  } else {
    const input = document.getElementById("mathInput");
    code = input.value;
  }

  customCode = code || "";

  // Save the code to localStorage
  localStorage.setItem("perlinFiddleCode", customCode);

  updateExecuteFunction();
  generateTerrain();
}
