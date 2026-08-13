// ---- Procedural Village Generator & Foundation Engine ---------------------
import { CHUNK, HEIGHT, SEA, SEED, hash2, surfaceHeight } from './config.js';
import { spawnMob } from './mobs.js';
import {
  getSmallOakCottageSchematic,
  getBlacksmithWorkshopSchematic,
  getLargeTwoStoryHouseSchematic,
  getVillageWellSchematic,
  getClericShrineSchematic,
  getLibrarianHouseSchematic
} from './structures/villageHouses.js';
import {
  getStandardCropStripSchematic,
  getBackyardGardenSchematic,
  getDoubleTrenchFieldSchematic,
  getTerracedFarmlandSchematic
} from './structures/villageFarmland.js';

// Cache generated village layouts to ensure multi-chunk determinism & instant loading
const villageLayoutCache = new Map();

// Village radius for perimeter wall (in world-blocks)
const VILLAGE_RADIUS = 30;

/**
 * Checks if a chunk coordinate is a Village Center
 */
export function isVillageCenterChunk(vcx, vcz) {
  // Guaranteed starter villages immediately adjacent to player spawn
  if ((vcx === 1 && vcz === 0) || (vcx === 2 && vcz === 2) ||
      (vcx === -2 && vcz === -2) || (vcx === 3 && vcz === 3)) return true;

  // Village grid spacing: every 8 chunks (~128 meters)
  const spacing = 8;
  const gridX = Math.floor(vcx / spacing);
  const gridZ = Math.floor(vcz / spacing);

  // Hash within grid cell
  const centerDx = Math.floor(hash2(gridX, gridZ, SEED + 101) * (spacing - 3)) + 1;
  const centerDz = Math.floor(hash2(gridX, gridZ, SEED + 202) * (spacing - 3)) + 1;

  const targetCx = gridX * spacing + centerDx;
  const targetCz = gridZ * spacing + centerDz;

  return (vcx === targetCx && vcz === targetCz);
}

/**
 * Returns true if a given world-block coordinate is inside ANY known village perimeter
 */
export function isInVillageZone(wx, wz) {
  for (const [key] of villageLayoutCache) {
    const [vcxStr, vczStr] = key.split(',');
    const vcx = parseInt(vcxStr, 10);
    const vcz = parseInt(vczStr, 10);
    const centerWx = vcx * CHUNK + 8;
    const centerWz = vcz * CHUNK + 8;
    const dx = wx - centerWx;
    const dz = wz - centerWz;
    if (Math.abs(dx) <= VILLAGE_RADIUS + 4 && Math.abs(dz) <= VILLAGE_RADIUS + 4) return true;
  }
  return false;
}

/**
 * Evaluates terrain flatness & suitability around (wx, wz)
 */
