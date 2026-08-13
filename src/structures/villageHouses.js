// ---- Village House Schematics & Market Pedestal Presets ---------------------

/**
 * High-Detail Authentic Minecraft Village House Schematics
 *
 * Elevation Alignment Standard:
 *  dy = 0 : Floor & Porch Step (level with town square & gravel roads)
 *  dy = 1 : Furniture, Door Bottom, Lower Walls
 *  dy = 2 : Windows, Door Top, Middle Walls, Torches
 *  dy = 3 : Upper Walls & Timber Header Beams
 *  dy = 4 : Ceiling & Eave Trims
 *  dy = 5 : Pitched Gabled Roof Ridge
 *  dy = 6 : Chimney Cap
 *
 * Block IDs:
 *  0  = Air
 *  5  = Oak Log
 *  6  = Leaves
 *  7  = Oak Plank
 *  8  = Water
 *  9  = Glass
 *  15 = Cobblestone
 *  16 = Stone Brick
 *  20 = Torch
 *  21 = Glowstone
 *  36 = Terracotta
 *  41 = Crafting Table
 *  42 = Furnace
 *  43 = Chest
 *  44 = Bookshelf
 *  45 = Ladder
 *  46 = Iron Block
 *  50 = White Wool
 *  51 = Red Wool
 *  52 = Blue Wool
 *  54 = Yellow Wool
 *  57 = Bed
 *  95 = Market Showcase Pedestal
 */

