v.scale = 0.005;

v.oct1 = q.noise(v.originx * v.scale, v.originz * v.scale) / 2 + 0.5;
v.oct2 = (q.noise(v.originx * v.scale * 2, v.originz * v.scale * 2) / 2 + 0.5) * 0.5;
v.oct3 = (q.noise(v.originx * v.scale * 4, v.originz * v.scale * 4) / 2 + 0.5) * 0.25;

v.elevation = (v.oct1 + v.oct2 + v.oct3) / (1 + 0.5 + 0.25);
v.elevation = math.clamp(v.elevation, 0, 1);

if (v.elevation < 0.4) {
  return { r: 0, g: 0.2 + v.elevation * 0.5, b: 0.8 };
} else if (v.elevation < 0.6) {
  return { r: 0.9, g: 0.85, b: 0.6 };
} else if (v.elevation < 0.8) {
  return { r: 0.4, g: 0.7, b: 0.3 };
} else {
  return { r: 0.8, g: 0.8, b: 0.8 };
}