export function isTerrainSuitableForVillage(wx, wz) {
  const centerH = surfaceHeight(wx, wz);
  if (centerH <= SEA + 1) return false; // Must be on dry land above sea level

  let minH = 999, maxH = -999;
  let waterCount = 0;

  for (let dx = -12; dx <= 12; dx += 4) {
    for (let dz = -12; dz <= 12; dz += 4) {
      const h = surfaceHeight(wx + dx, wz + dz);
      if (h <= SEA) waterCount++;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
  }
  if (waterCount > 4) return false;
  return (maxH - minH) <= 28;
}

/**
 * Gets or constructs the deterministic village layout centered at (vcx, vcz)
 */
export function getVillageLayout(vcx, vcz) {
  const key = `${vcx},${vcz}`;
  if (villageLayoutCache.has(key)) return villageLayoutCache.get(key);

  const centerWx = vcx * CHUNK + 8;
  const centerWz = vcz * CHUNK + 8;
  const centerBaseY = surfaceHeight(centerWx, centerWz);

  const layout = {
    vcx, vcz,
    centerWx, centerWz, centerBaseY,
    voxels: new Map(), // key: "wx,wy,wz" -> blockId
    structures: [],
    villagers: []
  };

  if (!isTerrainSuitableForVillage(centerWx, centerWz)) {
    villageLayoutCache.set(key, layout);
    return layout;
  }

  // ── Step 0: Landscape Terraforming & Grading ─────────────────────────────
  // Smoothly blend the terrain within the village perimeter toward centerBaseY
  // Eliminates jagged sheer cliff cuts, chasms, and steep unnatural drops
  for (let dx = -VILLAGE_RADIUS - 1; dx <= VILLAGE_RADIUS + 1; dx++) {
    for (let dz = -VILLAGE_RADIUS - 1; dz <= VILLAGE_RADIUS + 1; dz++) {
      const wx = centerWx + dx;
      const wz = centerWz + dz;
      const dist = Math.hypot(dx, dz);
      if (dist > VILLAGE_RADIUS + 1) continue;

      const naturalH = surfaceHeight(wx, wz);
      // Smoothstep radial transition from center to perimeter
      const normDist = dist / (VILLAGE_RADIUS + 1);
      const weight = normDist * normDist * (3 - 2 * normDist); // 0 at center, 1 at perimeter
      const gradedY = Math.round(centerBaseY * (1 - weight) + naturalH * weight);

      // Topsoil: Grass (ID 1)
      layout.voxels.set(`${wx},${gradedY},${wz}`, 1);
      // Subsoil: Dirt (ID 2)
      for (let dy = 1; dy <= 3; dy++) {
        if (gradedY - dy >= 1) {
          layout.voxels.set(`${wx},${gradedY - dy},${wz}`, 2);
        }
      }
      // Bedrock stone below: Stone (ID 3)
      for (let dy = 4; dy <= 6; dy++) {
        if (gradedY - dy >= 1) {
          layout.voxels.set(`${wx},${gradedY - dy},${wz}`, 3);
        }
      }
      // Clear air above graded terrain to remove tree leaves, shrubs, and cave overhangs
      const clearTop = Math.max(naturalH + 6, gradedY + 8);
      for (let ay = gradedY + 1; ay <= Math.min(HEIGHT - 1, clearTop); ay++) {
        layout.voxels.set(`${wx},${ay},${wz}`, 0);
      }
    }
  }

  // ── 1. Central Village Well & Town Plaza ─────────────────────────────────
  const wellSchematic = getVillageWellSchematic();
  placeSchematicWithFoundation(layout, centerWx, centerBaseY, centerWz, wellSchematic);
  layout.structures.push({ type: 'Village Well', x: centerWx, y: centerBaseY, z: centerWz });

  // Stone Brick Plaza ring around the well (5x5 apron)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) continue; // well occupies 3x3
      layout.voxels.set(`${centerWx + dx},${centerBaseY},${centerWz + dz}`, 16); // Stone Brick apron
    }
  }

  // ── 2. Market Stalls in Central Town Plaza ────────────────────────────────
  // Stall 1: Red & White Striped Canopy (North-East of Well)
  buildMarketStall(layout, centerWx + 4, centerBaseY, centerWz + 3, [51, 50]); // Red/White
  // Stall 2: Blue & Yellow Striped Canopy (North-West of Well)
  buildMarketStall(layout, centerWx - 4, centerBaseY, centerWz + 3, [52, 54]); // Blue/Yellow

  // ── 3. Perimeter Boundary Wall & 4 Fortified Gatehouses ──────────────────
  buildPerimeterWall(layout, centerWx, centerBaseY, centerWz);

  // ── 4. Buildings & Farmland along Roads ───────────────────────────────────
  const buildingSlots = [
    // East arm
    { offsetDx: 16,  offsetDz: 6,   schematic: getSmallOakCottageSchematic(),       profession: 'unemployed' },
    { offsetDx: 16,  offsetDz: -10, schematic: getBlacksmithWorkshopSchematic(),    profession: 'blacksmith' },
    // West arm
    { offsetDx: -18, offsetDz: 6,   schematic: getLargeTwoStoryHouseSchematic(),    profession: 'librarian' },
    { offsetDx: -18, offsetDz: -10, schematic: getLibrarianHouseSchematic(),        profession: 'librarian' },
    // South arm
    { offsetDx: 6,   offsetDz: 16,  schematic: getClericShrineSchematic(),          profession: 'cleric' },
    { offsetDx: -8,  offsetDz: 16,  schematic: getSmallOakCottageSchematic(),       profession: 'unemployed' },
    // North arm
    { offsetDx: 6,   offsetDz: -18, schematic: getSmallOakCottageSchematic(),       profession: 'unemployed' },
    { offsetDx: -8,  offsetDz: -18, schematic: getLargeTwoStoryHouseSchematic(),    profession: 'unemployed' },
    // Farmland plots
    { offsetDx: 8,   offsetDz: 14,  schematic: getStandardCropStripSchematic(),     profession: null },
    { offsetDx: -12, offsetDz: 14,  schematic: getDoubleTrenchFieldSchematic(),     profession: null },
    { offsetDx: 8,   offsetDz: -16, schematic: getBackyardGardenSchematic(),        profession: null },
    { offsetDx: -12, offsetDz: -16, schematic: getTerracedFarmlandSchematic(),      profession: null },
  ];

  const buildingBaseHeights = [];

  for (const slot of buildingSlots) {
    const swx = centerWx + slot.offsetDx;
    const swz = centerWz + slot.offsetDz;

    // Calculate balanced base height from graded landscape
    const dist = Math.hypot(slot.offsetDx, slot.offsetDz);
    const normDist = dist / (VILLAGE_RADIUS + 1);
    const weight = normDist * normDist * (3 - 2 * normDist);
    const naturalH = surfaceHeight(swx, swz);
    const sBaseY = Math.round(centerBaseY * (1 - weight) + naturalH * weight);

    buildingBaseHeights.push({ swx, swz, sBaseY, offsetDx: slot.offsetDx, offsetDz: slot.offsetDz });

    placeSchematicWithFoundation(layout, swx, sBaseY, swz, slot.schematic);
    layout.structures.push({ type: slot.schematic.name, x: swx, y: sBaseY, z: swz });

    if (slot.profession !== null) {
      layout.villagers.push({
        profession: slot.profession,
        x: swx,
        y: sBaseY + 1,
        z: swz,
        homeX: swx,
        homeY: sBaseY + 1,
        homeZ: swz,
        workX: swx + 2,
        workY: sBaseY + 1,
        workZ: swz + 3,
        wellX: centerWx,
        wellY: centerBaseY + 1,
        wellZ: centerWz
      });
    }
  }

  // ── 5. Farmer villagers for crop fields ──────────────────────────────────
  layout.villagers.push({
    profession: 'farmer',
    x: centerWx + 8,
    y: centerBaseY + 1,
    z: centerWz + 14,
    homeX: centerWx + 16,
    homeY: centerBaseY + 1,
    homeZ: centerWz + 6,
    workX: centerWx + 8,
    workY: centerBaseY + 1,
    workZ: centerWz + 14,
    wellX: centerWx,
    wellY: centerBaseY + 1,
    wellZ: centerWz
  });
  layout.villagers.push({
    profession: 'farmer',
    x: centerWx - 12,
    y: centerBaseY + 1,
    z: centerWz + 14,
    homeX: centerWx - 18,
    homeY: centerBaseY + 1,
    homeZ: centerWz + 6,
    workX: centerWx - 12,
    workY: centerBaseY + 1,
    workZ: centerWz + 14,
    wellX: centerWx,
    wellY: centerBaseY + 1,
    wellZ: centerWz
  });

  // ── 6. Smooth Road Network & Connecting Sidewalk Spurs ───────────────────
  const pathColumns = new Map(); // key: "wx,wz" -> target pathY

  // 6A: 4 Main Cardinal Boulevards (3 blocks wide)
  const pathDefs = [
    { dx: 1,  dz: 0,  length: VILLAGE_RADIUS },  // East
    { dx: -1, dz: 0,  length: VILLAGE_RADIUS },  // West
    { dx: 0,  dz: 1,  length: VILLAGE_RADIUS },  // South
    { dx: 0,  dz: -1, length: VILLAGE_RADIUS }   // North
  ];

  for (const p of pathDefs) {
    const endX = centerWx + p.dx * p.length;
    const endZ = centerWz + p.dz * p.length;
    const startH = centerBaseY;
    const endH = surfaceHeight(endX, endZ);

    for (let step = 0; step <= p.length; step++) {
      const t = step / p.length;
      const targetY = Math.round(startH + (endH - startH) * t);
      const px = centerWx + p.dx * step;
      const pz = centerWz + p.dz * step;

      // 3-block wide roadbed
      for (let pw = -1; pw <= 1; pw++) {
        const pathWx = (p.dx === 0) ? px + pw : px;
        const pathWz = (p.dz === 0) ? pz + pw : pz;
        const colKey = `${pathWx},${pathWz}`;
        if (pathColumns.has(colKey)) {
          pathColumns.set(colKey, Math.max(pathColumns.get(colKey), targetY));
        } else {
          pathColumns.set(colKey, targetY);
        }
      }
    }
  }

  // 6B: Connecting Sidewalk Spurs to Every House Door
  for (const b of buildingBaseHeights) {
    const doorWx = b.swx;
    const doorWz = b.swz - 1;
    const doorY = b.sBaseY - 1;

    if (Math.abs(b.offsetDx) >= Math.abs(b.offsetDz)) {
      const zMin = Math.min(doorWz, centerWz);
      const zMax = Math.max(doorWz, centerWz);
      const mainRoadY = pathColumns.get(`${doorWx},${centerWz}`) || centerBaseY;

      for (let z = zMin; z <= zMax; z++) {
        const t = (z - zMin) / Math.max(1, zMax - zMin);
        const spurY = Math.round(mainRoadY + (doorY - mainRoadY) * t);
        for (let pw = 0; pw <= 1; pw++) {
          pathColumns.set(`${doorWx + pw},${z}`, spurY);
        }
      }
    } else {
      const xMin = Math.min(doorWx, centerWx);
      const xMax = Math.max(doorWx, centerWx);
      const mainRoadY = pathColumns.get(`${centerWx},${doorWz}`) || centerBaseY;

      for (let x = xMin; x <= xMax; x++) {
        const t = (x - xMin) / Math.max(1, xMax - xMin);
        const spurY = Math.round(mainRoadY + (doorY - mainRoadY) * t);
        for (let pw = 0; pw <= 1; pw++) {
          pathColumns.set(`${x},${doorWz + pw}`, spurY);
        }
      }
    }
  }

  // 6C: Stamp All Pathways (Gravel + 4 Air Clearance + Deep Solid Foundation)
  for (const [colKey, pathY] of pathColumns) {
    const [xStr, zStr] = colKey.split(',');
    const pathWx = parseInt(xStr, 10);
    const pathWz = parseInt(zStr, 10);
    const terrainH = surfaceHeight(pathWx, pathWz);

    // Surface = Gravel (ID 27)
    layout.voxels.set(`${pathWx},${pathY},${pathWz}`, 27);

    // 4-block vertical air corridor above
    for (let ay = 1; ay <= 4; ay++) {
      layout.voxels.set(`${pathWx},${pathY + ay},${pathWz}`, 0);
    }

    // Solid cobblestone foundation below
    const bottomFy = Math.max(1, Math.min(terrainH - 2, pathY - 10));
    for (let fy = pathY - 1; fy >= bottomFy; fy--) {
      layout.voxels.set(`${pathWx},${fy},${pathWz}`, 15);
    }
  }

  // ── 7. Street Lamp Posts along Roads & Plaza ─────────────────────────────
  const lampLocations = [
    { dx: 7,   dz: 2 },
    { dx: -7,  dz: 2 },
    { dx: 2,   dz: 7 },
    { dx: -2,  dz: -7 },
    { dx: 14,  dz: 2 },
    { dx: -14, dz: 2 },
    { dx: 2,   dz: 14 },
    { dx: -2,  dz: -14 },
    { dx: 22,  dz: 2 },
    { dx: -22, dz: 2 },
    { dx: 2,   dz: 22 },
    { dx: -2,  dz: -22 },
  ];

  for (const lamp of lampLocations) {
    const lwx = centerWx + lamp.dx;
    const lwz = centerWz + lamp.dz;
    const roadY = pathColumns.get(`${lwx},${lwz}`) || centerBaseY;
    buildLampPost(layout, lwx, roadY, lwz);
  }

  villageLayoutCache.set(key, layout);
  return layout;
}

