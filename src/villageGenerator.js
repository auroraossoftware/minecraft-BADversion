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

// Set of village center chunk keys that have already placed their perimeter
const perimeterBuilt = new Set();

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

  // ── 1. Central Village Well ────────────────────────────────────────────────
  const wellSchematic = getVillageWellSchematic();
  placeSchematicWithFoundation(layout, centerWx, centerBaseY, centerWz, wellSchematic);
  layout.structures.push({ type: 'Village Well', x: centerWx, y: centerBaseY, z: centerWz });

  // ── 3. Perimeter Boundary Wall & 4 Fortified Gatehouses (before buildings, wall is background) ──
  buildPerimeterWall(layout, centerWx, centerBaseY, centerWz);

  // ── 4. Buildings & Farmland along Paths ───────────────────────────────────
  const buildingSlots = [
    // East arm
    { offsetDx: 16,  offsetDz: 5,   schematic: getSmallOakCottageSchematic(),       profession: 'unemployed' },
    { offsetDx: 16,  offsetDz: -10, schematic: getBlacksmithWorkshopSchematic(),    profession: 'blacksmith' },
    // West arm
    { offsetDx: -18, offsetDz: 5,   schematic: getLargeTwoStoryHouseSchematic(),    profession: 'librarian' },
    { offsetDx: -18, offsetDz: -10, schematic: getLibrarianHouseSchematic(),        profession: 'librarian' },
    // South arm
    { offsetDx: 5,   offsetDz: 16,  schematic: getClericShrineSchematic(),          profession: 'cleric' },
    { offsetDx: -8,  offsetDz: 16,  schematic: getSmallOakCottageSchematic(),       profession: 'unemployed' },
    // North arm
    { offsetDx: 5,   offsetDz: -18, schematic: getSmallOakCottageSchematic(),       profession: 'unemployed' },
    { offsetDx: -8,  offsetDz: -18, schematic: getLargeTwoStoryHouseSchematic(),    profession: 'unemployed' },
    // Farmland plots (no villager spawned at these)
    { offsetDx: 8,   offsetDz: 14,  schematic: getStandardCropStripSchematic(),     profession: null },
    { offsetDx: -12, offsetDz: 14,  schematic: getDoubleTrenchFieldSchematic(),     profession: null },
    { offsetDx: 8,   offsetDz: -16, schematic: getBackyardGardenSchematic(),        profession: null },
    { offsetDx: -12, offsetDz: -16, schematic: getTerracedFarmlandSchematic(),      profession: null },
  ];

  for (const slot of buildingSlots) {
    const swx = centerWx + slot.offsetDx;
    const swz = centerWz + slot.offsetDz;
    const sBaseY = surfaceHeight(swx, swz);

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

  // ── 5. Farmer at crop fields ───────────────────────────────────────────────
  layout.villagers.push({
    profession: 'farmer',
    x: centerWx + 8,
    y: centerBaseY + 1,
    z: centerWz + 14,
    homeX: centerWx + 16,
    homeY: centerBaseY + 1,
    homeZ: centerWz + 5,
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
    homeZ: centerWz + 5,
    workX: centerWx - 12,
    workY: centerBaseY + 1,
    workZ: centerWz + 14,
    wellX: centerWx,
    wellY: centerBaseY + 1,
    wellZ: centerWz
  });

  // ── 5. Cardinal Gravel Pathways — stamped LAST so they always override buildings & perimeter ──
  const pathDefs = [
    { dx: 1,  dz: 0,  length: VILLAGE_RADIUS },
    { dx: -1, dz: 0,  length: VILLAGE_RADIUS },
    { dx: 0,  dz: 1,  length: VILLAGE_RADIUS },
    { dx: 0,  dz: -1, length: VILLAGE_RADIUS }
  ];

  // Pass 1: Compute smooth heights for all 2D path columns (pathWx, pathWz)
  const pathColumns = new Map(); // key: "pathWx,pathWz" -> target pathY
  for (const p of pathDefs) {
    const startH = centerBaseY;
    const endH = surfaceHeight(centerWx + p.dx * p.length, centerWz + p.dz * p.length);
    for (let step = 1; step <= p.length; step++) {
      const t = step / p.length;
      const interpY = Math.round(startH + (endH - startH) * t);
      const terrainY = surfaceHeight(centerWx + p.dx * step, centerWz + p.dz * step);
      const pathY = Math.max(interpY, terrainY);
      const px = centerWx + p.dx * step;
      const pz = centerWz + p.dz * step;
      for (let pw = -1; pw <= 1; pw++) {
        const pathWx = (p.dx === 0) ? px + pw : px;
        const pathWz = (p.dz === 0) ? pz + pw : pz;
        const colKey = `${pathWx},${pathWz}`;
        if (pathColumns.has(colKey)) {
          // If already mapped (e.g. intersection near center), choose consistent max height
          pathColumns.set(colKey, Math.max(pathColumns.get(colKey), pathY));
        } else {
          pathColumns.set(colKey, pathY);
        }
      }
    }
  }

  // Pass 2: Stamp gravel, clear air above, and place foundation below
  for (const [colKey, pathY] of pathColumns) {
    const [xStr, zStr] = colKey.split(',');
    const pathWx = parseInt(xStr, 10);
    const pathWz = parseInt(zStr, 10);

    // Set single gravel block at path surface
    layout.voxels.set(`${pathWx},${pathY},${pathWz}`, 27);

    // Air corridor above — explicitly set Y+1..Y+4 to 0 (Air)
    for (let ay = 1; ay <= 4; ay++) {
      layout.voxels.set(`${pathWx},${pathY + ay},${pathWz}`, 0);
    }

    // Solid cobble foundation below down to 4 blocks
    for (let fy = pathY - 1; fy >= pathY - 4; fy--) {
      const fk = `${pathWx},${fy},${pathWz}`;
      if (!layout.voxels.has(fk) || layout.voxels.get(fk) === 0 || layout.voxels.get(fk) === 27) {
        layout.voxels.set(fk, 15);
      }
    }
  }

  villageLayoutCache.set(key, layout);
  return layout;
}

