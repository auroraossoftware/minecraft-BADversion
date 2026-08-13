// ---- Villager Daily Schedule & Behaviour State Machine --------------------
import * as THREE from 'three';

/**
 * Time-of-day ranges (0.0 = midnight, 0.5 = noon, 1.0 = midnight):
 *   Dawn/wake-up   : 0.24 – 0.28
 *   Morning work   : 0.28 – 0.47
 *   Lunch          : 0.47 – 0.54
 *   Afternoon work : 0.54 – 0.65
 *   Well gathering : 0.65 – 0.75
 *   Return home    : 0.75 – 0.79
 *   Night / sleep  : 0.79 – 0.24
 */

const MOVE_SPEED_NORMAL = 1.6;
const MOVE_SPEED_PANIC  = 4.5;
const WANDER_RADIUS     = 4.0;  // how far a villager wanders from workplace during idle

/**
 * Main schedule tick — called every frame for each villager mob.
 * Sets mob.vel and mob.yaw based on the time-of-day state machine.
 * Returns true if schedule handled movement (so mobs.js skips animal wander logic).
 */
export function updateVillagerSchedule(mob, dt, timeOfDay = 0.5) {
  if (!mob || mob.dead || !mob.pos) return false;

  // Ensure position anchors exist
  if (!mob.homePos)      mob.homePos      = mob.pos.clone();
  if (!mob.workplacePos) mob.workplacePos = mob.pos.clone().add(new THREE.Vector3(4, 0, 4));
  if (!mob.wellPos)      mob.wellPos      = mob.homePos.clone();

  // ── Panic always overrides schedule ───────────────────────────────────────
  if (mob.panicTimer > 0) {
    mob.state = 'panic';
    mob.isSleeping = false;
    _runPanicMovement(mob, dt);
    return true;
  }

  // ── Anti-stuck check ──────────────────────────────────────────────────────
  mob.stuckTimer = (mob.stuckTimer || 0) + dt;
  if (mob.stuckTimer >= 2.5) {
    mob.stuckTimer = 0;
    if (mob.lastPos && mob.pos.distanceTo(mob.lastPos) < 0.15 &&
        (mob.vel.x !== 0 || mob.vel.z !== 0)) {
      // Jump to unstick
      mob.vel.y = 6.5;
      // Randomise yaw slightly to find a new path
      mob.yaw += (Math.random() - 0.5) * Math.PI;
    }
    if (mob.lastPos) mob.lastPos.copy(mob.pos);
    else mob.lastPos = mob.pos.clone();
  }

  // ── Player curiosity: look at approaching player ──────────────────────────
  if (mob.lookAtPlayer !== false && mob._playerPos && mob.state !== 'sleep' && mob.state !== 'panic') {
    const dx = mob._playerPos.x - mob.pos.x;
    const dz = mob._playerPos.z - mob.pos.z;
    const distP = Math.hypot(dx, dz);
    if (distP < 4.0 && (mob.vel.x === 0 && mob.vel.z === 0)) {
      // Turn to face approaching player when standing idle
      mob.yaw = Math.atan2(-dx, -dz);
    }
  }

  // ── Determine schedule phase ───────────────────────────────────────────────
  const t = timeOfDay;
  const isWaking    = (t >= 0.24 && t < 0.28);
  const isMorning   = (t >= 0.28 && t < 0.47);
  const isLunch     = (t >= 0.47 && t < 0.54);
  const isAfternoon = (t >= 0.54 && t < 0.65);
  const isGathering = (t >= 0.65 && t < 0.75);
  const isReturning = (t >= 0.75 && t < 0.79);
  const isNight     = (t >= 0.79 || t < 0.24);

  if (isNight || isReturning) {
    _handleSleep(mob, dt, isNight);
  } else if (isWaking) {
    _handleWakeUp(mob, dt);
  } else if (isLunch) {
    _handleLunch(mob, dt);
  } else if (isGathering) {
    _handleGathering(mob, dt);
  } else {
    // Morning or Afternoon: work phase
    _handleWork(mob, dt);
  }

  return true; // tell mobs.js we've handled movement
}

// ──────────────────────────────────────────────────────────────────────────────
// Private phase handlers
// ──────────────────────────────────────────────────────────────────────────────

function _handleSleep(mob, dt, fullyAsleep) {
  mob.state = 'sleep';

  if (mob.pos.distanceTo(mob.homePos) > 1.5) {
    // Walk home to bed
    mob.isSleeping = false;
    _steerTo(mob, mob.homePos, MOVE_SPEED_NORMAL);
  } else {
    // Arrived at bed — stop and sleep
    mob.isSleeping = true;
    mob.vel.set(0, 0, 0);
    // Slowly regen HP while sleeping
    if (fullyAsleep && mob.hp < mob.maxHp) {
      mob.hp = Math.min(mob.maxHp, mob.hp + dt * 0.5);
    }
  }
}

function _handleWakeUp(mob, dt) {
  mob.state = 'work';
  mob.isSleeping = false;
  // Walk from home to workplace
  if (mob.pos.distanceTo(mob.workplacePos) > 2.0) {
    _steerTo(mob, mob.workplacePos, MOVE_SPEED_NORMAL);
  } else {
    mob.vel.set(0, 0, 0);
  }
}