// ──────────────────────────────────────────────────────────────────────────────
// 1. Small Oak Cottage — 6x6 Footprint with Gabled Overhang Roof
// ──────────────────────────────────────────────────────────────────────────────
export function getSmallOakCottageSchematic() {
  const blocks = [];

  // Floor (dy = 0, x=-2..2, z=0..4) — Stone Brick
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z <= 4; z++) {
      blocks.push({ dx: x, dy: 0, dz: z, id: 16 });
    }
  }

  // Front porch steps (dz = -1, dy = 0)
  for (let x = -1; x <= 1; x++) {
    blocks.push({ dx: x, dy: 0, dz: -1, id: 16 });
  }

  // Oak Log corner pillars (y 1..4)
  for (let y = 1; y <= 4; y++) {
    blocks.push({ dx: -2, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -2, dy: y, dz: 4, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 4, id: 5 });
  }

  // Horizontal Log top framing header beams (y = 4)
  for (let x = -1; x <= 1; x++) {
    blocks.push({ dx: x, dy: 4, dz: 0, id: 5 });
    blocks.push({ dx: x, dy: 4, dz: 4, id: 5 });
  }
  for (let z = 1; z <= 3; z++) {
    blocks.push({ dx: -2, dy: 4, dz: z, id: 5 });
    blocks.push({ dx: 2,  dy: 4, dz: z, id: 5 });
  }

  // Plank walls (y 1..3)
  for (let y = 1; y <= 3; y++) {
    // Back wall (z=4)
    for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 4, id: 7 });
    // Side walls (x=-2, x=2)
    for (let z = 1; z <= 3; z++) {
      blocks.push({ dx: -2, dy: y, dz: z, id: 7 });
      blocks.push({ dx: 2,  dy: y, dz: z, id: 7 });
    }
    // Front wall (z=0) with door opening at dx=0
    if (y === 1 || y === 2) {
      blocks.push({ dx: -1, dy: y, dz: 0, id: 7 });
      blocks.push({ dx: 1,  dy: y, dz: 0, id: 7 });
    } else {
      for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 0, id: 7 });
    }
  }

  // Door opening (explicit Air at y=1 and y=2)
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 0 });
  blocks.push({ dx: 0, dy: 2, dz: 0, id: 0 });

  // Glass windows
  blocks.push({ dx: 0,  dy: 2, dz: 4, id: 9 }); // Back window
  blocks.push({ dx: -2, dy: 2, dz: 2, id: 9 }); // Left window
  blocks.push({ dx: 2,  dy: 2, dz: 2, id: 9 }); // Right window

  // Interior Furniture (dy = 1, resting on floor dy = 0)
  blocks.push({ dx: -1, dy: 1, dz: 3, id: 57 }); // Bed
  blocks.push({ dx: 1,  dy: 1, dz: 3, id: 43 }); // Chest
  blocks.push({ dx: 1,  dy: 1, dz: 1, id: 41 }); // Crafting Table
  blocks.push({ dx: -1, dy: 1, dz: 1, id: 42 }); // Furnace

  // Wall-mounted torches
  blocks.push({ dx: -1, dy: 3, dz: 4, id: 20 }); // Back wall torch
  blocks.push({ dx: 1,  dy: 3, dz: 4, id: 20 });
  blocks.push({ dx: 0,  dy: 3, dz: 1, id: 20 }); // Front interior torch

  // Decorative porch hedge outside
  blocks.push({ dx: -2, dy: 1, dz: -1, id: 6 }); // Leaf bush
  blocks.push({ dx: 2,  dy: 1, dz: -1, id: 6 });

  // ── Gabled Pitched Roof with Overhangs ──
  // Tier 1 Eaves (y = 5, x = -3..3, z = -1..5)
  for (let z = -1; z <= 5; z++) {
    blocks.push({ dx: -3, dy: 5, dz: z, id: 15 }); // Cobblestone eave trim
    blocks.push({ dx: -2, dy: 5, dz: z, id: 7  });
    blocks.push({ dx: -1, dy: 5, dz: z, id: 7  });
    blocks.push({ dx: 0,  dy: 5, dz: z, id: 7  });
    blocks.push({ dx: 1,  dy: 5, dz: z, id: 7  });
    blocks.push({ dx: 2,  dy: 5, dz: z, id: 7  });
    blocks.push({ dx: 3,  dy: 5, dz: z, id: 15 }); // Cobblestone eave trim
  }

  // Tier 2 Ridge (y = 6, x = -1..1, z = -1..5)
  for (let z = -1; z <= 5; z++) {
    blocks.push({ dx: -1, dy: 6, dz: z, id: 7 });
    blocks.push({ dx: 0,  dy: 6, dz: z, id: 7 });
    blocks.push({ dx: 1,  dy: 6, dz: z, id: 7 });
  }

  // Chimney stack rising from furnace (dx=-1, dz=1)
  blocks.push({ dx: -1, dy: 5, dz: 1, id: 15 });
  blocks.push({ dx: -1, dy: 6, dz: 1, id: 15 });
  blocks.push({ dx: -1, dy: 7, dz: 1, id: 5  }); // Oak log chimney cap

  return { name: 'Small Oak Cottage', width: 7, depth: 7, height: 8, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Blacksmith / Workshop — Open Forge & Enclosed Smithy Room
// ──────────────────────────────────────────────────────────────────────────────
export function getBlacksmithWorkshopSchematic() {
  const blocks = [];

  // Cobblestone foundation & floor (dy = 0, x=-3..3, z=0..6)
  for (let x = -3; x <= 3; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: 0, dz: z, id: 15 });
    }
  }

  // Front porch steps (dz = -1, dy = 0)
  for (let x = -2; x <= 2; x++) {
    blocks.push({ dx: x, dy: 0, dz: -1, id: 15 });
  }

  // Outer Cobblestone & Stone Brick walls (y 1..3)
  for (let y = 1; y <= 3; y++) {
    // Back wall (z=6)
    for (let x = -3; x <= 3; x++) blocks.push({ dx: x, dy: y, dz: 6, id: 15 });
    // Left wall (x=-3) & Right wall (x=3)
    for (let z = 1; z <= 5; z++) {
      blocks.push({ dx: -3, dy: y, dz: z, id: 15 });
      blocks.push({ dx: 3,  dy: y, dz: z, id: 15 });
    }
    // Front wall (z=0) with wide 2-block entrance at dx=-1..0
    blocks.push({ dx: -3, dy: y, dz: 0, id: 15 });
    blocks.push({ dx: -2, dy: y, dz: 0, id: 15 });
    blocks.push({ dx: 1,  dy: y, dz: 0, id: 15 });
    blocks.push({ dx: 2,  dy: y, dz: 0, id: 15 });
    blocks.push({ dx: 3,  dy: y, dz: 0, id: 15 });
    if (y === 3) {
      // Header over entrance
      blocks.push({ dx: -1, dy: y, dz: 0, id: 15 });
      blocks.push({ dx: 0,  dy: y, dz: 0, id: 15 });
    }
  }

  // Open front entrance (2 blocks wide, 2 blocks tall at y=1 and y=2)
  for (let x = -1; x <= 0; x++) {
    blocks.push({ dx: x, dy: 1, dz: 0, id: 0 });
    blocks.push({ dx: x, dy: 2, dz: 0, id: 0 });
  }

  // Glass side windows
  blocks.push({ dx: -3, dy: 2, dz: 3, id: 9 });
  blocks.push({ dx: 3,  dy: 2, dz: 3, id: 9 });
  blocks.push({ dx: 0,  dy: 2, dz: 6, id: 9 });

  // ── Blacksmith Equipment & Forge (dy = 1) ──
  blocks.push({ dx: -2, dy: 1, dz: 5, id: 42 }); // Primary Forge Furnace
  blocks.push({ dx: -1, dy: 1, dz: 5, id: 42 }); // Secondary Forge Furnace
  blocks.push({ dx: -2, dy: 1, dz: 4, id: 46 }); // Iron Anvil Block
  blocks.push({ dx: 2,  dy: 1, dz: 5, id: 43 }); // Smithy Loot Chest
  blocks.push({ dx: 2,  dy: 1, dz: 4, id: 57 }); // Smith's Bed
  blocks.push({ dx: 2,  dy: 1, dz: 2, id: 41 }); // Crafting Table
  blocks.push({ dx: 0,  dy: 1, dz: 3, id: 95 }); // Market Showcase Pedestal

  // Interior & Forge Lighting
  blocks.push({ dx: -2, dy: 3, dz: 5, id: 20 }); // Torch over forge
  blocks.push({ dx: 2,  dy: 3, dz: 5, id: 20 }); // Torch over chest
  blocks.push({ dx: 0,  dy: 3, dz: 1, id: 20 }); // Entry torch

  // Solid Stone Slab / Cobblestone Roof with Overhangs (y=4)
  for (let x = -3; x <= 3; x++) {
    for (let z = -1; z <= 6; z++) {
      blocks.push({ dx: x, dy: 4, dz: z, id: 15 });
    }
  }

  // Chimney stack rising from forge (dx=-2, dz=5)
  blocks.push({ dx: -2, dy: 5, dz: 5, id: 15 });
  blocks.push({ dx: -2, dy: 6, dz: 5, id: 5  }); // Oak Log chimney cap

  return { name: 'Blacksmith Workshop', width: 7, depth: 8, height: 7, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Large Two-Story House — 7x7 Multi-Storey Timbered Homestead
// ──────────────────────────────────────────────────────────────────────────────
export function getLargeTwoStoryHouseSchematic() {
  const blocks = [];

  // Ground floor Stone Brick foundation & floor (dy = 0, x=-3..3, z=0..6)
  for (let x = -3; x <= 3; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: 0, dz: z, id: 16 });
    }
  }

  // Front porch steps (dz = -1, dy = 0)
  for (let x = -1; x <= 1; x++) {
    blocks.push({ dx: x, dy: 0, dz: -1, id: 16 });
  }

  // ── First Floor: Cobblestone & Log Structure (y 1..3) ──
  // Corner Log pillars
  for (let y = 1; y <= 3; y++) {
    blocks.push({ dx: -3, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 3,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -3, dy: y, dz: 6, id: 5 });
    blocks.push({ dx: 3,  dy: y, dz: 6, id: 5 });
  }

  // Cobblestone ground walls
  for (let y = 1; y <= 3; y++) {
    for (let x = -2; x <= 2; x++) blocks.push({ dx: x, dy: y, dz: 6, id: 15 }); // Back
    for (let z = 1; z <= 5; z++) {
      blocks.push({ dx: -3, dy: y, dz: z, id: 15 }); // Left
      blocks.push({ dx: 3,  dy: y, dz: z, id: 15 }); // Right
    }
    if (y === 1 || y === 2) {
      blocks.push({ dx: -2, dy: y, dz: 0, id: 15 });
      blocks.push({ dx: -1, dy: y, dz: 0, id: 15 });
      blocks.push({ dx: 1,  dy: y, dz: 0, id: 15 });
      blocks.push({ dx: 2,  dy: y, dz: 0, id: 15 });
    } else {
      for (let x = -2; x <= 2; x++) blocks.push({ dx: x, dy: y, dz: 0, id: 15 });
    }
  }

  // Door opening (dx=0, dz=0 at y=1 and y=2)
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 0 });
  blocks.push({ dx: 0, dy: 2, dz: 0, id: 0 });

  // Ground floor windows
  blocks.push({ dx: -3, dy: 2, dz: 3, id: 9 });
  blocks.push({ dx: 3,  dy: 2, dz: 3, id: 9 });
  blocks.push({ dx: 0,  dy: 2, dz: 6, id: 9 });

  // Ground floor furniture (dy = 1)
  blocks.push({ dx: -2, dy: 1, dz: 5, id: 57 }); // Bed
  blocks.push({ dx: 2,  dy: 1, dz: 5, id: 43 }); // Storage Chest
  blocks.push({ dx: -2, dy: 1, dz: 1, id: 41 }); // Crafting Table
  blocks.push({ dx: 2,  dy: 1, dz: 1, id: 42 }); // Kitchen Furnace
  blocks.push({ dx: -2, dy: 1, dz: 3, id: 44 }); // Bookshelf

  // Ground floor torches
  blocks.push({ dx: -2, dy: 3, dz: 6, id: 20 });
  blocks.push({ dx: 2,  dy: 3, dz: 6, id: 20 });
  blocks.push({ dx: 0,  dy: 3, dz: 1, id: 20 });

  // ── Second Floor Platform (y = 4) — Oak Plank Floor ──
  for (let x = -3; x <= 3; x++) {
    for (let z = 0; z <= 6; z++) {
      blocks.push({ dx: x, dy: 4, dz: z, id: 7 });
    }
  }

  // Ladder climbing shaft on right side (dx=2, dz=3)
  blocks.push({ dx: 2, dy: 1, dz: 3, id: 45 });
  blocks.push({ dx: 2, dy: 2, dz: 3, id: 45 });
  blocks.push({ dx: 2, dy: 3, dz: 3, id: 45 });
  blocks.push({ dx: 2, dy: 4, dz: 3, id: 0  }); // Hatch opening in ceiling

  // ── Second Floor: Overhanging Timber Walls (y 5..7) ──
  for (let y = 5; y <= 7; y++) {
    for (let x = -3; x <= 3; x++) {
      blocks.push({ dx: x, dy: y, dz: 0, id: 7 });
      blocks.push({ dx: x, dy: y, dz: 6, id: 7 });
    }
    for (let z = 1; z <= 5; z++) {
      blocks.push({ dx: -3, dy: y, dz: z, id: 7 });
      blocks.push({ dx: 3,  dy: y, dz: z, id: 7 });
    }
  }

  // Second floor upper windows
  blocks.push({ dx: 0,  dy: 6, dz: 0, id: 9 });
  blocks.push({ dx: 0,  dy: 6, dz: 6, id: 9 });
  blocks.push({ dx: -3, dy: 6, dz: 3, id: 9 });
  blocks.push({ dx: 3,  dy: 6, dz: 3, id: 9 });

  // Second floor luxury bedroom & library
  blocks.push({ dx: -2, dy: 5, dz: 5, id: 57 }); // Master Bed
  blocks.push({ dx: -1, dy: 5, dz: 5, id: 57 });
  blocks.push({ dx: 1,  dy: 5, dz: 5, id: 43 }); // Treasure Chest
  blocks.push({ dx: -2, dy: 5, dz: 1, id: 44 }); // Great Bookshelves
  blocks.push({ dx: -2, dy: 5, dz: 2, id: 44 });
  blocks.push({ dx: -2, dy: 6, dz: 1, id: 44 });
  blocks.push({ dx: -2, dy: 6, dz: 2, id: 44 });

  // Second floor lighting
  blocks.push({ dx: -2, dy: 7, dz: 5, id: 20 });
  blocks.push({ dx: 2,  dy: 7, dz: 5, id: 20 });

  // ── Gabled Pitched Timber Roof (y 8..9) ──
  for (let z = -1; z <= 7; z++) {
    for (let x = -4; x <= 4; x++) {
      blocks.push({ dx: x, dy: 8, dz: z, id: 7 });
    }
    for (let x = -2; x <= 2; x++) {
      blocks.push({ dx: x, dy: 9, dz: z, id: 7 });
    }
  }

  return { name: 'Large Two-Story House', width: 9, depth: 9, height: 10, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Central Village Well — 3x3 Monumental Well with Water Basin
// ──────────────────────────────────────────────────────────────────────────────
export function getVillageWellSchematic() {
  const blocks = [];

  // Well Base & Basin Walls (dy = 0, x=-1..1, z=-1..1)
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      if (x === 0 && z === 0) {
        blocks.push({ dx: 0, dy: 0, dz: 0, id: 8 }); // Deep water basin center
      } else {
        blocks.push({ dx: x, dy: 0, dz: z, id: 16 }); // Stone Brick rim
      }
    }
  }

  // 4 Corner Oak Log Pillars (y 1..3)
  for (let y = 1; y <= 3; y++) {
    blocks.push({ dx: -1, dy: y, dz: -1, id: 5 });
    blocks.push({ dx: 1,  dy: y, dz: -1, id: 5 });
    blocks.push({ dx: -1, dy: y, dz: 1,  id: 5 });
    blocks.push({ dx: 1,  dy: y, dz: 1,  id: 5 });
  }

  // Crossbeams atop pillars (y = 3)
  blocks.push({ dx: 0, dy: 3, dz: -1, id: 5 });
  blocks.push({ dx: 0, dy: 3, dz: 1,  id: 5 });
  blocks.push({ dx: -1, dy: 3, dz: 0, id: 5 });
  blocks.push({ dx: 1,  dy: 3, dz: 0, id: 5 });

  // Cobblestone Canopy Roof (3x3 at y = 4)
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      blocks.push({ dx: x, dy: 4, dz: z, id: 15 });
    }
  }

  // Central Hanging Torch under roof (y = 3)
  blocks.push({ dx: 0, dy: 3, dz: 0, id: 20 });

  return { name: 'Village Well', width: 3, depth: 3, height: 5, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Cleric Shrine — 4x4 Stately Chapel with Glowing Altar
// ──────────────────────────────────────────────────────────────────────────────
export function getClericShrineSchematic() {
  const blocks = [];

  // Polished Stone Brick floor (dy = 0, x=-2..1, z=0..3)
  for (let x = -2; x <= 1; x++) {
    for (let z = 0; z <= 3; z++) {
      blocks.push({ dx: x, dy: 0, dz: z, id: 16 });
    }
  }

  // Porch step (dz = -1, dy = 0)
  blocks.push({ dx: -1, dy: 0, dz: -1, id: 16 });
  blocks.push({ dx: 0,  dy: 0, dz: -1, id: 16 });

  // 4 Corner Pillar Columns (y 1..4)
  for (let y = 1; y <= 4; y++) {
    blocks.push({ dx: -2, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 1,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -2, dy: y, dz: 3, id: 5 });
    blocks.push({ dx: 1,  dy: y, dz: 3, id: 5 });
  }

  // Arched Stone Walls on Back & Sides (y 1..3)
  for (let y = 1; y <= 3; y++) {
    blocks.push({ dx: -1, dy: y, dz: 3, id: 15 }); // Back
    blocks.push({ dx: 0,  dy: y, dz: 3, id: 15 });
    blocks.push({ dx: -2, dy: y, dz: 1, id: 15 }); // Left
    blocks.push({ dx: -2, dy: y, dz: 2, id: 15 });
    blocks.push({ dx: 1,  dy: y, dz: 1, id: 15 }); // Right
    blocks.push({ dx: 1,  dy: y, dz: 2, id: 15 });
  }

  // Open front entrance (y=1 and y=2)
  blocks.push({ dx: -1, dy: 1, dz: 0, id: 0 });
  blocks.push({ dx: 0,  dy: 1, dz: 0, id: 0 });
  blocks.push({ dx: -1, dy: 2, dz: 0, id: 0 });
  blocks.push({ dx: 0,  dy: 2, dz: 0, id: 0 });

  // ── Central Shrine Altar (dy = 1) ──
  blocks.push({ dx: -1, dy: 1, dz: 2, id: 36 }); // Terracotta altar base
  blocks.push({ dx: 0,  dy: 1, dz: 2, id: 36 });
  blocks.push({ dx: -1, dy: 2, dz: 2, id: 21 }); // Glowing Glowstone holy reliquary
  blocks.push({ dx: 0,  dy: 2, dz: 2, id: 21 });

  // Shrine Torches
  blocks.push({ dx: -2, dy: 3, dz: 1, id: 20 });
  blocks.push({ dx: 1,  dy: 3, dz: 1, id: 20 });

  // Timber Crossbeams & Roof (y = 5)
  for (let x = -2; x <= 1; x++) {
    for (let z = 0; z <= 3; z++) {
      blocks.push({ dx: x, dy: 5, dz: z, id: 15 });
    }
  }

  // Chapel Belfry Spire (y = 6..7)
  blocks.push({ dx: -1, dy: 6, dz: 1, id: 5 });
  blocks.push({ dx: 0,  dy: 6, dz: 1, id: 5 });
  blocks.push({ dx: -1, dy: 7, dz: 1, id: 20 }); // Torch atop spire

  return { name: 'Cleric Shrine', width: 4, depth: 4, height: 8, blocks };
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. Librarian Great Library — 5x6 Vaulted Reading Hall
// ──────────────────────────────────────────────────────────────────────────────
export function getLibrarianHouseSchematic() {
  const blocks = [];

  // Stone Brick floor (dy = 0, x=-2..2, z=0..5)
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z <= 5; z++) {
      blocks.push({ dx: x, dy: 0, dz: z, id: 16 });
    }
  }

  // Front porch steps (dz = -1, dy = 0)
  blocks.push({ dx: 0,  dy: 0, dz: -1, id: 16 });
  blocks.push({ dx: -1, dy: 0, dz: -1, id: 16 });
  blocks.push({ dx: 1,  dy: 0, dz: -1, id: 16 });

  // Oak Log corner pillars (y 1..4)
  for (let y = 1; y <= 4; y++) {
    blocks.push({ dx: -2, dy: y, dz: 0, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 0, id: 5 });
    blocks.push({ dx: -2, dy: y, dz: 5, id: 5 });
    blocks.push({ dx: 2,  dy: y, dz: 5, id: 5 });
  }

  // Timber plank walls (y 1..3)
  for (let y = 1; y <= 3; y++) {
    for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 5, id: 7 }); // Back
    for (let z = 1; z <= 4; z++) {
      blocks.push({ dx: -2, dy: y, dz: z, id: 7 }); // Left
      blocks.push({ dx: 2,  dy: y, dz: z, id: 7 }); // Right
    }
    if (y === 1 || y === 2) {
      blocks.push({ dx: -1, dy: y, dz: 0, id: 7 });
      blocks.push({ dx: 1,  dy: y, dz: 0, id: 7 });
    } else {
      for (let x = -1; x <= 1; x++) blocks.push({ dx: x, dy: y, dz: 0, id: 7 });
    }
  }

  // Door opening (dx=0, dz=0 at y=1 and y=2)
  blocks.push({ dx: 0, dy: 1, dz: 0, id: 0 });
  blocks.push({ dx: 0, dy: 2, dz: 0, id: 0 });

  // Glass reading windows
  blocks.push({ dx: 0,  dy: 2, dz: 5, id: 9 }); // Back
  blocks.push({ dx: -2, dy: 2, dz: 3, id: 9 }); // Left
  blocks.push({ dx: 2,  dy: 2, dz: 3, id: 9 }); // Right

  // ── Library Bookshelves & Study Furniture (dy = 1) ──
  blocks.push({ dx: -1, dy: 1, dz: 4, id: 44 }); // Bookshelf row 1
  blocks.push({ dx: 0,  dy: 1, dz: 4, id: 44 });
  blocks.push({ dx: 1,  dy: 1, dz: 4, id: 44 });
  blocks.push({ dx: -1, dy: 2, dz: 4, id: 44 }); // Bookshelf upper row
  blocks.push({ dx: 0,  dy: 2, dz: 4, id: 44 });
  blocks.push({ dx: 1,  dy: 2, dz: 4, id: 44 });
  blocks.push({ dx: -1, dy: 3, dz: 4, id: 44 }); // Bookshelf top row
  blocks.push({ dx: 0,  dy: 3, dz: 4, id: 44 });
  blocks.push({ dx: 1,  dy: 3, dz: 4, id: 44 });

  blocks.push({ dx: -1, dy: 1, dz: 2, id: 41 }); // Reading Lectern (Crafting Table)
  blocks.push({ dx: 1,  dy: 1, dz: 2, id: 57 }); // Scholar's Bed
  blocks.push({ dx: 1,  dy: 1, dz: 1, id: 43 }); // Archive Chest

  // Reading Lamps & Torches
  blocks.push({ dx: -1, dy: 3, dz: 5, id: 20 });
  blocks.push({ dx: 1,  dy: 3, dz: 5, id: 20 });
  blocks.push({ dx: 0,  dy: 3, dz: 1, id: 20 });

  // Gabled Overhang Roof (y 5..6)
  for (let z = -1; z <= 6; z++) {
    for (let x = -3; x <= 3; x++) {
      blocks.push({ dx: x, dy: 5, dz: z, id: 7 });
    }
  }
  for (let z = -1; z <= 6; z++) {
    for (let x = -1; x <= 1; x++) {
      blocks.push({ dx: x, dy: 6, dz: z, id: 7 });
    }
  }

  return { name: 'Librarian House', width: 7, depth: 8, height: 7, blocks };
}
