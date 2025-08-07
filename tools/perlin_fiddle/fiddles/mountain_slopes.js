v.seed = 22254;
v.perlin_freq = 0.004;

v.perlin_1 = q.noise(v.originx * v.perlin_freq + v.seed, v.originz * v.perlin_freq) * 1;
v.perlin_2 = q.noise(v.originx * v.perlin_freq * 2 + v.seed, v.originz * v.perlin_freq * 2) * 0.5;
v.total_perlin = (v.perlin_1 + v.perlin_2) / 1.5;

// x neighbor
v.xperlin_1 = q.noise((v.originx + 2) * v.perlin_freq + v.seed, (v.originz + 0) * v.perlin_freq) * 1;
v.xperlin_2 = q.noise((v.originx + 2) * v.perlin_freq * 2 + v.seed, (v.originz + 0) * v.perlin_freq * 2) * 0.5;
v.xtotal_perlin = (v.xperlin_1 + v.xperlin_2) / 1.5;

// z neighbor
v.zperlin_1 = q.noise((v.originx + 0) * v.perlin_freq + v.seed, (v.originz + 2) * v.perlin_freq) * 1;
v.zperlin_2 = q.noise((v.originx + 0) * v.perlin_freq * 2 + v.seed, (v.originz + 2) * v.perlin_freq * 2) * 0.5;
v.ztotal_perlin = (v.zperlin_1 + v.zperlin_2) / 1.5;

// calulate gradient
v.delta_x = (v.xtotal_perlin - v.total_perlin) / 2;
v.delta_z = (v.ztotal_perlin - v.total_perlin) / 2;

// calculate overall slope strength and multiply it so its closer to 0-1 range
v.slope = math.sqrt(v.delta_x * v.delta_x + v.delta_z * v.delta_z) * 55;

v.height = v.total_perlin * 0.5 + 0.5; // normalize 0-1
v.level = (v.height * 4) | 0; // 4 levels: 0..3

// Add grass if low height & low slope, else snow/gravel/rock zones
return v.height < 0.4 && v.slope < 0.25
  ? v.level == 0
    ? { r: 0.2, g: 0.4, b: 0.1 }
    : v.level == 1
    ? { r: 0.25, g: 0.5, b: 0.15 }
    : v.level == 2
    ? { r: 0.3, g: 0.6, b: 0.2 }
    : { r: 0.35, g: 0.7, b: 0.25 }
  : v.slope < 0.25
  ? v.level == 0
    ? { r: 1, g: 1, b: 1 }
    : v.level == 1
    ? { r: 0.9, g: 0.9, b: 0.95 }
    : v.level == 2
    ? { r: 0.8, g: 0.8, b: 0.9 }
    : { r: 0.7, g: 0.7, b: 0.8 }
  : v.slope < 0.4
  ? v.level == 0
    ? { r: 0.6, g: 0.6, b: 0.6 }
    : v.level == 1
    ? { r: 0.5, g: 0.5, b: 0.5 }
    : v.level == 2
    ? { r: 0.4, g: 0.4, b: 0.4 }
    : { r: 0.3, g: 0.3, b: 0.3 }
  : v.level == 0
  ? { r: 0.25, g: 0.2, b: 0.25 }
  : v.level == 1
  ? { r: 0.2, g: 0.15, b: 0.2 }
  : v.level == 2
  ? { r: 0.15, g: 0.1, b: 0.15 }
  : { r: 0.1, g: 0.5, b: 0.1 };