/**
 * Builds an authentic medieval village street lamp post
 */
function buildLampPost(layout, wx, baseY, wz) {
  // 2-block tall Oak Log post (y = 1..2)
  layout.voxels.set(`${wx},${baseY + 1},${wz}`, 5);
  layout.voxels.set(`${wx},${baseY + 2},${wz}`, 5);
  // Lantern cross-cap
  layout.voxels.set(`${wx},${baseY + 3},${wz}`, 7); // Oak plank
  layout.voxels.set(`${wx},${baseY + 4},${wz}`, 20); // Torch atop lamp post
}

/**
 * Builds an authentic medieval market stall with a striped wool canopy
 */
function buildMarketStall(layout, wx, baseY, wz, canopyColors = [51, 50]) {
  // 4 corner Oak Log posts (y = 1..3)
  for (let dx = -1; dx <= 1; dx += 2) {
    for (let dz = -1; dz <= 1; dz += 2) {
      layout.voxels.set(`${wx + dx},${baseY + 1},${wz + dz}`, 5);
      layout.voxels.set(`${wx + dx},${baseY + 2},${wz + dz}`, 5);
      layout.voxels.set(`${wx + dx},${baseY + 3},${wz + dz}`, 5);
    }
  }

  // Wooden counter (y = 1)
  for (let dx = -1; dx <= 1; dx++) {
    layout.voxels.set(`${wx + dx},${baseY + 1},${wz}`, 7); // Plank counter
  }

  // Striped Wool Canopy Roof (3x3 at y = 4)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const colId = canopyColors[(dx + 1) % canopyColors.length];
      layout.voxels.set(`${wx + dx},${baseY + 4},${wz + dz}`, colId);
    }
  }

  // Hanging torch under canopy
  layout.voxels.set(`${wx},${baseY + 3},${wz}`, 20);
}

