// ---- Villager Mob 3D Mesh Builder & State Registry ------------------------
import * as THREE from 'three';

export const VILLAGER_PROFESSIONS = {
  farmer:     { name: 'Farmer',     robeColor: 0x8a6a3a, hatColor: 0xd8c060 }, // Brown robe, straw hat
  blacksmith: { name: 'Blacksmith', robeColor: 0x3a3a3a, hatColor: 0x5a5a5a }, // Dark apron
  librarian:  { name: 'Librarian',  robeColor: 0xf0f0f0, hatColor: 0xe0e0e0 }, // White robe
  cleric:     { name: 'Cleric',     robeColor: 0x8a3a8a, hatColor: 0xaa4aaa }, // Purple robe
  unemployed: { name: 'Villager',   robeColor: 0x6a4f34, hatColor: 0x5a4f34 }  // Brown plain robe
};

/**
 * Constructs an authentic 3D Three.js Villager Mesh.
 * Faces -Z (same convention as all other mobs in this engine).
 * Features: big nose, crossed arms, profession-coloured robe, optional hat.
 */
export function createVillagerMesh(profession = 'unemployed') {
  const pDef = VILLAGER_PROFESSIONS[profession] || VILLAGER_PROFESSIONS.unemployed;
  const group = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: 0xc89d7c });
  const robeMat = new THREE.MeshLambertMaterial({ color: pDef.robeColor });
  const hatMat  = new THREE.MeshLambertMaterial({ color: pDef.hatColor });
  const eyeMat  = new THREE.MeshBasicMaterial({ color: 0x336633 });

  // ── Head (positioned at y=1.35, centred) ──
  const headGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 1.35, 0);
  group.add(headMesh);

  // ── Iconic large nose — protrudes forward (-Z direction) ──
  const noseGeo = new THREE.BoxGeometry(0.14, 0.26, 0.22);
  const noseMesh = new THREE.Mesh(noseGeo, skinMat);
  // Mount on head: forward face is -z relative to head
  noseMesh.position.set(0, -0.04, -0.3);
  headMesh.add(noseMesh);

  // ── Green eyes — on the -Z face of the head ──
  const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.02);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.13, 0.08, -0.26);
  headMesh.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.13, 0.08, -0.26);
  headMesh.add(rightEye);

  // ── Farmer straw hat ──
  if (profession === 'farmer') {
    const hatRimGeo = new THREE.BoxGeometry(0.82, 0.06, 0.82);
    const hatRim = new THREE.Mesh(hatRimGeo, hatMat);
    hatRim.position.set(0, 0.34, 0);
    headMesh.add(hatRim);
    const hatTopGeo = new THREE.BoxGeometry(0.5, 0.18, 0.5);
    const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
    hatTop.position.set(0, 0.44, 0);
    headMesh.add(hatTop);
  }

  // ── Librarian tall hat ──
  if (profession === 'librarian') {
    const libHatGeo = new THREE.BoxGeometry(0.42, 0.36, 0.42);
    const libHat = new THREE.Mesh(libHatGeo, hatMat);
    libHat.position.set(0, 0.46, 0);
    headMesh.add(libHat);
  }

  // ── Robe torso ──
  const torsoGeo = new THREE.BoxGeometry(0.6, 0.82, 0.44);
  const torsoMesh = new THREE.Mesh(torsoGeo, robeMat);
  torsoMesh.position.set(0, 0.65, 0);
  group.add(torsoMesh);

  // ── Iconic crossed arms — a horizontal bar in front of the torso ──
  const armGroup = new THREE.Group();
  armGroup.position.set(0, 0.65, -0.18); // -z = forward face of torso
  const armCrossGeo = new THREE.BoxGeometry(0.72, 0.24, 0.26);
  const armCrossMesh = new THREE.Mesh(armCrossGeo, robeMat);
  armGroup.add(armCrossMesh);
  // Visible hands peeking out of sleeves
  const handGeo = new THREE.BoxGeometry(0.22, 0.18, 0.20);
  const handMesh = new THREE.Mesh(handGeo, skinMat);
  handMesh.position.set(0, 0, -0.04);
  armGroup.add(handMesh);
  group.add(armGroup);

  // ── Robe skirt (legs hidden under robe) ──
  const legGeo = new THREE.BoxGeometry(0.5, 0.58, 0.38);
  const legMesh = new THREE.Mesh(legGeo, robeMat);
  legMesh.position.set(0, 0.25, 0);
  group.add(legMesh);

  // Expose references for animation
  group.userData.head = headMesh;
  group.userData.arms = armGroup;
  group.userData.legs = legMesh;

  return group;
}

/**
 * Initializes a new Villager mob state object with all AI fields
 */
export function createVillagerState(x, y, z, profession = 'unemployed',
                                    homeX, homeY, homeZ,
                                    workX, workY, workZ,
                                    wellX, wellY, wellZ) {
  const hx = homeX !== undefined ? homeX : x;
  const hy = homeY !== undefined ? homeY : y;
  const hz = homeZ !== undefined ? homeZ : z;
  const wx = workX !== undefined ? workX : x + 4;
  const wy = workY !== undefined ? workY : y;
  const wz = workZ !== undefined ? workZ : z + 4;
  const ex = wellX !== undefined ? wellX : x;
  const ey = wellY !== undefined ? wellY : y;
  const ez = wellZ !== undefined ? wellZ : z;

  return {
    type: 'villager',
    profession,
    hp: 20,
    maxHp: 20,
    dead: false,
    pos: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3(0, 0, 0),
    yaw: Math.random() * Math.PI * 2,
    pitch: 0,

    // Position anchors
    homePos:      new THREE.Vector3(hx, hy, hz),
    workplacePos: new THREE.Vector3(wx, wy, wz),
    wellPos:      new THREE.Vector3(ex, ey, ez),

    // Circadian schedule
    state: 'work',         // 'work' | 'lunch' | 'gather' | 'sleep' | 'panic'
    isSleeping: false,
    panicTimer: 0,
    panicThreatPos: null,

    // Action sub-states for profession routines
    actionState: 'idle',   // 'idle' | 'walk_to_crop' | 'harvesting' | 'walk_to_anvil' | ...
    actionTimer: 0,
    actionTarget: null,    // THREE.Vector3 target for current action

    // Anti-stuck helpers
    stuckTimer: 0,
    lastPos: new THREE.Vector3(x, y, z),

    // Social & player interaction
    lookAtPlayer: false,
    reputation: 0,         // +ve = friendly, -ve = wary
    emoteTimer: 0,         // countdown before next emote display

    // Lunch/bread sharing
    breadShareTimer: 0 + Math.random() * 20,

    // Inventory
    inventory: [{ id: 135, count: 4 }], // 4 Bread by default
  };
}
