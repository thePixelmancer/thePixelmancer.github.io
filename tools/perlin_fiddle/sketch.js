// Simple Perlin Noise Display with Custom JavaScript
let worldSize = 256; // World size in logical pixels (higher values = more detail)
let gridSize = 16; // Grid spacing in logical pixels
let gridColor = "#ff0000ff"; // Grid color (default red)
let zoom = 1; // Visual zoom factor for display
let panX = 0; // Pan offset X
let panY = 0; // Pan offset Y

// Load saved code from localStorage, or use default
const savedCode = localStorage.getItem('perlinFiddleCode');
let customCode = savedCode || `let noise1 = noise(x * 0.03, y * 0.03);

result = noise1 > 0.5;`;
let executeFunction = null;

function customLoop(i, func) {
  for (let j = 0; j < i; j++) {
    func();
  }
}


function setup() {
  let canvas = createCanvas(600, 600);
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

  // Display zoom info (not affected by transformations) - optimized string formatting
  fill(255);
  rect(5, 5, 240, 25);
  fill(0);
  text("Zoom: " + zoom.toFixed(2) + "x (scroll to change)", 10, 18);
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
  const xScale = (width - 1) / (worldSize - 1);
  const yScale = (height - 1) / (worldSize - 1);
  
  // Pre-calculate pixel boundaries for all logical pixels
  const pixelBounds = new Array(worldSize);
  for (let i = 0; i < worldSize; i++) {
    pixelBounds[i] = {
      startX: Math.floor(i * pixelWidth),
      endX: Math.floor((i + 1) * pixelWidth),
      x: i * xScale // Pre-calculated coordinate for noise
    };
  }

  // Loop through every logical pixel
  for (let logicalX = 0; logicalX < worldSize; logicalX++) {
    const xBounds = pixelBounds[logicalX];
    const x = xBounds.x;
    
    for (let logicalY = 0; logicalY < worldSize; logicalY++) {
      const yBounds = pixelBounds[logicalY];
      const y = yBounds.x; // Using same calculation for y coordinate
      
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
        const startY = yBounds.startX; // Using startX calculation for Y
        const endY = yBounds.endX; // Using endX calculation for Y
        
        for (let py = startY; py < endY; py++) {
          let baseIndex = (startX + py * width) * 4;
          for (let px = startX; px < endX; px++) {
            pg.pixels[baseIndex] = r;     // Red
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
        const startY = yBounds.startX;
        const endY = yBounds.endX;

        for (let py = startY; py < endY; py++) {
          let baseIndex = (startX + py * width) * 4;
          for (let px = startX; px < endX; px++) {
            pg.pixels[baseIndex] = 0;     // Red
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
    gridSize = Math.max(1, Math.min(128, gridSize)); // Constrain between 1 and 128
  }

  // Get grid color from input field
  const gridColorInput = document.getElementById("gridColorInput");
  if (gridColorInput) {
    gridColor = gridColorInput.value;
  }

  // Convert hex color to RGB values
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 255, g: 255, b: 100}; // Default to white if parsing fails
  };

  const rgb = hexToRgb(gridColor);

  // Draw a grid every gridSize logical pixels
  stroke(rgb.r, rgb.g, rgb.b, 255); // Semi-transparent grid color
  strokeWeight(1 / zoom); // Keep stroke at 1 screen pixel regardless of zoom
  
  // Pre-calculate the pixel size to avoid repeated calculations
  const pixelWidth = width / worldSize;
  const pixelHeight = height / worldSize;
  
  // Pre-calculate grid positions for vertical lines
  const verticalLines = [];
  for (let logicalX = gridSize; logicalX < worldSize; logicalX += gridSize) {
    verticalLines.push(Math.floor(logicalX * pixelWidth));
  }
  
  // Pre-calculate grid positions for horizontal lines
  const horizontalLines = [];
  for (let logicalY = gridSize; logicalY < worldSize; logicalY += gridSize) {
    horizontalLines.push(Math.floor(logicalY * pixelHeight));
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

function mouseWheel(event) {
  // Only zoom if mouse is over the canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Visual zoom with mouse wheel - use ternary for efficiency
    zoom *= (event.delta > 0) ? 0.9 : 1.1;

    // Constrain zoom to reasonable bounds (minimum 1x, maximum 20x)
    zoom = Math.max(1.0, Math.min(20, zoom));

    return false; // Prevent page scrolling
  }
}

function mouseDragged() {
  // Only pan if mouse is over the canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Pan the view when dragging
    panX += mouseX - pmouseX;
    panY += mouseY - pmouseY;
    
    // Constrain panning to keep the terrain visible
    // Calculate the maximum pan distance based on zoom level
    const maxPan = (width * (zoom - 1)) / 2; // Same calculation for both X and Y
    
    // Constrain pan values using Math.max/min for better performance
    panX = Math.max(-maxPan, Math.min(maxPan, panX));
    panY = Math.max(-maxPan, Math.min(maxPan, panY));
  }
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
            // Include common math functions in scope
            const sin = Math.sin;
            const cos = Math.cos;
            const tan = Math.tan;
            const abs = Math.abs;
            const sqrt = Math.sqrt;
            const pow = Math.pow;
            const min = Math.min;
            const max = Math.max;
            const floor = Math.floor;
            const ceil = Math.ceil;
            const round = Math.round;
            const PI = Math.PI;
            const E = Math.E;
            const random = Math.random;
            const loop = customLoop; // Use custom loop function
            
            // Initialize result variable
            let result = 0;
            
            // Execute user's custom code
            ${customCode}
            
            // Return the result
            return result;
        `
    );
  } catch (error) {
    console.error("Error in JavaScript code:", error);
    // Fallback to default noise
    executeFunction = function (x, y) {
      return noise(x * 0.01, y * 0.01);
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

  customCode =
    code ||
    `let noise1 = noise(x * 0.03, y * 0.03);

result = noise1 > 0.5;`;

  // Save the code to localStorage
  localStorage.setItem('perlinFiddleCode', customCode);
  
  updateExecuteFunction();
  generateTerrain();
}
