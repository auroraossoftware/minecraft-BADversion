// ---- Farmer Villager AI Engine ---------------------------------------------
import * as THREE from 'three';
import { getBlock, setBlock } from '../world.js';

/**
 * Ticks the farmer's complete farming routine:
 * 1. Scan nearby farmland for ripe wheat (ID 92).
 * 2. If found, walk to the crop block.
 * 3. On arrival, harvest (replace with seeded ID 90), add wheat to inventory.
 * 4. Periodically share bread with nearby hungry villagers.
 *
 * Only active while mob.state === 'work' and profession === 'farmer'.
 */
export function tickFarmerAI(mob, dt) {
  if (!mob || mob.dead || mob.profession !== 'farmer') return;
  if (mob.state !== 'work' && mob.state !== 'lunch') return;

  // ── Bread sharing during lunch ─────────────────────────────────────────────
  if (mob.state === 'lunch') {
    _tickBreadSharing(mob, dt);
    return;
  }

  // ── Farming routine ────────────────────────────────────────────────────────
  mob.farmTimer = (mob.farmTimer || 0) + dt;

  // If we're walking to a crop, handle arrival
  if (mob.actionState === 'walk_to_crop' && mob.actionTarget) {
    const d2 = mob.pos.distanceTo(mob.actionTarget);
    if (d2 <= 1.5) {
      // Arrived — harvest the crop
      const tx = Math.floor(mob.actionTarget.x);
      const ty = Math.floor(mob.actionTarget.y);
      const tz = Math.floor(mob.actionTarget.z);

      const bid = getBlock(tx, ty, tz);
      if (bid === 92) {
        // Harvest ripe wheat → replant as seeded
        setBlock(tx, ty, tz, 90, false);

        // Add wheat to farmer inventory
        if (Array.isArray(mob.inventory)) {
          const wheat = mob.inventory.find(i => i.id === 136);
          if (wheat) wheat.count += 2;
          else mob.inventory.push({ id: 136, count: 2 });
        }

        // Craft wheat into bread if carrying >= 3 wheat
        const wheatEntry = mob.inventory ? mob.inventory.find(i => i.id === 136) : null;
        if (wheatEntry && wheatEntry.count >= 3) {
          const breadCount = Math.floor(wheatEntry.count / 3);
          wheatEntry.count -= breadCount * 3;
          const breadEntry = mob.inventory.find(i => i.id === 135);
          if (breadEntry) breadEntry.count += breadCount;
          else mob.inventory.push({ id: 135, count: breadCount });
        }
      }

      // Done with this crop — go back to general work state
      mob.actionState = 'idle';
      mob.actionTarget = null;
      mob.farmTimer = 0; // brief cooldown before scanning again
    }
    // Movement is handled by villagerSchedule.js _handleWork
    return;
  }

  // Scan every 2.5s for a nearby ripe crop
  if (mob.farmTimer < 2.5) return;
  mob.farmTimer = 0;

  const mx = Math.floor(mob.pos.x);
  const my = Math.floor(mob.pos.y);
  const mz = Math.floor(mob.pos.z);

  // Search radius: 12 blocks around the farmer
  let closestCrop = null;
  let closestDist = Infinity;

  for (let dx = -12; dx <= 12; dx += 1) {
    for (let dz = -12; dz <= 12; dz += 1) {
      for (let dy = -2; dy <= 2; dy++) {
        const vx = mx + dx, vy = my + dy, vz = mz + dz;
        const bid = getBlock(vx, vy, vz);
        if (bid === 92) { // Ripe Wheat
          const dist = Math.hypot(dx, dz);
          if (dist < closestDist) {
            closestDist = dist;
            closestCrop = new THREE.Vector3(vx + 0.5, vy, vz + 0.5);
          }
        }
      }
    }
  }

  if (closestCrop) {
    // Set action: walk to this crop
    mob.actionState = 'walk_to_crop';
    mob.actionTarget = closestCrop;
    // workplacePos tracks where the farmer is currently headed
    mob.workplacePos.copy(closestCrop);
  }
}

/**
 * Farmer tosses bread to nearby villagers with low HP or who are hungry.
 */
function _tickBreadSharing(mob, dt) {
  mob.breadShareTimer = (mob.breadShareTimer || 20) - dt;
  if (mob.breadShareTimer > 0) return;
  mob.breadShareTimer = 15 + Math.random() * 15;

  // Need bread to share
  if (!mob.inventory) return;
  const breadEntry = mob.inventory.find(i => i.id === 135);
  if (!breadEntry || breadEntry.count <= 0) return;

  // Find a nearby villager that needs food (hp < maxHp * 0.7)
  // This operates on the global mobs list via the window bridge
  if (typeof window === 'undefined' || !window.__game) return;
  const allMobs = window.__game.mobs;
  if (!Array.isArray(allMobs)) return;

  let recipient = null;
  let minHpRatio = 0.7; // only share if below 70% HP
  for (const other of allMobs) {
    if (other === mob || other.type !== 'villager' || other.dead || !other.pos) continue;
    if (mob.pos.distanceTo(other.pos) > 5.0) continue;
    const ratio = (other.hp || 20) / (other.maxHp || 20);
    if (ratio < minHpRatio) {
      minHpRatio = ratio;
      recipient = other;
    }
  }

  if (recipient) {
    // "Throw" bread: deduct 1 bread, recipient gains 3 HP
    breadEntry.count -= 1;
    recipient.hp = Math.min(recipient.maxHp || 20, (recipient.hp || 20) + 3);
  }
}
