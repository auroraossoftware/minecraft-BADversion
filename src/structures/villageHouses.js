// ---- Village House Schematics & Market Pedestal Presets ---------------------

/**
 * Each schematic is defined as an array of voxel blocks relative to the origin (0,0,0).
 * Block offset: { dx, dy, dz, id }
 * Convention: dy=0 is the floor level. The door opening is at dz=0, dx=0.
 *
 * Block IDs used:
 *  0  = Air (clear / doorway / window opening)
 *  7  = Oak Plank
 *  5  = Oak Log (pillars, chimney)
 *  9  = Glass (windows)
 *  15 = Cobblestone (foundation, walls)
 *  16 = Stone Brick (floor)
 *  20 = Torch
 *  41 = Crafting Table
 *  42 = Furnace
 *  43 = Chest
 *  44 = Bookshelf
 *  45 = Ladder
 *  46 = Iron Block (anvil stand-in)
 *  57 = Bed
 *  95 = Market Showcase Pedestal
 */

// ──────────────────────────────────────────────────────────────────────────────
// 1. Small Oak Cottage — 5x5 footprint, 1 storey
// ──────────────────────────────────────────────────────────────────────────────
export function getSmallOakCottageSchematic() {
  const blocks = [];

  // Stone Brick floor (dy=-1 below ground = foundation anchor; dy=0 = walking surface)
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z <= 4; z++) {
      blocks.push({ dx: x, dy: -1, dz: z, id: 16 }); // Stone Brick floor
    }
  }

  // Oak Log corner pillars (y 0..3)
  for (let y = 0; y <= 3; y++) {
    blocks.push({ dx: -2, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -2, dy: y, dz: 4, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 4, id: 5 });
  }

  // Plank walls (y 0..2), leaving windows and door gaps
  for (let y = 0; y <= 2; y++) {
    // Back wall (z=4) — full width
    for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 4, id: 7 });
    // Left wall (x=-2)
    for (let z = 1; z <= 3; z++) blocks.push({ dx: -2, dy: y, dz: z, id: 7 });
    // Right wall (x=2)
    for (let z = 1; z <= 3; z++) blocks.push({ dx: 2,  dy: y, dz: z, id: 7 });
    // Front wall (z=0) — leave door opening at dx=0
    if (y === 0 || y === 1) {
      blocks.push({ dx: -1, dy: y, dz: 0, id: 7 });
      blocks.push({ dx: 1,  dy: y, dz: 0, id: 7 });
      // Door gap: dx=0 dy=0 and dy=1 left as air (no block pushed)
    } else {
      // y=2: top of front wall, full width
      for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 0, id: 7 });
    }
  }

  // Glass windows
  blocks.push({ dx: 0,  dy: 1, dz: 4, id: 9 }); // Back window (centred)
  blocks.push({ dx: -2, dy: 1, dz: 2, id: 9 }); // Left window
  blocks.push({ dx: 2,  dy: 1, dz: 2, id: 9 }); // Right window

  // Door gap (explicit air for clarity)
  blocks.push({ dx: 0, dy: 0, dz: 0, id: 0 });
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 0 });

  // Porch step outside the door (dz=-1, dy=-1 relative to floor so it's one block lower)
  blocks.push({ dx: 0,  dy: -1, dz: -1, id: 16 }); // Stone Brick step
  blocks.push({ dx: -1, dy: -1, dz: -1, id: 16 });
  blocks.push({ dx: 1,  dy: -1, dz: -1, id: 16 });

  // Interior furniture
  blocks.push({ dx: -1, dy: 0, dz: 3, id: 57 }); // Bed
  blocks.push({ dx: 1,  dy: 0, dz: 3, id: 43 }); // Chest
  blocks.push({ dx: 1,  dy: 0, dz: 1, id: 41 }); // Crafting Table
  blocks.push({ dx: -1, dy: 0, dz: 1, id: 42 }); // Furnace

  // Interior torches on walls
  blocks.push({ dx: -1, dy: 2, dz: 4, id: 20 }); // Back wall torch
  blocks.push({ dx: 1,  dy: 2, dz: 4, id: 20 });

  // Plank ceiling (y=3)
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z <= 4; z++) {
      blocks.push({ dx: x, dy: 3, dz: z, id: 7 });
    }
  }

  // Roof ridge (y=4, narrower)
  for (let x = -1; x <= 1; x++) {
    for (let z = 0; z <= 4; z++) {
      blocks.push({ dx: x, dy: 4, dz: z, id: 7 });
    }
  }

  // Chimney above furnace (dx=-1, dz=1)
  blocks.push({ dx: -1, dy: 4, dz: 1, id: 5 }); // Oak Log chimney
  blocks.push({ dx: -1, dy: 5, dz: 1, id: 5 });

  return { name: 'Small Oak Cottage', width: 5, depth: 5, height: 6, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Blacksmith / Workshop — 6x7 footprint with forge & display pedestal
// ──────────────────────────────────────────────────────────────────────────────
export function getBlacksmithWorkshopSchematic() {
  const blocks = [];

  // Cobblestone floor
  for (let x = -3; x <= 2; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: -1, dz: z, id: 15 });
    }
  }

  // Cobble walls (y 0..2)
  for (let y = 0; y <= 2; y++) {
    for (let x = -3; x <= 2; x++) blocks.push({ dx: x, dy: y, dz: 6, id: 15 }); // back
    for (let z = 1; z <= 5; z++) {
      blocks.push({ dx: -3, dy: y, dz: z, id: 15 }); // left
      blocks.push({ dx: 2,  dy: y, dz: z, id: 15 }); // right
    }
    // Front wall (z=0), leaving wide 2-block entrance gap
    blocks.push({ dx: -3, dy: y, dz: 0, id: 15 });
    blocks.push({ dx: 2,  dy: y, dz: 0, id: 15 });
    if (y === 2) {
      // header over entrance
      for (let x = -2; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 0, id: 15 });
    }
  }

  // Open front entrance (2 block wide, 2 block tall)
  for (let x = -2; x <= 1; x++) {
    blocks.push({ dx: x, dy: 0, dz: 0, id: 0 });
    blocks.push({ dx: x, dy: 1, dz: 0, id: 0 });
  }

  // Porch steps
  blocks.push({ dx: -1, dy: -1, dz: -1, id: 15 });
  blocks.push({ dx: 0,  dy: -1, dz: -1, id: 15 });

  // Blacksmith equipment
  blocks.push({ dx: -2, dy: 0, dz: 5, id: 42 }); // Furnace
  blocks.push({ dx: -2, dy: 1, dz: 5, id: 5  }); // Oak log chimney base
  blocks.push({ dx: -2, dy: 2, dz: 5, id: 0  }); // Air – chimney opens to roof
  blocks.push({ dx: -1, dy: 0, dz: 5, id: 46 }); // Iron Block (anvil)
  blocks.push({ dx: 1,  dy: 0, dz: 5, id: 43 }); // Loot Chest
  blocks.push({ dx: 1,  dy: 0, dz: 2, id: 41 }); // Crafting Table

  // Market Showcase Pedestal
  blocks.push({ dx: 0, dy: 0, dz: 2, id: 95 });

  // Interior torches
  blocks.push({ dx: -2, dy: 2, dz: 1, id: 20 });
  blocks.push({ dx: 1,  dy: 2, dz: 1, id: 20 });

  // Cobble flat roof (y=3)
  for (let x = -3; x <= 2; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: 3, dz: z, id: 15 });
    }
  }

  // Chimney extension
  blocks.push({ dx: -2, dy: 4, dz: 5, id: 5 }); // Oak log chimney top

  return { name: 'Blacksmith Workshop', width: 6, depth: 7, height: 4, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Large Two-Story House — 7x7 footprint, 2 storeys, internal ladder
// ──────────────────────────────────────────────────────────────────────────────
export function getLargeTwoStoryHouseSchematic() {
  const blocks = [];

  // Ground stone-brick floor
  for (let x = -3; x <= 3; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: -1, dz: z, id: 16 }); // Stone Brick floor
    }
  }

  // Ground floor cobble walls (y 0..2)
  for (let y = 0; y <= 2; y++) {
    for (let x = -3; x <= 3; x++) {
      blocks.push({ dx: x, dy: y, dz: 6, id: 15 }); // back
      if (y !== 0 || (x !== 0)) { // front row, keep door gap
        blocks.push({ dx: x, dy: y, dz: 0, id: 15 }); // front
      }
    }
    for (let z = 1; z <= 5; z++) {
      blocks.push({ dx: -3, dy: y, dz: z, id: 15 }); // left
      blocks.push({ dx: 3,  dy: y, dz: z, id: 15 }); // right
    }
  }

  // Door opening (2-high, 1-wide)
  blocks.push({ dx: 0, dy: 0, dz: 0, id: 0 });
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 0 });

  // Porch steps (outside, dz = -1)
  for (let x = -1; x <= 1; x++) {
    blocks.push({ dx: x, dy: -1, dz: -1, id: 16 }); // Stone Brick step
  }

  // Ground floor glass windows
  blocks.push({ dx: -3, dy: 1, dz: 3, id: 9 }); // Left window
  blocks.push({ dx: 3,  dy: 1, dz: 3, id: 9 }); // Right window
  blocks.push({ dx: 0,  dy: 1, dz: 6, id: 9 }); // Back window

  // Ground floor furniture
  blocks.push({ dx: -2, dy: 0, dz: 5, id: 57 }); // Bed
  blocks.push({ dx: 2,  dy: 0, dz: 5, id: 43 }); // Chest
  blocks.push({ dx: -2, dy: 0, dz: 1, id: 41 }); // Crafting Table
  blocks.push({ dx: 2,  dy: 0, dz: 1, id: 42 }); // Furnace

  // Ground floor torches
  blocks.push({ dx: -2, dy: 2, dz: 6, id: 20 });
  blocks.push({ dx: 2,  dy: 2, dz: 6, id: 20 });
  blocks.push({ dx: 0,  dy: 2, dz: 1, id: 20 });

  // Second floor platform (y=3) — plank floor
  for (let x = -3; x <= 3; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: 3, dz: z, id: 7 }); // Oak Plank upper floor
    }
  }

  // Ladder up (inside, right side at dx=2)
  blocks.push({ dx: 2, dy: 0, dz: 3, id: 45 });
  blocks.push({ dx: 2, dy: 1, dz: 3, id: 45 });
  blocks.push({ dx: 2, dy: 2, dz: 3, id: 45 });
  // Hole in upper floor above ladder
  blocks.push({ dx: 2, dy: 3, dz: 3, id: 0 });

  // Second floor plank walls (y 4..6)
  for (let y = 4; y <= 6; y++) {
    for (let x = -3; x <= 3; x++) {
      blocks.push({ dx: x, dy: y, dz: 6, id: 7 });
      blocks.push({ dx: x, dy: y, dz: 0, id: 7 });
    }
    for (let z = 1; z <= 5; z++) {
      blocks.push({ dx: -3, dy: y, dz: z, id: 7 });
      blocks.push({ dx: 3,  dy: y, dz: z, id: 7 });
    }
  }

  // Second floor windows
  blocks.push({ dx: 0,  dy: 5, dz: 0, id: 9 }); // Front window
  blocks.push({ dx: -3, dy: 5, dz: 3, id: 9 }); // Left
  blocks.push({ dx: 3,  dy: 5, dz: 3, id: 9 }); // Right
  blocks.push({ dx: 0,  dy: 5, dz: 6, id: 9 }); // Back

  // Second floor furniture
  blocks.push({ dx: 2,  dy: 4, dz: 5, id: 44 }); // Bookshelf
  blocks.push({ dx: -2, dy: 4, dz: 5, id: 57 }); // Bed (upper)
  blocks.push({ dx: 0,  dy: 4, dz: 5, id: 43 }); // Chest
  blocks.push({ dx: -2, dy: 4, dz: 1, id: 44 }); // Bookshelf

  // Second floor torches
  blocks.push({ dx: -2, dy: 6, dz: 6, id: 20 });
  blocks.push({ dx: 2,  dy: 6, dz: 6, id: 20 });

  // Roof (y=7) — plank
  for (let x = -3; x <= 3; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: 7, dz: z, id: 7 });
    }
  }

  // Chimney (over furnace at dx=2, dz=1)
  blocks.push({ dx: 2, dy: 7, dz: 1, id: 5 });
  blocks.push({ dx: 2, dy: 8, dz: 1, id: 5 });

  return { name: 'Large Two-Story House', width: 7, depth: 7, height: 9, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Central Village Well — 3x3 focal point
// ──────────────────────────────────────────────────────────────────────────────
export function getVillageWellSchematic() {
  const blocks = [];

  // Cobblestone basin (3x3), hollow centre = water
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      if (x === 0 && z === 0) {
        blocks.push({ dx: 0, dy: -1, dz: 0, id: 8 }); // Water
        blocks.push({ dx: 0, dy: -2, dz: 0, id: 8 }); // Water deeper
      } else {
        blocks.push({ dx: x, dy: 0, dz: z, id: 15 }); // Cobble rim
      }
    }
  }

  // Corner fence posts (ID 7 = plank — fence IDs are dynamic, using oak log)
  blocks.push({ dx: -1, dy: 1, dz: -1, id: 5 }); // Oak Log post
  blocks.push({ dx: 1,  dy: 1, dz: -1, id: 5 });
  blocks.push({ dx: -1, dy: 1, dz: 1,  id: 5 });
  blocks.push({ dx: 1,  dy: 1, dz: 1,  id: 5 });

  // Crossbeam at top (y=2)
  blocks.push({ dx: 0, dy: 2, dz: -1, id: 5 }); // Beam
  blocks.push({ dx: 0, dy: 2, dz: 1,  id: 5 });

  // Cobble canopy roof (3x3 at y=2)
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      blocks.push({ dx: x, dy: 2, dz: z, id: 15 });
    }
  }

  // Central torch under roof
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 20 });

  return { name: 'Village Well', width: 3, depth: 3, height: 3, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Cleric Shrine — 4x4 open-air altar with purple wool and glowstone
// ──────────────────────────────────────────────────────────────────────────────
export function getClericShrineSchematic() {
  const blocks = [];

  // Stone brick floor
  for (let x = -2; x <= 1; x++) {
    for (let z = 0; z <= 3; z++) {
      blocks.push({ dx: x, dy: -1, dz: z, id: 16 });
    }
  }

  // 4 corner pillar columns (y 0..2)
  for (let y = 0; y <= 2; y++) {
    blocks.push({ dx: -2, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 1,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -2, dy: y, dz: 3, id: 5 });
    blocks.push({ dx: 1,  dy: y, dz: 3, id: 5 });
  }

  // Open sides (no walls — shrine is open-air)
  // Central altar block = purple wool
  blocks.push({ dx: -1, dy: 0, dz: 1, id: 36 }); // Terracotta altar base
  blocks.push({ dx: 0,  dy: 0, dz: 1, id: 36 });
  blocks.push({ dx: -1, dy: 1, dz: 1, id: 21 }); // Glowstone on altar
  blocks.push({ dx: 0,  dy: 1, dz: 1, id: 21 });

  // Roof of logs (y=3) connecting pillars
  for (let x = -2; x <= 1; x++) {
    blocks.push({ dx: x, dy: 3, dz: 0, id: 5 });
    blocks.push({ dx: x, dy: 3, dz: 3, id: 5 });
  }
  for (let z = 0; z <= 3; z++) {
    blocks.push({ dx: -2, dy: 3, dz: z, id: 5 });
    blocks.push({ dx: 1,  dy: 3, dz: z, id: 5 });
  }

  // Porch step
  blocks.push({ dx: -1, dy: -1, dz: -1, id: 16 });
  blocks.push({ dx: 0,  dy: -1, dz: -1, id: 16 });

  return { name: 'Cleric Shrine', width: 4, depth: 4, height: 4, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. Librarian House — 5x6 with bookshelves, lectern (bookshelf), reading area
// ──────────────────────────────────────────────────────────────────────────────
export function getLibrarianHouseSchematic() {
  const blocks = [];

  // Stone brick floor
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z <= 5; z++) {
      blocks.push({ dx: x, dy: -1, dz: z, id: 16 });
    }
  }

  // Corner log pillars (y 0..3)
  for (let y = 0; y <= 3; y++) {
    blocks.push({ dx: -2, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -2, dy: y, dz: 5, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 5, id: 5 });
  }

  // Plank walls (y 0..2)
  for (let y = 0; y <= 2; y++) {
    for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 5, id: 7 }); // back
    for (let z = 1; z <= 4; z++) {
      blocks.push({ dx: -2, dy: y, dz: z, id: 7 }); // left
      blocks.push({ dx: 2,  dy: y, dz: z, id: 7 }); // right
    }
    if (y === 0 || y === 1) {
      blocks.push({ dx: -1, dy: y, dz: 0, id: 7 });
      blocks.push({ dx: 1,  dy: y, dz: 0, id: 7 });
    } else {
      for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 0, id: 7 });
    }
  }

  // Door gap
  blocks.push({ dx: 0, dy: 0, dz: 0, id: 0 });
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 0 });

  // Porch step
  blocks.push({ dx: 0,  dy: -1, dz: -1, id: 16 });
  blocks.push({ dx: -1, dy: -1, dz: -1, id: 16 });
  blocks.push({ dx: 1,  dy: -1, dz: -1, id: 16 });

  // Glass windows
  blocks.push({ dx: 0,  dy: 1, dz: 5, id: 9 }); // Back
  blocks.push({ dx: -2, dy: 1, dz: 3, id: 9 }); // Left
  blocks.push({ dx: 2,  dy: 1, dz: 3, id: 9 }); // Right

  // Interior furniture — bookshelves, lectern, bed, chest
  blocks.push({ dx: -1, dy: 0, dz: 4, id: 44 }); // Bookshelf
  blocks.push({ dx: 0,  dy: 0, dz: 4, id: 44 }); // Bookshelf
  blocks.push({ dx: 1,  dy: 0, dz: 4, id: 44 }); // Bookshelf
  blocks.push({ dx: -1, dy: 1, dz: 4, id: 44 }); // Bookshelf upper
  blocks.push({ dx: 0,  dy: 1, dz: 4, id: 44 }); // Bookshelf upper
  blocks.push({ dx: 1,  dy: 1, dz: 4, id: 44 }); // Bookshelf upper
  blocks.push({ dx: -1, dy: 0, dz: 2, id: 41 }); // Crafting Table (lectern)
  blocks.push({ dx: 1,  dy: 0, dz: 2, id: 57 }); // Bed
  blocks.push({ dx: 1,  dy: 0, dz: 1, id: 43 }); // Chest

  // Torches
  blocks.push({ dx: -1, dy: 2, dz: 5, id: 20 });
  blocks.push({ dx: 1,  dy: 2, dz: 5, id: 20 });
  blocks.push({ dx: 0,  dy: 2, dz: 1, id: 20 });

  // Plank ceiling (y=3)
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z <= 5; z++) {
      blocks.push({ dx: x, dy: 3, dz: z, id: 7 });
    }
  }

  // Roof ridge (y=4, narrower)
  for (let x = -1; x <= 1; x++) {
    for (let z = 0; z <= 5; z++) {
      blocks.push({ dx: x, dy: 4, dz: z, id: 7 });
    }
  }

  return { name: 'Librarian House', width: 5, depth: 6, height: 5, blocks };
}
