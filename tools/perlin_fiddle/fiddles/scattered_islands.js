// Size of cells containing islands - effectively the scatter amount
v.mchunk_size = 200;
// Radius of islands
v.radius = 200;
// Inner island noise
v.perlin_1 = q.noise(v.originx * 0.02, v.originz * 0.02) / 2 + 0.5;

// Convert origin to axial hex coordinates (pointy-topped)
v.hex_width = v.mchunk_size;
v.hex_height = v.mchunk_size * 0.866; // ~sqrt(3)/2 for pointy tops

v.mchunk_x = math.floor(v.originx / v.hex_width);
v.mchunk_z = math.floor((v.originz - math.mod(v.mchunk_x, 2) * (v.hex_height / 2)) / v.hex_height);

// Calculate hex center
v.mchunk_cx = v.mchunk_x * v.hex_width + v.hex_width * 0.5;
v.mchunk_cz = v.mchunk_z * v.hex_height + v.hex_height * 0.5 + math.mod(v.mchunk_x, 2) * (v.hex_height / 2);

// Use noise to decide if a feature should spawn here
v.m_noise = q.noise(v.mchunk_x * 100.0, v.mchunk_z * 100.0) / 2 + 0.5;

v.should_spawn_here = v.m_noise < 1;

// Distance from this hex center
v.distance_from_center = math.sqrt(math.pow(v.mchunk_cx - v.originx, 2) + math.pow(v.mchunk_cz - v.originz, 2));

v.clamped_distance = math.clamp(v.distance_from_center, 0, v.radius);

v.normalized_distance = 1 - v.clamped_distance / v.radius;

return v.should_spawn_here ? v.perlin_1 * v.normalized_distance > 0.5 : 0;