function _handleWork(mob, dt) {
  mob.state = 'work';
  mob.isSleeping = false;

  // If we have a specific action target (crop, anvil, etc.) go to it
  if (mob.actionTarget && mob.actionState !== 'idle') {
    const d = mob.pos.distanceTo(mob.actionTarget);
    if (d > 1.2) {
      _steerTo(mob, mob.actionTarget, MOVE_SPEED_NORMAL);
    } else {
      // Arrived at action target — do idle animation at workplace
      mob.vel.set(0, 0, 0);
      mob.actionTimer = (mob.actionTimer || 0) + dt;
      if (mob.actionTimer >= 2.5) {
        mob.actionTimer = 0;
        mob.actionState = 'idle';
        mob.actionTarget = null;
      }
    }
    return;
  }

  // Workplace proximity wander
  const distToWork = mob.pos.distanceTo(mob.workplacePos);
  if (distToWork > WANDER_RADIUS) {
    _steerTo(mob, mob.workplacePos, MOVE_SPEED_NORMAL);
  } else {
    // If we collided with a wall while wandering, immediately stop and choose a new direction
    if (mob.hitWall) {
      mob.hitWall = false;
      mob.wanderTimer = 0;
      mob.vel.set(0, 0, 0);
    }

    // Idle wander within workplace area
    mob.wanderTimer = (mob.wanderTimer || 0) - dt;
    if (mob.wanderTimer <= 0) {
      mob.wanderTimer = 3.0 + Math.random() * 4.0;
      const angle = Math.random() * Math.PI * 2;
      if (Math.random() < 0.6) {
        // Set a wander yaw
        mob.yaw = angle;
        mob.vel.x = -Math.sin(mob.yaw) * MOVE_SPEED_NORMAL * 0.6;
        mob.vel.z = -Math.cos(mob.yaw) * MOVE_SPEED_NORMAL * 0.6;
      } else {
        // Idle: face a random direction and stand still
        mob.yaw = angle;
        mob.vel.set(0, 0, 0);
      }
    }
    // Clamp wandering so they don't drift too far
    if (mob.pos.distanceTo(mob.workplacePos) > WANDER_RADIUS) {
      _steerTo(mob, mob.workplacePos, MOVE_SPEED_NORMAL * 0.6);
    }
  }
}

function _handleLunch(mob, dt) {
  mob.state = 'lunch';
  mob.isSleeping = false;

  // Bread-sharing timer
  mob.breadShareTimer = (mob.breadShareTimer || 0) - dt;

  // Walk to the midpoint between home and work for a lunch break
  const lunchPos = new THREE.Vector3(
    (mob.homePos.x + mob.workplacePos.x) / 2,
    mob.homePos.y,
    (mob.homePos.z + mob.workplacePos.z) / 2
  );

  if (mob.pos.distanceTo(lunchPos) > 2.0) {
    _steerTo(mob, lunchPos, MOVE_SPEED_NORMAL * 0.8);
  } else {
    mob.vel.set(0, 0, 0);
    // Look around during lunch
    if (Math.random() < dt * 0.5) {
      mob.yaw += (Math.random() - 0.5) * 1.2;
    }
  }
}

function _handleGathering(mob, dt) {
  mob.state = 'gather';
  mob.isSleeping = false;

  if (mob.pos.distanceTo(mob.wellPos) > 2.5) {
    _steerTo(mob, mob.wellPos, MOVE_SPEED_NORMAL);
  } else {
    // Socialise at the well: look at other villagers or random directions
    mob.vel.set(0, 0, 0);
    if (Math.random() < dt * 0.8) {
      mob.yaw += (Math.random() - 0.5) * 1.8;
    }
  }
}

function _runPanicMovement(mob, dt) {
  mob.panicTimer -= dt;
  if (!mob.panicThreatPos) {
    mob.vel.set(0, 0, 0);
    return;
  }

  // Sprint away from threat toward home
  const fleeDx = mob.pos.x - mob.panicThreatPos.x;
  const fleeDz = mob.pos.z - mob.panicThreatPos.z;
  const fleeDist = Math.hypot(fleeDx, fleeDz);

  if (fleeDist > 0.1) {
    // Blend: 70% away from threat, 30% toward home
    const normFleeDx = fleeDx / fleeDist;
    const normFleeDz = fleeDz / fleeDist;
    const homeDx = mob.homePos ? mob.homePos.x - mob.pos.x : 0;
    const homeDz = mob.homePos ? mob.homePos.z - mob.pos.z : 0;
    const homeDist = Math.hypot(homeDx, homeDz) || 1;
    const bx = normFleeDx * 0.7 + (homeDx / homeDist) * 0.3;
    const bz = normFleeDz * 0.7 + (homeDz / homeDist) * 0.3;
    mob.yaw = Math.atan2(-bx, -bz);
  }

  mob.vel.x = -Math.sin(mob.yaw) * MOVE_SPEED_PANIC;
  mob.vel.z = -Math.cos(mob.yaw) * MOVE_SPEED_PANIC;

  // Once panic expires, head home and barricade
  if (mob.panicTimer <= 0) {
    mob.state = 'sleep'; // hide indoors
    mob.panicThreatPos = null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared steering utility
// ──────────────────────────────────────────────────────────────────────────────

function _steerTo(mob, targetPos, speed) {
  if (!targetPos || targetPos.x === undefined) return;
  const dx = targetPos.x - mob.pos.x;
  const dz = targetPos.z - mob.pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.25) {
    mob.vel.x = 0;
    mob.vel.z = 0;
    return;
  }
  mob.yaw = Math.atan2(-dx, -dz); // face travel direction (-Z convention)
  mob.vel.x = -Math.sin(mob.yaw) * speed;
  mob.vel.z = -Math.cos(mob.yaw) * speed;
}
