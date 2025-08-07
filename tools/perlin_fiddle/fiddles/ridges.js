v.scale = 0.008;

// Create ridged noise using multiple octaves and sharper exponents
v.n1 = math.pow(1 - math.abs(q.noise(v.originx * v.scale, v.originz * v.scale)), 4);
v.n2 = math.pow(1 - math.abs(q.noise(v.originx * v.scale * 2.1, v.originz * v.scale * 2.1)), 4);
v.n3 = math.pow(1 - math.abs(q.noise(v.originx * v.scale * 4.2, v.originz * v.scale * 4.2)), 4);
v.n4 = math.pow(1 - math.abs(q.noise(v.originx * v.scale * 8.3, v.originz * v.scale * 8.3)), 4);

// Blend octaves with decreasing influence
v.n1 = v.n1 / 2 + 0.5;
v.n2 = (v.n2 / 2 + 0.5) * 0.5;
v.n3 = (v.n3 / 2 + 0.5) * 0.25;
v.n4 = (v.n4 / 2 + 0.5) * 0.125;

v.value = (v.n1 + v.n2 + v.n3 + v.n4) / (1 + 0.5 + 0.25 + 0.125);

// Optional: emphasize only the highest ridges
v.value = math.pow(v.value, 1.5); // exaggerate tall features

return v.value > 0.85
  ? { r: 0.85, g: 0.85, b: 0.85 } // snowy peaks
  : v.value > 0.65
  ? { r: 0.6, g: 0.5, b: 0.4 } // rocky
  : v.value > 0.45
  ? { r: 0.3, g: 0.4, b: 0.2 } // foothills
  : { r: 0.2, g: 0.3, b: 0.1 }; // forest base
