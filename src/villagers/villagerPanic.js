// ---- Villager Threat Detection & Panic System --------------------------------
import * as THREE from 'three';

const THREAT_DETECTION_RADIUS = 14.0; // distance at which villager detects hostiles
const PANIC_DURATION           = 6.0; // seconds villager remains in panic sprint
const ALARM_PROPAGATION_RADIUS = 16.0; // radius to alert neighbouring villagers

/**
 * Full Threat Matrix for a single villager each frame:
 *
 * 1. Scan for nearby hostile mobs (zombies, skeletons, spiders, creepers).
 * 2. If one is found within THREAT_DETECTION_RADIUS:
 *    a. Trigger villager's panicTimer.
 *    b. Propagate alarm to all other villagers within ALARM_PROPAGATION_RADIUS.
 * 3. If panicTimer is running:
 *    a. Sprint toward home position at MOVE_SPEED_PANIC.
 *    b. Once home (dist < 1.5), stop moving and barricade indoors.
 * 4. When panicTimer expires and no threat: transition back to normal schedule.
 * 5. Cornered self-defence: if home is unreachable and a threat is adjacent,
 *    raise arms (yaw oscillates) and sidestep to find escape.
 */
export function tickVillagerPanic(mob, dt, allMobs = []) {
  if (!mob || mob.dead || !mob.pos) return;

  // ── 1. Threat detection scan ───────────────────────────────────────────────
  let nearestThreat = null;
  let minThreatDist = THREAT_DETECTION_RADIUS;

  if (Array.isArray(allMobs)) {
    for (const m of allMobs) {
      if (!m || m.dead || !m.def?.hostile || !m.pos || m.pos.x === undefined) continue;
      const d = mob.pos.distanceTo(m.pos);
      if (d < minThreatDist) {
        minThreatDist = d;
        nearestThreat = m;
      }
    }
  }

  // ── 2. Trigger panic and alarm propagation ────────────────────────────────
  if (nearestThreat) {
    // Start/extend this villager's panic
    mob.panicTimer    = PANIC_DURATION;
    mob.panicThreatPos = nearestThreat.pos.clone();
    mob.state         = 'panic';
    mob.isSleeping    = false;

    // Propagate alarm to nearby villagers
    if (Array.isArray(allMobs)) {
      for (const other of allMobs) {
        if (!other || other === mob || other.type !== 'villager' || other.dead || !other.pos) continue;
        if (mob.pos.distanceTo(other.pos) <= ALARM_PROPAGATION_RADIUS) {
          if ((other.panicTimer || 0) < PANIC_DURATION * 0.5) {
            other.panicTimer    = PANIC_DURATION * 0.75; // slightly shorter for propagated alarm
            other.panicThreatPos = nearestThreat.pos.clone();
            other.state         = 'panic';
            other.isSleeping    = false;
          }
        }
      }
    }
  }

  // ── 3 & 4. Running panic movement (handled by villagerSchedule) ───────────
  // The schedule's _runPanicMovement handles vel and yaw.
  // Here we just handle the "cornered" self-defence case.

  if (mob.panicTimer > 0 && nearestThreat) {
    const threatDist = mob.pos.distanceTo(nearestThreat.pos);
    const homeDist   = mob.homePos ? mob.pos.distanceTo(mob.homePos) : 999;

    // ── 5. Cornered self-defence ───────────────────────────────────────────
    if (threatDist < 2.5 && homeDist > 4.0) {
      // Oscillate yaw to simulate cowering / looking for escape
      mob.yaw += Math.sin(performance.now() * 0.004) * 0.08;
      // Sidestep perpendicular to threat
      const perpYaw = mob.yaw + Math.PI * 0.5;
      mob.vel.x = -Math.sin(perpYaw) * 1.8;
      mob.vel.z = -Math.cos(perpYaw) * 1.8;
    }
  }

  // ── All-clear: when threat is gone and panic expires ─────────────────────
  // Decrement timer before checking so it can reach zero in this same tick
  if (mob.panicTimer > 0) mob.panicTimer -= dt;
  if (!nearestThreat && mob.panicTimer <= 0 && mob.state === 'panic') {
    mob.state = 'work';
    mob.panicThreatPos = null;
  }
}