/**
 * Builds a 2-block-high perimeter wall around the village
 * with 4 fortified gatehouses at the cardinal compass gates
 */
function buildPerimeterWall(layout, cx, baseY, cz) {
  const R = VILLAGE_RADIUS;

  // Walk the perimeter rectangle, build wall & leave gateway openings
  for (let dx = -R; dx <= R; dx++) {
    for (let side = -1; side <= 1; side += 2) {
      const wx = cx + dx;
      const wz = cz + side * R;
      const wy = Math.max(baseY, surfaceHeight(wx, wz));

      // Gate opening: leave 3-block gap on N/S cardinal paths (dx -1..1)
      const isGate = (Math.abs(dx) <= 1);
      if (isGate) {
        buildGatehouse(layout, wx, wy, wz, 'ns');
      } else {
        placeWallColumn(layout, wx, wy, wz);
      }
    }
  }
  for (let dz = -R + 1; dz <= R - 1; dz++) {
    for (let side = -1; side <= 1; side += 2) {
      const wx = cx + side * R;
      const wz = cz + dz;
      const wy = Math.max(baseY, surfaceHeight(wx, wz));

      const isGate = (Math.abs(dz) <= 1);
      if (isGate) {
        buildGatehouse(layout, wx, wy, wz, 'ew');
      } else {
        placeWallColumn(layout, wx, wy, wz);
      }
    }
  }

  // Corner pillars (slightly taller)
  for (const [ddx, ddz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    const cwx = cx + ddx;
    const cwz = cz + ddz;
    const cwy = Math.max(baseY, surfaceHeight(cwx, cwz));
    for (let y = cwy; y <= cwy + 3; y++) {
      layout.voxels.set(`${cwx},${y},${cwz}`, 15); // Cobble corner pillars
    }
    layout.voxels.set(`${cwx},${cwy + 4},${cwz}`, 20); // Torch on top
  }
}

/**
 * Places a single 2-high cobblestone wall segment topped with an oak fence
 */
function placeWallColumn(layout, wx, baseWy, wz) {
  // Layer 0 = solid cobble base
  layout.voxels.set(`${wx},${baseWy},${wz}`, 15);
  // Layer 1 = cobble upper
  layout.voxels.set(`${wx},${baseWy + 1},${wz}`, 15);
  // Layer 2 = oak fence crenellation
  layout.voxels.set(`${wx},${baseWy + 2},${wz}`, 0); // will be set by FENCE_ID below
  // Use a simple plank since fence IDs are dynamic; represent as oak plank trim
  layout.voxels.set(`${wx},${baseWy + 2},${wz}`, 7); // Oak Plank top
}

/**
 * Places a gatehouse archway at gateway positions
 * Leaves a 3-block opening at ground level for the road
 */
function buildGatehouse(layout, wx, baseWy, wz, axis) {
  // Vertical archway pillars on the sides of the gate opening
  // Air for gate passage
  layout.voxels.set(`${wx},${baseWy},${wz}`, 0);   // ground = passable
  layout.voxels.set(`${wx},${baseWy + 1},${wz}`, 0); // head height = passable
  // Archway cap
  layout.voxels.set(`${wx},${baseWy + 2},${wz}`, 5);  // Oak Log header
  // Torch on archway cap
  if (axis === 'ns' && wx % 3 === 0) {
    layout.voxels.set(`${wx},${baseWy + 3},${wz}`, 20); // Torch
  }
}

/**
 * Places a schematic and builds solid cobblestone/dirt foundations down to ground level.
 * Critically: clears the full 3D interior bounding box to AIR first.
 */
function placeSchematicWithFoundation(layout, originWx, originBaseY, originWz, schematic) {
  if (!schematic || !Array.isArray(schematic.blocks)) return;

  // ── Step 1: Determine schematic bounding box ────────────────────────────
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

  // ── Step 2: Full interior bounding-box AIR purge ─────────────────────────
  // Clears all existing terrain (hills, trees, caves) from inside the building volume
  // Extra +2 clearance above to remove tree leaves/canopy
  for (let dx = minDx - 1; dx <= maxDx + 1; dx++) {
    for (let dz = minDz - 1; dz <= maxDz + 1; dz++) {
      for (let dy = -2; dy <= maxDy + 3; dy++) {
        const wx = originWx + dx;
        const wz = originWz + dz;
        const wy = Math.max(1, Math.min(HEIGHT - 1, originBaseY + dy));
        layout.voxels.set(`${wx},${wy},${wz}`, 0); // Air
      }
    }
  }

  // ── Step 3: Solid cobblestone foundation pad ─────────────────────────────
  // Level the entire footprint footprint down to ground level with cobble
  for (let dx = minDx; dx <= maxDx; dx++) {
    for (let dz = minDz; dz <= maxDz; dz++) {
      const wx = originWx + dx;
      const wz = originWz + dz;
      const terrainY = Math.max(1, surfaceHeight(wx, wz));
      const buildY = originBaseY; // target floor level
      // Fill gap between terrain and floor level
      for (let fy = Math.min(terrainY, buildY) - 1; fy <= Math.max(terrainY, buildY) - 1; fy++) {
        const clampedFy = Math.max(1, Math.min(HEIGHT - 1, fy));
        const fk = `${wx},${clampedFy},${wz}`;
        layout.voxels.set(fk, 15); // Cobble foundation
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
 * Also suppresses tree and cave generation inside village zones.
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
 * Returns true if the given world-coordinate falls within any known village
 * perimeter — used by world.js to suppress trees and cave carvers.
 */
export function isVillageProtectedZone(wx, wz) {
  for (const [, layout] of villageLayoutCache) {
    if (layout.voxels.size === 0) continue;
    const dx = wx - layout.centerWx;
    const dz = wz - layout.centerWz;
    if (Math.abs(dx) <= VILLAGE_RADIUS + 2 && Math.abs(dz) <= VILLAGE_RADIUS + 2) return true;
  }
  return false;
}