/**
 * Builds a ground-anchored 2-block-high cobblestone perimeter wall
 * with 4 fortified gatehouses at the cardinal entrances.
 */
function buildPerimeterWall(layout, cx, baseY, cz) {
  const R = VILLAGE_RADIUS;

  // 1. North and South edges
  for (let dx = -R; dx <= R; dx++) {
    for (const side of [-1, 1]) {
      const wx = cx + dx;
      const wz = cz + side * R;
      const isGate = (Math.abs(dx) <= 1);
      const isCorner = (Math.abs(dx) === R);
      if (isCorner) continue;

      const groundY = surfaceHeight(wx, wz);

      if (isGate) {
        // Gate passage: gravel roadbed, open passage, arch header
        for (let fy = groundY; fy >= Math.max(1, groundY - 6); fy--) {
          layout.voxels.set(`${wx},${fy},${wz}`, 15);
        }
        layout.voxels.set(`${wx},${groundY},${wz}`, 27);     // Gravel
        layout.voxels.set(`${wx},${groundY + 1},${wz}`, 0); // Air passage
        layout.voxels.set(`${wx},${groundY + 2},${wz}`, 0); // Air passage
        layout.voxels.set(`${wx},${groundY + 3},${wz}`, 5); // Oak Log Arch header
        if (dx === 0) {
          layout.voxels.set(`${wx},${groundY + 4},${wz}`, 20); // Torch atop arch
        }
      } else {
        // Wall column anchored directly to terrain with deep foundation
        for (let fy = groundY; fy >= Math.max(1, groundY - 6); fy--) {
          layout.voxels.set(`${wx},${fy},${wz}`, 15);
        }
        layout.voxels.set(`${wx},${groundY + 1},${wz}`, 15); // Cobble wall lower
        layout.voxels.set(`${wx},${groundY + 2},${wz}`, 15); // Cobble wall upper
        layout.voxels.set(`${wx},${groundY + 3},${wz}`, 7);  // Oak Plank top trim
        layout.voxels.set(`${wx},${groundY + 4},${wz}`, 0);  // Air
      }
    }
  }

  // 2. East and West edges
  for (let dz = -R + 1; dz <= R - 1; dz++) {
    for (const side of [-1, 1]) {
      const wx = cx + side * R;
      const wz = cz + dz;
      const isGate = (Math.abs(dz) <= 1);
      const groundY = surfaceHeight(wx, wz);

      if (isGate) {
        for (let fy = groundY; fy >= Math.max(1, groundY - 6); fy--) {
          layout.voxels.set(`${wx},${fy},${wz}`, 15);
        }
        layout.voxels.set(`${wx},${groundY},${wz}`, 27);
        layout.voxels.set(`${wx},${groundY + 1},${wz}`, 0);
        layout.voxels.set(`${wx},${groundY + 2},${wz}`, 0);
        layout.voxels.set(`${wx},${groundY + 3},${wz}`, 5);
        if (dz === 0) {
          layout.voxels.set(`${wx},${groundY + 4},${wz}`, 20);
        }
      } else {
        for (let fy = groundY; fy >= Math.max(1, groundY - 6); fy--) {
          layout.voxels.set(`${wx},${fy},${wz}`, 15);
        }
        layout.voxels.set(`${wx},${groundY + 1},${wz}`, 15);
        layout.voxels.set(`${wx},${groundY + 2},${wz}`, 15);
        layout.voxels.set(`${wx},${groundY + 3},${wz}`, 7);
        layout.voxels.set(`${wx},${groundY + 4},${wz}`, 0);
      }
    }
  }

  // 3. Corner Watch Pillars (taller with torches)
  for (const [ddx, ddz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    const cwx = cx + ddx;
    const cwz = cz + ddz;
    const groundY = surfaceHeight(cwx, cwz);
    for (let fy = groundY; fy >= Math.max(1, groundY - 8); fy--) {
      layout.voxels.set(`${cwx},${fy},${cwz}`, 15);
    }
    layout.voxels.set(`${cwx},${groundY + 1},${cwz}`, 15);
    layout.voxels.set(`${cwx},${groundY + 2},${cwz}`, 15);
    layout.voxels.set(`${cwx},${groundY + 3},${cwz}`, 15);
    layout.voxels.set(`${cwx},${groundY + 4},${cwz}`, 15);
    layout.voxels.set(`${cwx},${groundY + 5},${cwz}`, 20); // Torch
  }
}

/**
 * Places a schematic with full interior air purge and deep foundation pads.
 */
function placeSchematicWithFoundation(layout, originWx, originBaseY, originWz, schematic) {
  if (!schematic || !Array.isArray(schematic.blocks)) return;

  // ── Step 1: Calculate bounding box ───────────────────────────────────────
  let minDx = Infinity, maxDx = -Infinity;
  let minDy = Infinity, maxDy = -Infinity;
  let minDz = Infinity, maxDz = -Infinity;
  for (const b of schematic.blocks) {
    if (b.dx < minDx) minDx = b.dx;
    if (b.dx > maxDx) maxDx = b.dx;
    if (b.dy < minDy) minDy = b.dy;
    if (b.dy > maxDy) maxDy = b.dy;
    if (b.dz < minDz) minDz = b.dz;
    if (b.dz > maxDz) maxDz = b.dz;
  }

  // ── Step 2: Interior Air Purge (from walking surface dy=0 to roof top dy=maxDy+4) ──
  for (let dx = minDx - 1; dx <= maxDx + 1; dx++) {
    for (let dz = minDz - 1; dz <= maxDz + 1; dz++) {
      for (let dy = 0; dy <= maxDy + 4; dy++) {
        const wx = originWx + dx;
        const wz = originWz + dz;
        const wy = Math.max(1, Math.min(HEIGHT - 1, originBaseY + dy));
        layout.voxels.set(`${wx},${wy},${wz}`, 0); // Air
      }
    }
  }

  // ── Step 3: Deep Solid Cobblestone Foundation Pad ────────────────────────
  for (let dx = minDx; dx <= maxDx; dx++) {
    for (let dz = minDz; dz <= maxDz; dz++) {
      const wx = originWx + dx;
      const wz = originWz + dz;
      const terrainY = surfaceHeight(wx, wz);
      const bottomFy = Math.max(1, Math.min(terrainY - 2, originBaseY - 12));
      for (let fy = originBaseY - 1; fy >= bottomFy; fy--) {
        layout.voxels.set(`${wx},${fy},${wz}`, 15); // Cobble foundation
      }
    }
  }

  // ── Step 4: Place all schematic blocks ───────────────────────────────────
  for (const b of schematic.blocks) {
    const wx = originWx + b.dx;
    const wy = Math.max(1, Math.min(HEIGHT - 1, originBaseY + b.dy));
    const wz = originWz + b.dz;
    layout.voxels.set(`${wx},${wy},${wz}`, b.id);
  }
}

/**
 * Called by chunk generator to stamp village voxels into chunk instance.
 */
export function applyVillageToChunk(ch, ox, oz) {
  const minCx = ch.cx - 3;
  const maxCx = ch.cx + 3;
  const minCz = ch.cz - 3;
  const maxCz = ch.cz + 3;

  for (let vcx = minCx; vcx <= maxCx; vcx++) {
    for (let vcz = minCz; vcz <= maxCz; vcz++) {
      if (isVillageCenterChunk(vcx, vcz)) {
        const layout = getVillageLayout(vcx, vcz);
        if (!layout || layout.voxels.size === 0) continue;

        // Stamp layout voxels that fall within this chunk's world-block bounds
        for (const [k, blockId] of layout.voxels) {
          const parts = k.split(',');
          const wx = parseInt(parts[0], 10);
          const wy = parseInt(parts[1], 10);
          const wz = parseInt(parts[2], 10);
          if (wx >= ox && wx < ox + CHUNK && wz >= oz && wz < oz + CHUNK) {
            const lx = wx - ox;
            const lz = wz - oz;
            if (wy >= 0 && wy < HEIGHT) {
              ch.set(lx, wy, lz, blockId);
            }
          }
        }

        // Spawn Village Villager NPCs once on initial chunk generation
        if (vcx === ch.cx && vcz === ch.cz && layout.villagers && !layout.villagersSpawned) {
          layout.villagersSpawned = true;
          for (const v of layout.villagers) {
            if (typeof window !== 'undefined' && window.__spawnVillageVillager) {
              window.__spawnVillageVillager(
                v.profession, v.x, v.y, v.z,
                v.homeX, v.homeY, v.homeZ,
                v.workX, v.workY, v.workZ,
                v.wellX, v.wellY, v.wellZ
              );
            } else {
              try { spawnMob('villager', v.x, v.y, v.z, false, null, v.profession); } catch(e) {}
            }
          }
        }
      }
    }
  }
}

/**
 * Ensures any candidate village within 2 chunks of (cx, cz) is computed and cached
 * so that cave carvers and tree generators in world.js are aware of it.
 */
export function ensureNearbyVillages(cx, cz) {
  for (let dcx = -2; dcx <= 2; dcx++) {
    for (let dcz = -2; dcz <= 2; dcz++) {
      const vcx = cx + dcx;
      const vcz = cz + dcz;
      if (isVillageCenterChunk(vcx, vcz)) {
        getVillageLayout(vcx, vcz);
      }
    }
  }
}

/**
 * Returns true if the given world-coordinate falls within any known village
 * perimeter — used by world.js to suppress trees and cave carvers.
 */
export function isVillageProtectedZone(wx, wz) {
  for (const [, layout] of villageLayoutCache) {
    if (!layout || layout.voxels.size === 0) continue;
    const dx = wx - layout.centerWx;
    const dz = wz - layout.centerWz;
    if (Math.abs(dx) <= VILLAGE_RADIUS + 2 && Math.abs(dz) <= VILLAGE_RADIUS + 2) return true;
  }
  return false;
}
