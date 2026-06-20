
import { useState, useEffect, useRef, useCallback, useMemo, memo, Suspense } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence, useInView } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, MeshReflectorMaterial, ContactShadows, Sphere, Box, Torus, Cylinder, useGLTF, Text, Html } from "@react-three/drei";
import { clone as cloneScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
const useWindowWidth = () => {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --c-bg: #020408;
      --c-bg2: #060d14;
      --c-surface: rgba(255,255,255,0.03);
      --c-border: rgba(255,255,255,0.07);
      --c-border-bright: rgba(100,180,255,0.25);
      --c-blue: #3B8BEB;
      --c-blue-bright: #5BA3F5;
      --c-cyan: #00D4FF;
      --c-gold: #C8943A;
      --c-gold-bright: #E8B55A;
      --c-text: #E8EDF2;
      --c-text-muted: rgba(232,237,242,0.45);
      --c-text-dim: rgba(232,237,242,0.2);
      --c-scan: rgba(0,212,255,0.6);
      --font-display: 'Bebas Neue', sans-serif;
      --font-body: 'Rajdhani', sans-serif;
      --font-mono: 'Share Tech Mono', monospace;
    }

    html { scroll-behavior: smooth; overflow-x: hidden; }
    body {
      background: var(--c-bg);
      color: var(--c-text);
      font-family: var(--font-body);
      overflow-x: hidden;
    }
    @media (pointer: fine) {
      body { cursor: crosshair; }
    }

    ::selection { background: rgba(59,139,235,0.3); color: #fff; }

    ::-webkit-scrollbar { width: 2px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: var(--c-blue); }

    .hero-headline {
      font-family: var(--font-display);
      font-size: clamp(3.5rem, 10vw, 9rem);
      letter-spacing: 0.05em;
      line-height: 0.9;
      color: #fff;
    }

    .section-label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--c-cyan);
    }

    .scene-number {
      font-family: var(--font-display);
      font-size: 6rem;
      color: rgba(255,255,255,0.04);
      line-height: 1;
      position: absolute;
      right: 0;
      top: -1rem;
    }

    .glass {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid var(--c-border);
    }

    .glass-blue {
      background: rgba(59,139,235,0.06);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(59,139,235,0.15);
    }

    .btn-primary {
      font-family: var(--font-body);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 0.9rem 2.5rem;
      background: linear-gradient(135deg, var(--c-blue) 0%, #1A5FC2 100%);
      border: none;
      color: #fff;
      cursor: pointer;
      clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .btn-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .btn-primary:hover::before { opacity: 1; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(59,139,235,0.4); }

    .btn-ghost {
      font-family: var(--font-body);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 0.9rem 2.5rem;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: var(--c-text);
      cursor: pointer;
      clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
      transition: all 0.3s ease;
    }
    .btn-ghost:hover {
      border-color: var(--c-blue);
      color: var(--c-blue-bright);
      box-shadow: 0 0 20px rgba(59,139,235,0.15);
    }

    .noise-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    @keyframes scanline {
      0% { top: -2px; }
      100% { top: 100%; }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
    @keyframes grid-shift {
      0% { transform: translateY(0); }
      100% { transform: translateY(60px); }
    }
    @keyframes float-particle {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
      50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes data-stream {
      0% { transform: translateY(-100%); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(100%); opacity: 0; }
    }
    @keyframes rotate-ring {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes counter-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    /* ─── MOBILE RESPONSIVE ──────────────────────────────────────── */
    @media (max-width: 767px) {
      .hero-headline {
        font-size: clamp(2.8rem, 14vw, 4.5rem);
      }
      .section-label {
        font-size: 0.6rem;
        letter-spacing: 0.15em;
      }
      .scene-number {
        font-size: 3.5rem;
      }
      .btn-primary, .btn-ghost {
        min-height: 44px;
        padding: 0.75rem 1.4rem;
        font-size: 0.8rem;
        letter-spacing: 0.12em;
      }
    }

    @media (max-width: 479px) {
      .hero-headline {
        font-size: clamp(2.4rem, 15vw, 3.8rem);
      }
      .btn-primary, .btn-ghost {
        width: 100%;
        justify-content: center;
      }
    }

    /* ─── TOUCH FRIENDLY ─────────────────────────────────────────── */
    @media (hover: none) {
      .btn-primary:active { transform: scale(0.97); opacity: 0.85; }
      .btn-ghost:active { opacity: 0.7; }
    }
  `}</style>
);

// ─── PARTICLE FIELD ───────────────────────────────────────────────────────────
const ParticleField = () => {
  const width = useWindowWidth();
  const isMobile = width < 768;
  // Mobile: 8 particles, transform-only animation (no opacity — opacity forces repaints on Android)
  // Desktop: 40 particles with full animation
  const count = isMobile ? 8 : 40;
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 6,
  })), [count]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            opacity: isMobile ? 0.4 : undefined,
            background: p.id % 3 === 0 ? "var(--c-cyan)" : p.id % 3 === 1 ? "var(--c-blue)" : "rgba(255,255,255,0.4)",
            willChange: "transform",
          }}
          animate={isMobile
            ? { y: [0, -20, 0] }
            : { y: [0, -30, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.5, 1] }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ─── GRID BACKGROUND ──────────────────────────────────────────────────────────
const GridBackground = ({ opacity = 1 }) => (
  <div style={{
    position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity
  }}>
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: `
        linear-gradient(rgba(59,139,235,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,139,235,0.06) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
    }} />
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      background: "radial-gradient(ellipse 70% 50% at 50% 50%, transparent 0%, var(--c-bg) 100%)"
    }} />
  </div>
);

// ─── HERO VEHICLE DATA ────────────────────────────────────────────────────────
useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

const HERO_SUPRA = {
  url: "/models/car-supra.glb",
  name: "Toyota Supra MK4",
  specs: { Engine: "3.0L 2JZ-GTE Twin-Turbo I6", Power: "320 hp", "Top Speed": "250 km/h", "0–100": "5.1 s" },
  damage: [
    { label: "Dent", confidence: "0.91", severity: "HIGH", estimate: "~$380" },
    { label: "Scratch", confidence: "0.74", severity: "MED", estimate: "~$120" },
    { label: "Paint Damage", confidence: "0.67", severity: "LOW", estimate: "~$95" },
    { label: "Bumper Scuff", confidence: "0.79", severity: "MED", estimate: "~$160" },
  ],
  components: [
    { label: "Front Bumper", desc: "Minor scuffs detected" },
    { label: "Driver Door", desc: "Dent · 0.91 confidence" },
    { label: "Hood", desc: "Paint oxidation detected" },
    { label: "Rear Fender", desc: "Scratch · 0.74 confidence" },
  ],
};
useGLTF.preload(HERO_SUPRA.url);

// Parked set-dressing cars for the two empty bays at the back of the garage
const PARKED_LANCIA = "/models/car-lancia.glb";
const PARKED_GT40   = "/models/car-ford-gt40.glb";
useGLTF.preload(PARKED_LANCIA);
useGLTF.preload(PARKED_GT40);

// ─── HERO VEHICLE ─────────────────────────────────────────────────────────────
// Car drives LEFT → RIGHT (+X axis). outerRef moves X. innerRef animates body.
// Car is wrapped in a -90° Y rotation so its front faces +X (direction of travel).
const PARK_Z  = -9;   // fixed garage depth
const PARK_X  =  1.5; // final X after driving in
const START_X = -12;  // off-screen left
const WHEEL_R =  0.32; // wheel radius at 1.61m car height scale

// Severity → colour mapping used by callout cards
const SEV_COLOR = { HIGH: "#ff6b6b", MED: "#c8943a", LOW: "#6bcfff" };

// World-space anchor points on the parked car (PARK_X=1.5, PARK_Z=-9)
// Car faces +X after rotation: length along X, width along Z, height along Y
const DAMAGE_ANCHORS = [
  [PARK_X + 0.30,  1.80,  PARK_Z + 0.95],  // driver door  (Dent)         — mid-high
  [PARK_X - 1.55,  0.10,  PARK_Z + 0.95],  // rear fender  (Scratch)      — near ground
  [PARK_X + 1.90,  1.45,  PARK_Z + 0.50],  // hood         (Paint Damage)  — mid height
  [PARK_X + 2.60,  1.20,  PARK_Z + 0.55],  // front bumper (Bumper Scuff)  — front mid
];
// Mobile anchors: all clustered on the near-camera face of the car body, varying Y.
// Portrait phones have ~30° horizontal FOV so the 4.1m X-spread of desktop anchors
// clips off-screen. These all project near the vertical centre of the portrait viewport.
const MOBILE_DAMAGE_ANCHORS = [
  [PARK_X + 0.30,  1.85,  PARK_Z + 1.1],  // high   — door top
  [PARK_X + 0.30,  1.25,  PARK_Z + 1.1],  // mid    — door mid
  [PARK_X + 0.30,  0.75,  PARK_Z + 1.1],  // low    — sill
  [PARK_X + 0.30,  0.25,  PARK_Z + 1.1],  // ground — bumper strip
];
const COMPONENT_ANCHORS = [
  [PARK_X + 2.20,  0.05,  PARK_Z + 0.50],  // front bumper — ground level
  [PARK_X + 0.25,  1.60,  PARK_Z + 1.10],  // driver door  — mid-high
  [PARK_X + 1.25,  2.70,  PARK_Z - 0.10],  // hood         — well above car
  [PARK_X - 1.55,  0.65,  PARK_Z + 0.85],  // rear fender  — low-mid
];

const HeroVehicle = ({ scrollProgressRef, scanProgressRef }) => {
  const { scene } = useGLTF(HERO_SUPRA.url);
  const outerRef    = useRef();
  const innerRef    = useRef();
  const scanBeamRef = useRef();
  const headlightRef = useRef();
  const wheelMeshes = useRef([]);
  const boundsRef   = useRef({ minX: -1.8, maxX: 1.8 });
  const wheelRotRef  = useRef(0);
  const prevXRef     = useRef(START_X);
  const prevDeltaRef = useRef(0);
  const smoothSpeedRef = useRef(0);
  const shadowRef    = useRef();

  const cloned = useMemo(() => {
    const c = cloneScene(scene);
    const box = new THREE.Box3().setFromObject(c);
    const rawSize = box.getSize(new THREE.Vector3());
    const autoS = rawSize.y > 0.001 ? 1.61 / rawSize.y : 1;
    c.scale.setScalar(autoS);
    const box2 = new THREE.Box3().setFromObject(c);
    const center = box2.getCenter(new THREE.Vector3());
    const size2  = box2.getSize(new THREE.Vector3());
    c.position.set(-center.x, -center.y + size2.y / 2, -center.z);
    // Facing group is +π/2 Y rotation. Local Z = car's length direction = world X (left→right).
    // Sweep scan beam along local Z (length). Local X = car's width (covers beam cross-section).
    boundsRef.current = {
      minX: -size2.x / 2, maxX: size2.x / 2,   // car width (beam cross-section)
      minZ: -size2.z / 2, maxZ: size2.z / 2,    // car length (sweep axis)
    };

    wheelMeshes.current = [];
    c.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = obj.material.clone();
      obj.material.envMapIntensity = 2.2;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const n = obj.name.toLowerCase();
      if (n.includes("wheel") || n.includes("tire") || n.includes("tyre")) {
        wheelMeshes.current.push(obj);
      }
    });
    if (wheelMeshes.current.length === 0) {
      c.traverse((obj) => {
        if (!obj.isMesh) return;
        const wp = new THREE.Vector3();
        obj.getWorldPosition(wp);
        const bs = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
        if (wp.y < 0.38 && Math.abs(wp.x) > size2.x * 0.18 &&
            bs.x > 0.04 && Math.abs(bs.x - bs.z) < bs.x * 0.7) {
          wheelMeshes.current.push(obj);
        }
      });
    }

    return c;
  }, [scene]);

  useFrame((state) => {
    if (!outerRef.current || !innerRef.current) return;
    const p  = scrollProgressRef.current;
    const sp = scanProgressRef.current;
    const scanning = sp > 0.01 && sp < 0.99;
    const parked   = p >= 0.45;

    // ── DRIVING POSITION (X axis) ─────────────────────────────────────────────
    const driveT = Math.min(1, p / 0.45);
    const easedT = driveT < 0.5
      ? 4 * driveT * driveT * driveT
      : 1 - Math.pow(-2 * driveT + 2, 3) / 2;
    const targetX = THREE.MathUtils.lerp(START_X, PARK_X, easedT);
    outerRef.current.position.x = THREE.MathUtils.lerp(outerRef.current.position.x, targetX, 0.05);

    // ── WHEEL ROTATION (car moves in X, wheels rotate around local Z of car) ──
    const deltaX = outerRef.current.position.x - prevXRef.current;
    prevXRef.current = outerRef.current.position.x;
    if (wheelMeshes.current.length > 0 && Math.abs(deltaX) > 0.00005) {
      wheelRotRef.current += deltaX / WHEEL_R;
      for (const w of wheelMeshes.current) w.rotation.x = wheelRotRef.current;
    }

    // ── SUSPENSION BOB + BODY PITCH ───────────────────────────────────────────
    smoothSpeedRef.current = THREE.MathUtils.lerp(smoothSpeedRef.current, Math.abs(deltaX), 0.08);
    const accel = deltaX - prevDeltaRef.current;
    prevDeltaRef.current = deltaX;

    const bobAmp = !parked ? Math.min(0.008, smoothSpeedRef.current * 4) : 0;
    const bobTarget = Math.sin(state.clock.elapsedTime * 5 * Math.PI * 2) * bobAmp;
    outerRef.current.position.y = THREE.MathUtils.lerp(outerRef.current.position.y, bobTarget, 0.06);

    if (shadowRef.current) {
      shadowRef.current.position.y = 0.009 - outerRef.current.position.y;
    }

    // Car faces +X: pitch (nose dip on braking) is rotation around world Z
    const targetPitch = !parked ? THREE.MathUtils.clamp(accel * 5, -0.04, 0.04) : 0;
    innerRef.current.rotation.z = THREE.MathUtils.lerp(innerRef.current.rotation.z, targetPitch, 0.07);

    // ── HEADLIGHT GLOW ────────────────────────────────────────────────────────
    if (headlightRef.current) {
      headlightRef.current.intensity = THREE.MathUtils.lerp(
        headlightRef.current.intensity, parked ? 0 : 5, 0.07
      );
    }

    // ── IDLE YAW ─────────────────────────────────────────────────────────────
    const yawTarget = (parked && !scanning)
      ? Math.sin(state.clock.elapsedTime * 0.18) * 0.10
      : 0;
    innerRef.current.rotation.y = THREE.MathUtils.lerp(innerRef.current.rotation.y, yawTarget, 0.025);

    // ── SCAN BEAM ─────────────────────────────────────────────────────────────
    if (scanBeamRef.current) {
      scanBeamRef.current.visible = scanning;
      if (scanning) {
        const { minZ, maxZ } = boundsRef.current;
        // Sweep in local Z (car length direction = world X = left→right on screen)
        scanBeamRef.current.position.z = THREE.MathUtils.lerp(minZ - 0.15, maxZ + 0.15, sp);
      }
    }
  });

  return (
    <group ref={outerRef} position={[START_X, 0, PARK_Z]}>
      <group ref={innerRef}>
        {/* Facing group: +π/2 flips car so front faces +X (right) */}
        <group rotation={[0, Math.PI / 2, 0]}>
          <primitive object={cloned} />
          {/* Scan beam: thin in Z (sweep axis = car length), wide in X (car width) */}
          <mesh ref={scanBeamRef} position={[0, 0.75, 0]} visible={false}>
            <boxGeometry args={[2.4, 1.9, 0.022]} />
            <meshStandardMaterial color="#4a9eff" emissive="#4a9eff" emissiveIntensity={0.55} transparent opacity={0.48} />
          </mesh>
        </group>
        {/* Headlight ahead of car's front (+X direction in outerRef/innerRef space) */}
        <pointLight ref={headlightRef} position={[3.5, 0.5, 0]} color="#fffaee" intensity={0} distance={12} decay={2} />
      </group>
      {/* Shadow: X = car length in world (front-to-back), Z = car width */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
        <planeGeometry args={[5.5, 2.4]} />
        <meshBasicMaterial color="#000" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ─── PARKED CAR (static set dressing) ─────────────────────────────────────────
// Loads a GLB, auto-scales to a realistic height and grounds it (bottom at y=0).
// Default GLB front faces +Z; rotationY rotates from there.
// position = [x, z] on the floor. Sits perfectly inside a 2.9×5.5 bay marking.
const ParkedCar = ({ url, position, rotationY = 0, targetHeight = 1.35 }) => {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const c = cloneScene(scene);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const s = size.y > 0.001 ? targetHeight / size.y : 1;
    c.scale.setScalar(s);
    // Re-measure and recentre so the car is grounded (bottom face at y=0)
    const box2 = new THREE.Box3().setFromObject(c);
    const center = box2.getCenter(new THREE.Vector3());
    const size2 = box2.getSize(new THREE.Vector3());
    c.position.set(-center.x, -center.y + size2.y / 2, -center.z);
    c.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.envMapIntensity = 1.5;
      o.castShadow = true;
      o.receiveShadow = true;
    });
    return c;
  }, [scene, targetHeight]);

  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} />
      {/* Contact shadow — length (5) runs along the bay's Z axis, width (2.3) along X */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <planeGeometry args={[2.3, 5]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ─── GARAGE ENVIRONMENT ───────────────────────────────────────────────────────
const GarageEnvironment = memo(() => {
  const W = 11, H = 5.2, L = 38;
  const colZs = [-3, -9, -15, -21, -27];

  return (
    <>
      {/* ── FLOOR — dark matte concrete, no reflection ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -L / 2 + 5]} receiveShadow>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#1c1e22" roughness={0.88} metalness={0.04} />
      </mesh>

      {/* Bay outline markings — depthWrite=false prevents floor z-fight */}
      {[[-3.5, -15], [3.5, -15]].map(([cx, cz], bi) => (
        <group key={bi} position={[cx, 0.007, cz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.45, 0, 0]}>
            <planeGeometry args={[0.055, 5.5]} />
            <meshStandardMaterial color="#ccc9c2" roughness={0.9} metalness={0} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.45, 0, 0]}>
            <planeGeometry args={[0.055, 5.5]} />
            <meshStandardMaterial color="#ccc9c2" roughness={0.9} metalness={0} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2.6]}>
            <planeGeometry args={[2.9, 0.14]} />
            <meshStandardMaterial color="#d4d1ca" roughness={0.9} metalness={0} transparent opacity={0.85} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* Center aisle dashes — depthWrite=false */}
      {[-1.5, -5, -8.5, -12, -15.5, -19.5].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, z]}>
          <planeGeometry args={[0.07, 1.4]} />
          <meshStandardMaterial color="#b4b0a8" roughness={0.9} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}

      {/* Safety bollards — yellow, at bay corners */}
      {[[-1.3, -6.2], [1.3, -6.2], [-1.3, -11.8], [1.3, -11.8],
        [-1.3, -14.2], [1.3, -14.2], [-1.3, -19.8], [1.3, -19.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} castShadow>
          <cylinderGeometry args={[0.075, 0.09, 0.44, 8]} />
          <meshStandardMaterial color="#e0bc38" roughness={0.45} metalness={0.1} />
        </mesh>
      ))}

      {/* ── CENTER STAGE — AI inspection platform ── */}
      {/* Group sits at world y=0 (floor). All meshes raised so nothing clips floor. */}
      <group position={[1.5, 0, -9]}>
        {/* Platform disc — bottom at y=0.015, safely above floor */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[3.4, 3.4, 0.05, 40]} />
          <meshStandardMaterial color="#14161c" roughness={0.25} metalness={0.8} />
        </mesh>
        {/* Outer glow ring */}
        <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.4, 0.055, 8, 72]} />
          <meshStandardMaterial color="#e8e4dc" emissive="#e8e4dc" emissiveIntensity={0.35} />
        </mesh>
        {/* Mid ring */}
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.028, 6, 64]} />
          <meshStandardMaterial color="#e8e4dc" emissive="#e8e4dc" emissiveIntensity={0.18} />
        </mesh>
        {/* Inner ring */}
        <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.018, 6, 48]} />
          <meshStandardMaterial color="#e8e4dc" emissive="#e8e4dc" emissiveIntensity={0.12} />
        </mesh>
        {/* Scan grid */}
        {[-1.8, -0.9, 0, 0.9, 1.8].map((z, i) => (
          <mesh key={`gx-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.075, z]}>
            <planeGeometry args={[6.4, 0.008]} />
            <meshStandardMaterial color="#e8e4dc" emissive="#e8e4dc" emissiveIntensity={0.18} transparent opacity={0.2} depthWrite={false} />
          </mesh>
        ))}
        {[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map((x, i) => (
          <mesh key={`gz-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.075, 0]}>
            <planeGeometry args={[0.008, 3.6]} />
            <meshStandardMaterial color="#e8e4dc" emissive="#e8e4dc" emissiveIntensity={0.18} transparent opacity={0.2} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* ── STRUCTURAL STEEL COLUMNS — y=H/2+0.005 lifts bottom face off y=0 ── */}
      {colZs.map((z, i) =>
        [-W / 2, W / 2].map((x, j) => {
          if (i === 1 && j === 0) return null;
          return (
            <mesh key={`col-${i}-${j}`} position={[x, H / 2 + 0.005, z]} castShadow>
              <boxGeometry args={[0.22, H, 0.22]} />
              <meshStandardMaterial color="#2c3038" roughness={0.22} metalness={0.88} />
            </mesh>
          );
        })
      )}

      {/* ── CEILING STRUCTURE ── */}
      {colZs.slice(0, -1).map((z, i) => (
        <mesh key={`deck-${i}`} position={[0, H + 0.03, z + 3]}>
          <boxGeometry args={[W - 0.3, 0.06, 5.8]} />
          <meshStandardMaterial color="#1a1d22" roughness={0.75} metalness={0.08} />
        </mesh>
      ))}

      {/* Steel I-beam cross-trusses */}
      {colZs.map((z, i) => (
        <group key={`truss-${i}`}>
          <mesh position={[0, H + 0.06, z]}>
            <boxGeometry args={[W, 0.07, 0.3]} />
            <meshStandardMaterial color="#28303a" roughness={0.25} metalness={0.88} />
          </mesh>
          <mesh position={[0, H - 0.1, z]}>
            <boxGeometry args={[W, 0.24, 0.09]} />
            <meshStandardMaterial color="#232930" roughness={0.28} metalness={0.85} />
          </mesh>
          <mesh position={[0, H - 0.22, z]}>
            <boxGeometry args={[W, 0.07, 0.3]} />
            <meshStandardMaterial color="#28303a" roughness={0.25} metalness={0.88} />
          </mesh>
        </group>
      ))}

      {/* Longitudinal ceiling purlins */}
      {[-W / 2 + 0.4, -2.2, 0, 2.2, W / 2 - 0.4].map((x, i) => (
        <mesh key={`purlin-${i}`} position={[x, H - 0.07, -L / 2 + 5]}>
          <boxGeometry args={[0.09, 0.09, L]} />
          <meshStandardMaterial color="#30363d" roughness={0.32} metalness={0.84} />
        </mesh>
      ))}

      {/* Side LED strip fixtures — warm white */}
      {colZs.slice(0, -1).map((z, i) => (
        <group key={`led-${i}`}>
          <mesh position={[-2.2, H - 0.022, z + 3]}>
            <boxGeometry args={[0.1, 0.025, 5.5]} />
            <meshStandardMaterial color="#faf5ed" emissive="#faf5ed" emissiveIntensity={0.48} roughness={0.85} />
          </mesh>
          <mesh position={[2.2, H - 0.022, z + 3]}>
            <boxGeometry args={[0.1, 0.025, 5.5]} />
            <meshStandardMaterial color="#faf5ed" emissive="#faf5ed" emissiveIntensity={0.48} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Cyan guide strips — center ceiling, guiding eye toward inspection bay */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={`cguide-${i}`} position={[x, H - 0.026, -6]}>
          <boxGeometry args={[0.055, 0.018, 10]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.85} roughness={0.9} />
        </mesh>
      ))}

      {/* Track spot lights above inspection bay */}
      {[[-1.2, -9], [0.3, -9], [1.8, -9], [3.0, -9]].map(([x, z], i) => (
        <group key={`track-${i}`} position={[x, H - 0.07, z]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.06, 0.16, 8]} />
            <meshStandardMaterial color="#1c2028" roughness={0.3} metalness={0.85} />
          </mesh>
          <mesh position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 8]} />
            <meshStandardMaterial color="#e8e4dc" emissive="#faf5ed" emissiveIntensity={0.55} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── WALLS ── */}
      {/* Lower walls raised +0.005 so bottom face sits at y=0.005, never touching floor */}
      <mesh position={[-(W / 2) - 0.08, H * 0.275 + 0.005, -1.125]}>
        <boxGeometry args={[0.2, H * 0.55, 12.25]} />
        <meshStandardMaterial color="#1e2228" roughness={0.88} metalness={0.06} />
      </mesh>
      <mesh position={[-(W / 2) - 0.08, H * 0.275 + 0.005, -21.875]}>
        <boxGeometry args={[0.2, H * 0.55, 22.25]} />
        <meshStandardMaterial color="#1e2228" roughness={0.88} metalness={0.06} />
      </mesh>
      {/* Left upper wall */}
      <mesh position={[-(W / 2) - 0.06, H * 0.775, -L / 2 + 5]}>
        <boxGeometry args={[0.12, H * 0.45, L]} />
        <meshStandardMaterial color="#262a32" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* ── ENTRY GATE ── left wall, centred at z=-9 ── */}
      {/* Gate posts — group y=0.005 keeps all bottom faces off y=0 */}
      {[-7.1, -10.9].map((gz, gi) => (
        <group key={`gpost-${gi}`} position={[-(W / 2) - 0.05, 0.005, gz]}>
          {/* Main H-section post */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[0.28, 2.4, 0.22]} />
            <meshStandardMaterial color="#1a2030" roughness={0.25} metalness={0.92} />
          </mesh>
          {/* Vertical door track channel */}
          <mesh position={[0.02, 1.2, 0]}>
            <boxGeometry args={[0.06, 2.55, 0.08]} />
            <meshStandardMaterial color="#0e1420" roughness={0.3} metalness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Overhead lintel beam */}
      <mesh position={[-(W / 2) - 0.05, 2.52, -9]} castShadow>
        <boxGeometry args={[0.26, 0.26, 4.0]} />
        <meshStandardMaterial color="#1a2030" roughness={0.25} metalness={0.92} />
      </mesh>
      <mesh position={[-(W / 2) - 0.08, 2.76, -9]}>
        <boxGeometry args={[0.2, 0.22, 3.6]} />
        <meshStandardMaterial color="#1e2228" roughness={0.88} metalness={0.06} />
      </mesh>
      {/* Raised roll-up door — 4 horizontal panels retracted above lintel */}
      {[0, 0.38, 0.76, 1.14].map((dy, di) => (
        <mesh key={`door-${di}`} position={[-(W / 2) - 0.04, 2.85 + dy, -9]}>
          <boxGeometry args={[0.14, 0.36, 3.5]} />
          <meshStandardMaterial color={di % 2 === 0 ? "#4a5260" : "#424858"} roughness={0.55} metalness={0.62} />
        </mesh>
      ))}
      {/* Door rib lines */}
      {[2.82, 3.20, 3.58, 3.96].map((ry, ri) => (
        <mesh key={`rib-${ri}`} position={[-(W / 2) + 0.03, ry, -9]}>
          <boxGeometry args={[0.018, 0.018, 3.52]} />
          <meshStandardMaterial color="#2a3040" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
      {/* Amber warning light at gate top */}
      <mesh position={[-(W / 2) - 0.0, 2.44, -9]}>
        <boxGeometry args={[0.1, 0.1, 0.08]} />
        <meshStandardMaterial color="#f5a623" emissive="#f5a623" emissiveIntensity={0.6} roughness={0.5} />
      </mesh>

      {/* Right wall — raised +0.005 so bottom face clears y=0 */}
      <mesh position={[W / 2 + 0.08, H * 0.275 + 0.005, -L / 2 + 5]}>
        <boxGeometry args={[0.2, H * 0.55, L]} />
        <meshStandardMaterial color="#1e2228" roughness={0.88} metalness={0.06} />
      </mesh>
      <mesh position={[W / 2 + 0.06, H * 0.775, -L / 2 + 5]}>
        <boxGeometry args={[0.12, H * 0.45, L]} />
        <meshStandardMaterial color="#262a32" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Baseboards — raised to y=0.105 so bottom face is at y=0.005, not y=0 */}
      <mesh position={[W / 2, 0.105, -L / 2 + 5]}>
        <boxGeometry args={[0.14, 0.2, L]} />
        <meshStandardMaterial color="#16191e" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[-W / 2, 0.105, -1.125]}>
        <boxGeometry args={[0.14, 0.2, 12.25]} />
        <meshStandardMaterial color="#16191e" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[-W / 2, 0.105, -21.875]}>
        <boxGeometry args={[0.14, 0.2, 22.25]} />
        <meshStandardMaterial color="#16191e" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Glass panels — upper section between columns */}
      {colZs.slice(0, -1).map((z, i) =>
        [-(W / 2) + 0.07, W / 2 - 0.07].map((x, j) => (
          <mesh key={`glass-${i}-${j}`} position={[x, H * 0.76, z + 3]}>
            <boxGeometry args={[0.045, H * 0.43, 5.4]} />
            <meshStandardMaterial color="#b8cdd8" transparent opacity={0.18} roughness={0} metalness={0.05} />
          </mesh>
        ))
      )}

      {/* Back wall — raised 0.005 so bottom face clears y=0 */}
      <mesh position={[0, H / 2 + 0.005, -L + 5]}>
        <boxGeometry args={[W + 0.4, H, 0.22]} />
        <meshStandardMaterial color="#181a1e" roughness={0.88} metalness={0.05} />
      </mesh>

      {/* ── PROPS ── */}

      {/* Tool cabinet — right side, between front & rear bays */}
      <group position={[W / 2 - 0.52, 0.005, -13]}>
        <mesh position={[0, 0.49, 0]} castShadow>
          <boxGeometry args={[0.62, 0.98, 0.46]} />
          <meshStandardMaterial color="#b83228" roughness={0.3} metalness={0.62} />
        </mesh>
        {[0.22, 0.06, -0.1, -0.26].map((dy, k) => (
          <mesh key={k} position={[0, 0.49 + dy, 0.235]}>
            <boxGeometry args={[0.32, 0.016, 0.012]} />
            <meshStandardMaterial color="#888" roughness={0.15} metalness={0.95} />
          </mesh>
        ))}
        <mesh position={[0, 0.99, 0]}>
          <boxGeometry args={[0.62, 0.022, 0.46]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.5} />
        </mesh>
        {[[-0.2, -0.14], [0.2, -0.14], [-0.2, 0.14], [0.2, 0.14]].map(([cx, cz], k) => (
          <mesh key={k} position={[cx, 0.05, cz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Inspection monitor on stand — left side */}
      <group position={[-(W / 2) + 0.52, 0.005, -13]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.04, 12]} />
          <meshStandardMaterial color="#242424" roughness={0.45} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.66, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.032, 1.32, 8]} />
          <meshStandardMaterial color="#343434" roughness={0.35} metalness={0.78} />
        </mesh>
        <mesh position={[0, 1.37, 0.04]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.038]} />
          <meshStandardMaterial color="#161616" roughness={0.28} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.37, 0.063]}>
          <boxGeometry args={[0.44, 0.25, 0.007]} />
          <meshStandardMaterial color="#1c2230" roughness={0.08} metalness={0.08} />
        </mesh>
      </group>

      {/* EV charging station — left side, toward rear */}
      <group position={[-(W / 2) + 0.48, 0.005, -21]}>
        <mesh position={[0, 0.78, 0]} castShadow>
          <boxGeometry args={[0.42, 1.56, 0.22]} />
          <meshStandardMaterial color="#edede9" roughness={0.45} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.82, 0.115]}>
          <boxGeometry args={[0.34, 0.46, 0.01]} />
          <meshStandardMaterial color="#e4e2dc" roughness={0.55} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.58, 0.115]}>
          <boxGeometry args={[0.1, 0.1, 0.01]} />
          <meshStandardMaterial color="#404040" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Subtle status LED — green, low emissive */}
        <mesh position={[0.12, 1.14, 0.115]}>
          <boxGeometry args={[0.04, 0.04, 0.008]} />
          <meshStandardMaterial color="#3ddc84" emissive="#3ddc84" emissiveIntensity={0.3} roughness={0.8} />
        </mesh>
      </group>

      {/* ── WALL SIGNAGE ── */}

      {/* BACK WALL — 3-panel LED display
           Frame inner edges: x = ±5.28  (content reaches ±5.0 → 0.28 m margin each side)
                              y = ±2.26  (content reaches ±1.38 → 0.88 m margin each side)
           Housing 10.8 × 4.8 m fills the back wall without touching side walls (W=11 m) */}
      <group position={[0, H * 0.52, -L + 5.18]}>
        {/* Housing */}
        <mesh position={[0, 0, -0.09]}>
          <boxGeometry args={[10.8, 4.8, 0.14]} />
          <meshStandardMaterial color="#08090e" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Screen surface */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[10.4, 4.5, 0.008]} />
          <meshStandardMaterial color="#04060c" emissive="#050a14" emissiveIntensity={0.6} roughness={0.05} metalness={0.1} />
        </mesh>
        {/* Neon bezel — inner edges at x=±5.28, y=±2.26 */}
        <mesh position={[0,  2.32, 0.025]}><boxGeometry args={[10.8, 0.12, 0.05]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.4} /></mesh>
        <mesh position={[0, -2.32, 0.025]}><boxGeometry args={[10.8, 0.12, 0.05]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.4} /></mesh>
        <mesh position={[-5.34, 0, 0.025]}><boxGeometry args={[0.12, 4.8, 0.05]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.4} /></mesh>
        <mesh position={[ 5.34, 0, 0.025]}><boxGeometry args={[0.12, 4.8, 0.05]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.4} /></mesh>
        {/* Panel dividers */}
        <mesh position={[-3.0, 0, 0.02]}><boxGeometry args={[0.012, 4.5, 0.006]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.4} transparent opacity={0.45} /></mesh>
        <mesh position={[ 3.0, 0, 0.02]}><boxGeometry args={[0.012, 4.5, 0.006]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.4} transparent opacity={0.45} /></mesh>

        {/* ── LEFT PANEL  (x=-4.0, content y: +1.3 → -1.0) ── */}
        <group position={[-4.0, 0, 0.04]}>
          <Text position={[0,  1.3, 0]} fontSize={0.14} letterSpacing={0.2}  color="#00d4ff" anchorX="center" anchorY="middle">SCAN STATUS</Text>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[2.0, 0.006, 0.003]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.7} /></mesh>
          <Text position={[0,  0.86, 0]} fontSize={0.26} letterSpacing={0.05} color="#f0ede8" anchorX="center" anchorY="middle">ANALYZING</Text>
          <Text position={[0,  0.56, 0]} fontSize={0.11} letterSpacing={0.1}  color="#4a9eff" anchorX="center" anchorY="middle">VEHICLE · ACTIVE</Text>
          {[["NEURAL SCAN", 0.92], ["DEPTH MAP", 0.78], ["DAMAGE AI", 0.65]].map(([lbl, pct], i) => (
            <group key={i} position={[0, 0.18 - i * 0.42, 0]}>
              <Text position={[-0.9, 0.1, 0]} fontSize={0.095} color="#7a8898" anchorX="left"  anchorY="middle">{lbl}</Text>
              <mesh position={[0.05, -0.08, 0]}><boxGeometry args={[1.9, 0.05, 0.003]} /><meshStandardMaterial color="#0a1420" /></mesh>
              <mesh position={[0.05 - (1.9 * (1 - pct)) / 2, -0.08, 0.002]}>
                <boxGeometry args={[1.9 * pct, 0.05, 0.003]} />
                <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.6} />
              </mesh>
              <Text position={[1.05, -0.08, 0.003]} fontSize={0.1} color="#00d4ff" anchorX="right" anchorY="middle">{`${Math.round(pct * 100)}%`}</Text>
            </group>
          ))}
        </group>

        {/* ── CENTER PANEL  (x=0, content y: +1.3 → -1.0) ── */}
        <group position={[0, 0, 0.04]}>
          <Text position={[0,  1.3,  0]} fontSize={0.38} letterSpacing={0.14} color="#f0ede8" anchorX="center" anchorY="middle">DENT VISION AI</Text>
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[4.6, 0.006, 0.003]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} /></mesh>
          <Text position={[0,  0.76, 0]} fontSize={0.13} letterSpacing={0.18} color="#8aabcc" anchorX="center" anchorY="middle">AI INSPECTION FACILITY</Text>
          <Text position={[0,  0.46, 0]} fontSize={0.11} letterSpacing={0.1}  color="#5a6a7a" anchorX="center" anchorY="middle">DEFECTS DETECTED</Text>
          <Text position={[0,  0.0,  0]} fontSize={0.52} letterSpacing={0.04} color="#ff4a4a" anchorX="center" anchorY="middle">3</Text>
          <Text position={[0, -0.54, 0]} fontSize={0.1}  letterSpacing={0.08} color="#6a7a8a" anchorX="center" anchorY="middle">HIGH · MED · LOW SEVERITY</Text>
        </group>

        {/* ── RIGHT PANEL  (x=+4.0, content y: +1.3 → -1.0) ── */}
        <group position={[4.0, 0, 0.04]}>
          <Text position={[0,  1.3, 0]} fontSize={0.14} letterSpacing={0.2}  color="#00d4ff" anchorX="center" anchorY="middle">CONFIDENCE</Text>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[2.0, 0.006, 0.003]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.7} /></mesh>
          {[["DENT", "0.91", "#ff4a4a"], ["SCRATCH", "0.74", "#ff9a3a"], ["PAINT", "0.67", "#f5d43a"]].map(([lbl, conf, col], i) => (
            <group key={i} position={[0, 0.78 - i * 0.56, 0]}>
              <Text position={[-0.9, 0.1, 0]} fontSize={0.1} color="#7a8898" anchorX="left"  anchorY="middle">{lbl}</Text>
              <Text position={[ 0.9, 0.1, 0]} fontSize={0.1} color={col}      anchorX="right" anchorY="middle">{conf}</Text>
              <mesh position={[0, -0.08, 0]}><boxGeometry args={[1.9, 0.05, 0.003]} /><meshStandardMaterial color="#0a1420" /></mesh>
              <mesh position={[(1.9 * parseFloat(conf) / 2) - 0.95, -0.08, 0.002]}>
                <boxGeometry args={[1.9 * parseFloat(conf), 0.05, 0.003]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} />
              </mesh>
            </group>
          ))}
          <Text position={[0, -0.78, 0]} fontSize={0.34} letterSpacing={0.04} color="#3ddc84" anchorX="center" anchorY="middle">99.2%</Text>
          <Text position={[0, -1.08, 0]} fontSize={0.1}  color="#5a6a7a" anchorX="center" anchorY="middle">OVERALL ACCURACY</Text>
        </group>
      </group>

      {/* LEFT WALL — brand graffiti mural */}
      <group position={[-W / 2 + 0.16, H * 0.54, -15]} rotation={[0, Math.PI / 2, 0]}>
        {/* Large cyan headline */}
        <Text position={[0, 0.9, 0.04]} fontSize={0.88} letterSpacing={0.1} color="#00d4ff" anchorX="center" anchorY="middle">
          SEE BEYOND
        </Text>
        {/* White body text */}
        <Text position={[0, -0.1, 0.04]} fontSize={0.88} letterSpacing={0.1} color="#e8e4dc" anchorX="center" anchorY="middle">
          THE SURFACE
        </Text>
        {/* Cyan rule */}
        <mesh position={[0, -0.7, 0.035]}>
          <boxGeometry args={[5.9, 0.012, 0.007]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.65} />
        </mesh>
        {/* Subtitle */}
        <Text position={[0, -1.04, 0.04]} fontSize={0.25} letterSpacing={0.24} color="#00d4ff" anchorX="center" anchorY="middle">
          AI POWERED DENT DETECTION
        </Text>
        {/* Blueprint crosshair — top right */}
        <group position={[2.7, 1.32, 0.03]}>
          <mesh><boxGeometry args={[0.46, 0.007, 0.005]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.4} transparent opacity={0.55} /></mesh>
          <mesh><boxGeometry args={[0.007, 0.46, 0.005]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.4} transparent opacity={0.55} /></mesh>
          <mesh><torusGeometry args={[0.16, 0.006, 6, 32]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.35} transparent opacity={0.5} /></mesh>
        </group>
        {/* Blueprint crosshair — lower left */}
        <group position={[-2.9, 0.5, 0.03]}>
          <mesh><boxGeometry args={[0.34, 0.006, 0.004]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} transparent opacity={0.4} /></mesh>
          <mesh><boxGeometry args={[0.006, 0.34, 0.004]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} transparent opacity={0.4} /></mesh>
          <mesh><torusGeometry args={[0.12, 0.005, 6, 28]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.25} transparent opacity={0.38} /></mesh>
        </group>
        {/* Scatter annotation dots */}
        {[[-2.5, 1.55], [3.1, 0.28], [-0.4, 1.88], [2.2, -0.62]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.03]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} transparent opacity={0.45} />
          </mesh>
        ))}
      </group>

      {/* RIGHT WALL — workflow mural */}
      <group position={[W / 2 - 0.16, H * 0.52, -14]} rotation={[0, -Math.PI / 2, 0]}>
        <Text position={[0, 1.62, 0.04]} fontSize={0.18} letterSpacing={0.28} color="#00d4ff" anchorX="center" anchorY="middle">
          INSPECTION WORKFLOW
        </Text>
        <mesh position={[0, 1.4, 0.03]}><boxGeometry args={[7.2, 0.008, 0.006]} /><meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.6} /></mesh>
        {[
          { num: "01", label: "UPLOAD", sub: "Images & Docs", color: "#4a9eff" },
          { num: "02", label: "AI SCAN", sub: "Neural Analysis", color: "#00d4ff" },
          { num: "03", label: "DETECT", sub: "Damage Regions", color: "#ff9a3a" },
          { num: "04", label: "REPORT", sub: "Full Summary", color: "#3ddc84" },
          { num: "05", label: "ESTIMATE", sub: "Cost Projection", color: "#f5d43a" },
        ].map(({ num, label, sub, color }, i) => (
          <group key={i} position={[-3.2 + i * 1.62, 0.38, 0.04]}>
            {/* Card background — front face at z=-0.02, accent line clearly in front */}
            <mesh position={[0, 0.52, -0.04]}>
              <boxGeometry args={[1.28, 1.04, 0.04]} />
              <meshStandardMaterial color="#0a0d12" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Top accent line — z=0.008, no overlap with card */}
            <mesh position={[0, 0.99, 0.008]}>
              <boxGeometry args={[1.18, 0.016, 0.008]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} />
            </mesh>
            <Text position={[-0.52, 0.9, 0.02]} fontSize={0.1} color={color} anchorX="left" anchorY="middle" letterSpacing={0.05}>{num}</Text>
            <Text position={[0, 0.6, 0.02]} fontSize={0.22} letterSpacing={0.08} color="#f0ede8" anchorX="center" anchorY="middle">{label}</Text>
            <Text position={[0, 0.24, 0.02]} fontSize={0.12} color="#6a7a8a" anchorX="center" anchorY="middle">{sub}</Text>
            {i < 4 && (
              <Text position={[0.86, 0.52, 0.02]} fontSize={0.2} color="#1e3a5a" anchorX="center" anchorY="middle">→</Text>
            )}
          </group>
        ))}
        {/* Bottom stats bar */}
        <mesh position={[0, -0.72, 0.03]}><boxGeometry args={[7.6, 0.008, 0.006]} /><meshStandardMaterial color="#1a2030" /></mesh>
        {[["99.2%", "AI Accuracy"], ["< 30s", "Analysis"], ["15+", "Damage Types"], ["24/7", "Available"]].map(([v, l], i) => (
          <group key={i} position={[-2.8 + i * 1.88, -1.06, 0.04]}>
            <Text position={[0, 0.18, 0]} fontSize={0.28} letterSpacing={0.04} color="#f0ede8" anchorX="center" anchorY="middle">{v}</Text>
            <Text position={[0, -0.15, 0]} fontSize={0.12} color="#5a6a7a" anchorX="center" anchorY="middle">{l}</Text>
          </group>
        ))}
      </group>
    </>
  );
});

// ─── HERO CAMERA CONTROLLER ───────────────────────────────────────────────────
// p 0–0.45  : Wide garage view — car drives in from z=-22 toward camera
// p 0.45–0.60: Settle to front 3/4 inspection (car parked at z=-6)
// p 0.60–0.74: Scan / damage — slight rise and leftward nudge
// p 0.74–0.88: Component analysis — higher angle
// p 0.88–1.0 : Pull back to reveal full garage
// lowPerf (mobile portrait) uses wider FOV + pulled-back inspection positions so the
// full car + all annotation cards fit inside the narrow horizontal viewport.
// Portrait: Three.js vertical fov=55 → horizontal fov ≈ 32° at 9:16 aspect,
//           which clips the car. Widening to 62° + pulling back ~2× fixes it.
const HeroCarController = ({ scrollProgressRef, lowPerf = false }) => {
  const { camera } = useThree();
  // Start looking slightly left so we catch the car entering from the left edge
  const curPos  = useRef(new THREE.Vector3(-1, 2.0, 3));
  const curLook = useRef(new THREE.Vector3(-5, 0.6, PARK_Z));
  const tgtPos  = useRef(new THREE.Vector3(-1, 2.0, 3));
  const tgtLook = useRef(new THREE.Vector3(-5, 0.6, PARK_Z));

  // Set FOV once on mount based on platform
  useEffect(() => {
    camera.fov = lowPerf ? 62 : 55;
    camera.updateProjectionMatrix();
  }, [camera, lowPerf]);

  useFrame((state) => {
    const p = scrollProgressRef.current;

    // Inspection positions differ by platform: mobile pulls back further so the
    // full car + annotation cards fit inside portrait's narrow horizontal FOV.
    const inspectX  = lowPerf ? PARK_X + 2.8 : PARK_X + 3.5;
    const inspectZ  = lowPerf ? PARK_Z + 5.0 : PARK_Z + 2.5;
    const inspectY1 = lowPerf ? 1.8 : 1.35;
    const inspectY2 = lowPerf ? 2.2 : 1.6;
    const overviewX = lowPerf ? PARK_X + 2.0 : PARK_X + 2.5;
    const overviewY = lowPerf ? 3.5 : 2.8;
    const overviewZ = lowPerf ? PARK_Z + 5.5 : PARK_Z + 3.5;

    if (p < 0.45) {
      // Wide side view: camera tracks the car driving left → right
      const driveT = Math.min(1, p / 0.45);
      const easedT = driveT < 0.5 ? 4*driveT*driveT*driveT : 1-Math.pow(-2*driveT+2,3)/2;
      const approxCarX = THREE.MathUtils.lerp(START_X, PARK_X, easedT);
      const breathY = Math.sin(state.clock.elapsedTime * 0.4) * 0.015;
      tgtPos.current.set(-1, 2.0 + breathY, 3);
      tgtLook.current.set(Math.min(approxCarX + 2, PARK_X + 2), 0.6, PARK_Z);
    } else if (p < 0.62) {
      // Zoom in: camera swings to front 3/4 of parked car
      const t = (p - 0.45) / 0.17;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      tgtPos.current.set(
        THREE.MathUtils.lerp(-1, inspectX, e),
        THREE.MathUtils.lerp(2.0, inspectY1, e),
        THREE.MathUtils.lerp(3, inspectZ, e)
      );
      tgtLook.current.set(PARK_X, THREE.MathUtils.lerp(0.6, 0.65, e), PARK_Z);
    } else if (p < 0.77) {
      // Scan: hold inspection angle, rise slightly
      const t = (p - 0.62) / 0.15;
      tgtPos.current.set(inspectX, THREE.MathUtils.lerp(inspectY1, inspectY2, t), inspectZ);
      tgtLook.current.set(PARK_X, 0.65, PARK_Z);
    } else if (p < 0.87) {
      // Damage callouts: hold
      tgtPos.current.set(inspectX, inspectY2, inspectZ);
      tgtLook.current.set(PARK_X, 0.65, PARK_Z);
    } else if (p < 0.93) {
      // Component analysis: rise for higher overview angle
      const t = (p - 0.87) / 0.06;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      tgtPos.current.set(
        THREE.MathUtils.lerp(inspectX, overviewX, e),
        THREE.MathUtils.lerp(inspectY2, overviewY, e),
        THREE.MathUtils.lerp(inspectZ, overviewZ, e)
      );
      tgtLook.current.set(PARK_X, THREE.MathUtils.lerp(0.65, 0.4, e), PARK_Z);
    } else {
      // Hold the component-analysis angle as the final resting position
      tgtPos.current.set(overviewX, overviewY, overviewZ);
      tgtLook.current.set(PARK_X, 0.4, PARK_Z);
    }

    // Fast lerp during zoom-in and zoom-out; standard elsewhere
    const lerpK = (p >= 0.45 && p < 0.62) ? 0.08 : p >= 0.93 ? 0.09 : 0.038;
    curPos.current.lerp(tgtPos.current, lerpK);
    curLook.current.lerp(tgtLook.current, lerpK);
    camera.position.copy(curPos.current);
    camera.lookAt(curLook.current);
  });

  return null;
};

// ─── DAMAGE CALLOUT ANNOTATIONS (stage 3) ────────────────────────────────────
// Sequential reveal: one card at a time, driven by useMotionValue (no React re-renders).
// Each card gets CARD_MS ms: FADE in → hold → FADE out. Cards don't overlap.
const DamageAnnotations = ({ stageRef, lowPerf = false }) => {
  const anchors = lowPerf ? MOBILE_DAMAGE_ANCHORS : DAMAGE_ANCHORS;
  const CARD_MS = 950, FADE = 220;
  const op0 = useMotionValue(0), op1 = useMotionValue(0), op2 = useMotionValue(0), op3 = useMotionValue(0);
  const ops = [op0, op1, op2, op3];
  const y0 = useTransform(op0, [0, 1], [12, 0]);
  const y1 = useTransform(op1, [0, 1], [12, 0]);
  const y2 = useTransform(op2, [0, 1], [12, 0]);
  const y3 = useTransform(op3, [0, 1], [12, 0]);
  const ys = [y0, y1, y2, y3];
  const t0 = useRef(null);

  useFrame(() => {
    const s = stageRef.current;
    if (s === 3) {
      const now = performance.now();
      if (t0.current === null) t0.current = now;
      const el = now - t0.current;
      ops.forEach((op, i) => {
        const t = el - i * CARD_MS;
        if (t < 0 || t > CARD_MS) { op.set(0); return; }
        if (t < FADE)             { op.set(t / FADE); return; }
        if (t < CARD_MS - FADE)   { op.set(1); return; }
        op.set(1 - (t - (CARD_MS - FADE)) / FADE);
      });
    } else if (t0.current !== null) {
      t0.current = null;
      ops.forEach(o => o.set(0));
    }
  });

  const items = lowPerf ? HERO_SUPRA.damage.slice(0, 2) : HERO_SUPRA.damage;
  return items.map((d, i) => (
    <Html key={i} position={anchors[i]} center style={{ pointerEvents: "none" }}>
      <motion.div
        style={{
          opacity: ops[i], y: ys[i],
          fontFamily: "'Share Tech Mono', monospace",
          pointerEvents: "none", userSelect: "none",
          position: "relative",
          background: "rgba(4,6,14,0.92)",
          border: `1px solid ${SEV_COLOR[d.severity]}55`,
          padding: lowPerf ? "6px 8px 7px" : "7px 10px 8px",
          minWidth: lowPerf ? 132 : 152,
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: SEV_COLOR[d.severity] }} />
        <div style={{ fontSize: 9, color: "#00D4FF", letterSpacing: "0.15em", marginBottom: 5 }}>
          ◈ {d.label.toUpperCase()} DETECTED
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <span style={{ color: "rgba(232,237,242,0.4)", fontSize: 9 }}>CONF</span>
          <span style={{ color: "#fff", fontSize: 11 }}>{d.confidence}</span>
          <span style={{ color: SEV_COLOR[d.severity], background: `${SEV_COLOR[d.severity]}1a`, padding: "1px 5px", fontSize: 9 }}>
            {d.severity}
          </span>
          <span style={{ color: "#3ddc84", marginLeft: "auto", fontSize: 11 }}>{d.estimate}</span>
        </div>
        <div style={{
          position: "absolute", bottom: -9, left: "50%", transform: "translateX(-50%)",
          width: 6, height: 6, borderRadius: "50%",
          background: SEV_COLOR[d.severity],
          boxShadow: `0 0 8px ${SEV_COLOR[d.severity]}`,
        }} />
      </motion.div>
    </Html>
  ));
};

// ─── COMPONENT LABEL ANNOTATIONS (stage 4) ───────────────────────────────────
const ComponentAnnotations = ({ stageRef }) => {
  const CARD_MS = 950, FADE = 220;
  const op0 = useMotionValue(0), op1 = useMotionValue(0);
  const op2 = useMotionValue(0), op3 = useMotionValue(0);
  const ops = [op0, op1, op2, op3];
  const x0 = useTransform(op0, [0, 1], [-10, 0]);
  const x1 = useTransform(op1, [0, 1], [-10, 0]);
  const x2 = useTransform(op2, [0, 1], [-10, 0]);
  const x3 = useTransform(op3, [0, 1], [-10, 0]);
  const xs = [x0, x1, x2, x3];
  const t0 = useRef(null);

  useFrame(() => {
    const s = stageRef.current;
    if (s === 4) {
      const now = performance.now();
      if (t0.current === null) t0.current = now;
      const el = now - t0.current;
      ops.forEach((op, i) => {
        const t = el - i * CARD_MS;
        if (t < 0 || t > CARD_MS) { op.set(0); return; }
        if (t < FADE)             { op.set(t / FADE); return; }
        if (t < CARD_MS - FADE)   { op.set(1); return; }
        op.set(1 - (t - (CARD_MS - FADE)) / FADE);
      });
    } else if (t0.current !== null) {
      t0.current = null;
      ops.forEach(o => o.set(0));
    }
  });

  return HERO_SUPRA.components.map((c, i) => (
    <Html key={i} position={COMPONENT_ANCHORS[i]} center style={{ pointerEvents: "none" }}>
      <motion.div
        style={{
          opacity: ops[i], x: xs[i],
          fontFamily: "'Share Tech Mono', monospace",
          pointerEvents: "none", userSelect: "none",
          background: "rgba(4,6,14,0.85)",
          border: "1px solid rgba(0,212,255,0.22)",
          borderLeft: "2px solid #00D4FF",
          padding: "5px 10px",
          minWidth: 138,
          display: "flex", flexDirection: "column", gap: 3,
        }}
      >
        <div style={{ fontSize: 10, color: "#00D4FF", letterSpacing: "0.1em" }}>
          {c.label.toUpperCase()}
        </div>
        <div style={{ fontSize: 9, color: "rgba(232,237,242,0.5)", letterSpacing: "0.03em" }}>
          {c.desc}
        </div>
      </motion.div>
    </Html>
  ));
};

// Fires onReady on the very first rendered frame (inside car Suspense boundary).
const SceneReadySignal = ({ onReady }) => {
  const firedRef = useRef(false);
  useFrame(() => {
    if (!firedRef.current) { firedRef.current = true; onReady?.(); }
  });
  return null;
};

// ─── HERO VEHICLE SCENE (desktop + mobile) ────────────────────────────────────
// lowPerf=true on mobile: directional light keeps specular but drops castShadow;
// a baked ContactShadow replaces the dynamic shadow map (frames=1 = zero per-frame cost).
const HeroVehicleScene = ({ scrollProgressRef, scanProgressRef, stageRef, onReady, lowPerf = false }) => (
  <>
    {/* Renders immediately — no async deps */}
    <color attach="background" args={["#0e1012"]} />
    <fog attach="fog" args={["#0e1012", 30, 56]} />
    <ambientLight intensity={0.45} color="#f0ece4" />
    {lowPerf
      ? <directionalLight position={[4, 8, 2]} intensity={1.4} color="#fff8f0" />
      : <directionalLight position={[4, 8, 2]} intensity={1.4} color="#fff8f0" castShadow shadow-mapSize={[1024, 1024]} />
    }
    <pointLight position={[PARK_X, 4.8, PARK_Z]} intensity={10} color="#f8f4ee" decay={2} />
    <pointLight position={[-5, 3.5, PARK_Z]} intensity={6} color="#f4f0e8" decay={2} />
    <pointLight position={[0, 4.2, -15]} intensity={5} color="#f4f0e8" decay={2} />
    {lowPerf && (
      <ContactShadows position={[PARK_X, 0.02, PARK_Z]} scale={6} blur={2.4}
                      opacity={0.5} far={4} resolution={512} frames={1} color="#000" />
    )}
    <GarageEnvironment />
    <DamageAnnotations stageRef={stageRef} lowPerf={lowPerf} />
    <HeroCarController scrollProgressRef={scrollProgressRef} lowPerf={lowPerf} />

    {/* Car + env map load async — garage is already visible while this resolves */}
    <Suspense fallback={null}>
      <Environment preset="warehouse" environmentIntensity={0.22} />
      <HeroVehicle scrollProgressRef={scrollProgressRef} scanProgressRef={scanProgressRef} />
      <SceneReadySignal onReady={onReady} />
    </Suspense>

    {/* Parked set-dressing cars — independent async load */}
    <Suspense fallback={null}>
      <ParkedCar url={PARKED_LANCIA} position={[-3.5, -15]} targetHeight={1.3} />
      <ParkedCar url={PARKED_GT40}   position={[3.5, -15]}  targetHeight={1.05} />
    </Suspense>
  </>
);

// ─── SCAN OVERLAY EFFECT ──────────────────────────────────────────────────────
const ScanOverlay = ({ isScanning }) => {
  if (!isScanning) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "hidden" }}>
      <motion.div
        style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #4a9eff80, #4a9effcc, #4a9eff80, transparent)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
      />
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: `${i * 10}%`, left: 0, right: 0,
          height: 1, background: "rgba(74,158,255,0.05)",
        }} />
      ))}
    </div>
  );
};

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
const HeroSection = ({ onAnalyze, onSceneReady: onSceneReadyProp }) => {
  const [stage, setStage]             = useState(0);
  const [heroActive, setHeroActive]   = useState(true);
  const [transitioning, setTransitioning]     = useState(false);
  const [transitioningBack, setTransitioningBack] = useState(false);
  const [sceneReady, setSceneReady]   = useState(false);
  const isMobile = useWindowWidth() < 768;

  // Called by SceneReadySignal on first rendered frame — lifts overlay AND signals App
  const onSceneReady = useCallback(() => {
    setSceneReady(true);
    onSceneReadyProp?.();
  }, [onSceneReadyProp]);

  // Fallback: reveal after 8s if signal never fires (WebGL error, slow device)
  useEffect(() => {
    const t = setTimeout(() => { setSceneReady(true); onSceneReadyProp?.(); }, 8000);
    return () => clearTimeout(t);
  }, [onSceneReadyProp]);

  const sectionRef        = useRef();
  const scrollProgressRef = useRef(0);
  const scanProgressRef   = useRef(0);
  const stageRef          = useRef(0);
  const scrollHintRef     = useRef();
  const autoSeqRef        = useRef({ running: false, tick: null });

  // ── scroll-lock + chapter-transition plumbing ──
  const heroActiveRef     = useRef(true);   // mirror of heroActive for stable handlers
  const lockedRef         = useRef(false);  // page scroll currently locked?
  const lockYRef          = useRef(0);      // scrollY captured at lock time
  const transitioningRef  = useRef(false);  // guard against double-trigger
  const touchStartYRef    = useRef(0);
  const cancelSeqRef      = useRef(null);   // stable ref so lockHandlers (created once) can call latest cancelSequence
  const justCanceledRef   = useRef(false);  // prevents re-locking immediately after a scroll-back cancel

  // Fire the chapter-changing wipe (idempotent)
  const triggerTransition = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);
  }, []);

  // Stable gesture/scroll-block handlers (created once). While the page is locked
  // these swallow wheel/touch.  At stage 5 they detect the "swipe up" to continue;
  // any earlier upward gesture cancels the sequence and reverses the car.
  const lockHandlers = useRef(null);
  if (!lockHandlers.current) {
    lockHandlers.current = {
      wheel: (e) => {
        e.preventDefault();
        if (stageRef.current === 5 && !transitioningRef.current && e.deltaY > 8) {
          triggerTransition();
        } else if (e.deltaY < -5 && stageRef.current !== 5) {
          cancelSeqRef.current?.(); // upward scroll → cancel + reverse car
        }
      },
      touchstart: (e) => { touchStartYRef.current = e.touches[0].clientY; },
      touchmove: (e) => {
        e.preventDefault();
        const dy = touchStartYRef.current - e.touches[0].clientY; // +ve = swipe up
        if (stageRef.current === 5 && !transitioningRef.current && dy > 24) {
          triggerTransition();
        } else if (dy < -24 && stageRef.current !== 5) {
          cancelSeqRef.current?.(); // downward swipe = scrolling up → cancel + reverse car
        }
      },
      key: (e) => {
        if (stageRef.current === 5 && (e.key === "ArrowDown" || e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          triggerTransition();
        } else if ((e.key === "ArrowUp" || e.key === "PageUp") && stageRef.current !== 5) {
          cancelSeqRef.current?.();
        }
      },
    };
  }

  const lockScroll = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    lockYRef.current = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const h = lockHandlers.current;
    window.addEventListener("wheel", h.wheel, { passive: false });
    window.addEventListener("touchstart", h.touchstart, { passive: false });
    window.addEventListener("touchmove", h.touchmove, { passive: false });
    window.addEventListener("keydown", h.key);
  }, []);

  const unlockScroll = useCallback(() => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    const h = lockHandlers.current;
    window.removeEventListener("wheel", h.wheel);
    window.removeEventListener("touchstart", h.touchstart);
    window.removeEventListener("touchmove", h.touchmove);
    window.removeEventListener("keydown", h.key);
  }, []);

  // Cancel the running auto-sequence and hand scroll control back to the user
  // so they can drive the car backward. justCanceledRef prevents immediately
  // re-locking when onScroll sees sp=0.45 on the next tick.
  const cancelSequence = useCallback(() => {
    if (!autoSeqRef.current.running && !lockedRef.current) return;
    if (autoSeqRef.current.tick) { clearInterval(autoSeqRef.current.tick); autoSeqRef.current.tick = null; }
    autoSeqRef.current.running = false;
    scanProgressRef.current = 0;
    scrollProgressRef.current = 0.45; // car sits at park until user scrolls back
    stageRef.current = 0;
    setStage(0);
    justCanceledRef.current = true;
    unlockScroll();
  }, [unlockScroll]);
  // Keep the ref in sync so lockHandlers (created once) always call the latest version
  cancelSeqRef.current = cancelSequence;

  // Tear the hero down (used by CTAs / nav that need free scroll)
  const dismissHero = useCallback(() => {
    if (autoSeqRef.current.tick) { clearInterval(autoSeqRef.current.tick); autoSeqRef.current.tick = null; }
    autoSeqRef.current.running = false;
    unlockScroll();
    heroActiveRef.current = false;
    setHeroActive(false);
  }, [unlockScroll]);

  // Wipe panel fully covers the screen → unlock + dismiss hero (hidden behind panel).
  // The spacer unmounts with heroActive, collapsing the page height.
  // A useEffect (below) scrolls to 0 after the DOM settles — still hidden by the wipe.
  const handleCovered = useCallback(() => {
    unlockScroll();
    heroActiveRef.current = false;
    setHeroActive(false);
  }, [unlockScroll]);

  // Wipe panel finished lifting away → unmount the transition
  const handleTransitionDone = useCallback(() => {
    transitioningRef.current = false;
    setTransitioning(false);
  }, []);

  // After heroActive toggles: scroll to 0. On false→true the overlay covers any
  // browser scroll-anchor adjustment; on true→false it hides behind the wipe panel.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [heroActive]);

  // When the hero is dismissed, watch for an upward gesture at scrollY=0 (i.e. user
  // tries to scroll back above section 01) and re-mount the hero fresh.
  useEffect(() => {
    if (heroActive) return; // only active while hero is dismissed

    const reactivate = () => {
      if (heroActiveRef.current) return; // guard
      if (autoSeqRef.current.tick) { clearInterval(autoSeqRef.current.tick); autoSeqRef.current.tick = null; }
      autoSeqRef.current.running = false;
      lockedRef.current = false;
      transitioningRef.current = false;
      scrollProgressRef.current = 0;
      scanProgressRef.current   = 0;
      stageRef.current = 0;
      heroActiveRef.current = true;
      setStage(0);
      setTransitioning(false);
      setHeroActive(true);
    };

    let t0Y = 0;
    const onWheel      = (e) => { if (window.scrollY <= 0 && e.deltaY < -5) reactivate(); };
    const onTouchStart = (e) => { t0Y = e.touches[0].clientY; };
    const onTouchMove  = (e) => { if (window.scrollY <= 0 && e.touches[0].clientY - t0Y > 30) reactivate(); };
    const onKeyDown    = (e) => { if (window.scrollY <= 0 && (e.key === "ArrowUp" || e.key === "PageUp")) reactivate(); };

    window.addEventListener("wheel",      onWheel,      { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("keydown",    onKeyDown);
    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("keydown",    onKeyDown);
    };
  }, [heroActive]);

  useEffect(() => {
    // ── Auto-sequence piecewise timeline ──
    //      0→1800 ms : p 0.45→0.62  zoom-in    1.8 s
    //   1800→3000 ms : p 0.62→0.77  scan       1.2 s
    //   3000→6600 ms : p 0.77→0.87  damage     3.6 s  (3 cards × 1200 ms each)
    //   3000→7800 ms : p 0.77→0.93  damage     4.8 s  (4 cards × 1200 ms each)
    //   7800→8800 ms : p 0.93→1.00  complete   1.0 s
    const SEGS = [
      { end: 1800, pStart: 0.45, pEnd: 0.62 },  // zoom-in  1.8 s
      { end: 3000, pStart: 0.62, pEnd: 0.77 },  // scan     1.2 s
      { end: 6800, pStart: 0.77, pEnd: 0.93 },  // damage   3.8 s  (4 × 950 ms)
      { end: 7800, pStart: 0.93, pEnd: 1.00 },  // complete 1.0 s
    ];
    const startAutoSequence = () => {
      if (autoSeqRef.current.tick) return;
      const t0 = Date.now();
      autoSeqRef.current.tick = setInterval(() => {
        const ms  = Date.now() - t0;
        const idx = SEGS.findIndex(s => ms < s.end);
        const seg = idx === -1 ? SEGS[SEGS.length - 1] : SEGS[idx];
        const segStart = idx <= 0 ? 0 : SEGS[idx - 1].end;
        const t    = Math.min(1, (ms - segStart) / (seg.end - segStart));
        const newP = seg.pStart + (seg.pEnd - seg.pStart) * t;
        scrollProgressRef.current = newP;
        scanProgressRef.current   = newP < 0.62 ? 0 : newP > 0.77 ? 1 : (newP - 0.62) / 0.15;
        const ns = newP < 0.62 ? 1 : newP < 0.77 ? 2 : newP < 0.93 ? 3 : 5;
        if (ns !== stageRef.current) { stageRef.current = ns; setStage(ns); }
        if (ms >= SEGS[SEGS.length - 1].end) {
          clearInterval(autoSeqRef.current.tick);
          autoSeqRef.current.tick = null;
          // Sequence committed; page stays locked until the user fires the chapter wipe.
        }
      }, 16);
    };

    const onScroll = () => {
      // Once the car parks the page is locked; once the hero is dismissed scroll is free.
      if (lockedRef.current || !heroActiveRef.current) return;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const rawP = Math.max(0, Math.min(1, Math.max(0, -rect.top) / (el.offsetHeight - window.innerHeight)));
      if (scrollHintRef.current) scrollHintRef.current.style.opacity = rawP < 0.06 ? "1" : "0";

      // Scroll drives the car entrance only — remap rawP(0→1) to p(0→0.45),
      // car fully parked by rawP ≈ 0.9 (leaves headroom before the spacer bottom).
      const sp = Math.min(0.45, (rawP / 0.9) * 0.45);
      scrollProgressRef.current = sp;
      scanProgressRef.current   = 0;
      // Once the user scrolls the car back below the park threshold, reset the cancel guard
      // so the next arrival at 0.45 re-arms the sequence.
      if (sp < 0.44) justCanceledRef.current = false;
      const ns = sp >= 0.45 ? 1 : 0;
      if (ns !== stageRef.current) {
        stageRef.current = ns;
        setStage(ns);
        if (ns === 1 && !justCanceledRef.current) {
          // Car parked — lock the page so 01 can't be reached, then hand off to the timer.
          autoSeqRef.current.running = true;
          lockScroll();
          setTimeout(startAutoSequence, 600);
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("dv:dismiss-hero", dismissHero);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("dv:dismiss-hero", dismissHero);
      if (autoSeqRef.current.tick) { clearInterval(autoSeqRef.current.tick); autoSeqRef.current.tick = null; }
      unlockScroll();
    };
  }, [lockScroll, unlockScroll, dismissHero]);

  const watchDemo = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    // Smooth-scroll to the parking point — the car drives in, then the auto-sequence + lock take over
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.92, behavior: "smooth" });
  }, []);

  // 0=driving  1=zoom-in  2=scanning  3=damage  4=components  5=garage
  const stageLabels = ["", "", "AI NEURAL SCAN", "DAMAGE DETECTED", "COMPONENT ANALYSIS", "INSPECTION COMPLETE"];

  return (
    <>
      {/* Canvas div is ALWAYS mounted so WebGL never re-inits on revisit.
          visibility + pointerEvents toggle instead of unmounting. */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 5,
        background: "#0e1012",
        display: heroActive ? "block" : "none",
        pointerEvents: heroActive ? "auto" : "none",
      }}>
        <Canvas
          frameloop={heroActive ? "always" : "never"}
          shadows
          dpr={isMobile ? [1, 1.0] : [1, 1.5]}
          camera={{ position: [-1, 2.0, 3], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          onCreated={({ gl }) => gl.setClearColor('#0e1012')}
        >
          <HeroVehicleScene
            scrollProgressRef={scrollProgressRef}
            scanProgressRef={scanProgressRef}
            stageRef={stageRef}
            onReady={onSceneReady}
            lowPerf={isMobile}
          />
        </Canvas>

        {/* Scene-ready overlay — same colour as the loading screen background.
            Sits on top of the Canvas until the first real frame fires, then fades out.
            Prevents any black/blank flash between loading screen exit and scene render. */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: sceneReady ? 0 : 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            position: "absolute", inset: 0,
            background: "var(--c-bg)",
            zIndex: 15,
            pointerEvents: "none",
          }}
        />

        {/* Edge fades */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "15%", background: "linear-gradient(#0e1012, transparent)", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "12%", background: "linear-gradient(transparent, #0e1012)", zIndex: 1, pointerEvents: "none" }} />

        {/* ── Stage 0: full hero panel ── */}
        <AnimatePresence>
          {stage === 0 && (
            <motion.div
              key="hero-panel"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6 }}
              style={{
                position: "absolute",
                top: "50%", left: isMobile ? "5vw" : "6vw",
                transform: "translateY(-50%)",
                zIndex: 3,
                maxWidth: isMobile ? "88vw" : 460,
              }}
            >
              <div className="section-label" style={{ marginBottom: "1rem", fontSize: "0.62rem" }}>
                ◈ AUTOMOTIVE AI · DAMAGE INTELLIGENCE
              </div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: isMobile ? "clamp(3.2rem, 11vw, 5.5rem)" : "clamp(4.5rem, 6.5vw, 7.5rem)",
                lineHeight: 0.88, letterSpacing: "0.04em", marginBottom: "1.2rem",
              }}>
                <span style={{ display: "block" }}>DENT</span>
                <span style={{
                  display: "block",
                  background: "linear-gradient(90deg, var(--c-blue-bright), var(--c-cyan))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>VISION</span>
                <span style={{ display: "block", WebkitTextStroke: "1px rgba(255,255,255,0.15)", WebkitTextFillColor: "transparent" }}>AI</span>
              </h1>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: isMobile ? "1rem" : "1.05rem",
                fontWeight: 600, letterSpacing: "0.03em",
                color: "rgba(255,255,255,0.72)", marginBottom: "0.7rem",
              }}>
                AI-Powered Vehicle Damage Detection<br />& Repair Intelligence
              </p>
              {!isMobile && (
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.88rem",
                  color: "var(--c-text-muted)", lineHeight: 1.75, fontWeight: 300,
                  marginBottom: "2rem", maxWidth: 380,
                }}>
                  Upload vehicle images and receive instant AI-powered damage assessment, severity analysis, and repair cost estimation.
                </p>
              )}
              <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", marginTop: isMobile ? "1.4rem" : 0 }}>
                <motion.button className="btn-primary" onClick={onAnalyze} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ fontSize: "0.82rem", padding: "0.75rem 1.8rem" }}>
                  ▷ Analyze Damage
                </motion.button>
                <motion.button
                  onClick={watchDemo}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{
                    fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600,
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    padding: "0.75rem 1.6rem",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.65)", cursor: "pointer",
                  }}
                >
                  Watch Demo
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stages 1-4: compact wordmark ── */}
        <AnimatePresence>
          {stage > 0 && (
            <motion.div
              key="wordmark"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ position: "absolute", top: isMobile ? 72 : 80, left: isMobile ? "5vw" : "4vw", zIndex: 3 }}
            >
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: isMobile ? "1.7rem" : "2.1rem",
                letterSpacing: "0.06em", lineHeight: 1,
                background: "linear-gradient(90deg, #fff 60%, var(--c-cyan))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>DENT VISION AI</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage caption (hidden at stage 5 — replaced by full report panel) ── */}
        <AnimatePresence mode="wait">
          {stage > 0 && stage < 5 && (
            <motion.div
              key={`cap-${stage}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", bottom: isMobile ? "23%" : "19%", left: "50%", transform: "translateX(-50%)", zIndex: 3, textAlign: "center", pointerEvents: "none" }}
            >
              <div className="section-label" style={{ fontSize: "0.68rem", color: "var(--c-cyan)" }}>
                {stageLabels[stage]}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage 2: scan line overlay ── */}
        {stage === 2 && <ScanOverlay isScanning={true} />}

        {/* ── Stage 5: inspection report — bottom strip, items reveal one by one ── */}
        <AnimatePresence>
          {stage === 5 && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                zIndex: 4, pointerEvents: "none",
                background: "linear-gradient(transparent, rgba(4,6,12,0.96) 30%)",
                padding: isMobile ? "28px 5vw 18px" : "32px 5vw 20px",
              }}
            >
              {/* Header — reveals first */}
              <motion.div
                className="section-label"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                style={{ fontSize: "0.6rem", color: "var(--c-cyan)", letterSpacing: "0.22em", marginBottom: 10 }}
              >
                ◈ INSPECTION COMPLETE
              </motion.div>

              {/* Damage findings — desktop: horizontal columns; mobile: compact 2-row list */}
              {isMobile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {HERO_SUPRA.damage.slice(0, 2).map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.4 + i * 0.5 }}
                      style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)" }}
                    >
                      <span style={{ fontSize: "0.55rem", color: "var(--c-cyan)", letterSpacing: "0.08em", flex: 1 }}>
                        ◈ {d.label.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: "0.5rem", padding: "1px 6px",
                        color: SEV_COLOR[d.severity],
                        background: `${SEV_COLOR[d.severity]}1a`,
                      }}>{d.severity}</span>
                      <span style={{ fontSize: "0.62rem", color: "#3ddc84", minWidth: 44, textAlign: "right" }}>{d.estimate}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 0 }}>
                  {HERO_SUPRA.damage.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.5 }}
                      style={{
                        flex: 1,
                        borderRight: i < HERO_SUPRA.damage.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                        paddingRight: i < HERO_SUPRA.damage.length - 1 ? "clamp(12px,2vw,28px)" : 0,
                        paddingLeft: i > 0 ? "clamp(12px,2vw,28px)" : 0,
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "var(--c-cyan)", letterSpacing: "0.1em", marginBottom: 4 }}>
                        ◈ {d.label.toUpperCase()} DETECTED
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
                        <span style={{ color: "var(--c-text-dim)" }}>CONF</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{d.confidence}</span>
                        <span style={{
                          color: SEV_COLOR[d.severity],
                          background: `${SEV_COLOR[d.severity]}1a`,
                          padding: "1px 6px",
                        }}>{d.severity}</span>
                        <motion.div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.08)", marginLeft: 6, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: `${parseFloat(d.confidence) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.7 + i * 0.5, ease: "easeOut" }}
                            style={{ height: "100%", background: SEV_COLOR[d.severity] }}
                          />
                        </motion.div>
                        <span style={{ color: "#3ddc84" }}>{d.estimate}</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Summary stats — desktop only */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + HERO_SUPRA.damage.length * 0.5 }}
                    style={{
                      borderLeft: "1px solid rgba(0,212,255,0.2)",
                      paddingLeft: "clamp(12px,2vw,28px)",
                      marginLeft: 4,
                      display: "flex", gap: 24, alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {[
                      { label: "TOTAL", value: "~$595", color: "#3ddc84" },
                      { label: "AVG CONF", value: "77.3%", color: "#fff" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--c-text-dim)", letterSpacing: "0.1em" }}>{label}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color, letterSpacing: "0.04em" }}>{value}</div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage 5: swipe-up hint ── */}
        <AnimatePresence>
          {stage === 5 && (
            <motion.div
              key="swipe-up-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: 2.4 }}
              onClick={triggerTransition}
              role="button"
              tabIndex={0}
              style={{
                position: "absolute",
                bottom: isMobile ? 148 : 168,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                zIndex: 6,
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              {/* bouncing double chevron pointing up */}
              <motion.div
                animate={{ y: [3, -5, 3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
              >
                {[0.9, 0.45].map((opacity, i) => (
                  <div key={i} style={{
                    width: 11, height: 11,
                    borderLeft: "1.5px solid var(--c-cyan)",
                    borderTop: "1.5px solid var(--c-cyan)",
                    transform: "rotate(45deg)",
                    opacity,
                  }} />
                ))}
              </motion.div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.52rem",
                color: "var(--c-cyan)", letterSpacing: "0.2em", opacity: 0.8,
              }}>
                SWIPE UP TO CONTINUE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scroll indicator ── */}
        <div
          ref={scrollHintRef}
          style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, transition: "opacity 0.4s", pointerEvents: "none" }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", letterSpacing: "0.2em" }}>SCROLL TO EXPLORE</div>
          <div style={{ width: 1, height: 40, background: "linear-gradient(var(--c-cyan), transparent)" }} />
        </div>
      </div>
      {/* 200vh spacer — conditional so it collapses when hero is dismissed,
          letting section 01 sit at the top of the page. */}
      {heroActive && <section ref={sectionRef} style={{ height: "200vh", background: "#0e1012" }} />}

      {/* Chapter-changing wipe → reveals section 01 */}
      <AnimatePresence>
        {transitioning && (
          <ChapterTransition
            key="chapter-wipe"
            isMobile={isMobile}
            onCovered={handleCovered}
            onDone={handleTransitionDone}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── STORY SCENE ──────────────────────────────────────────────────────────────
const StoryScene = ({ number, label, children, align = "left" }) => {
  const ref = useRef();
  const isMobile = useWindowWidth() < 768;
  const inView = useInView(ref, { threshold: 0.05, once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 40 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: isMobile ? "6vh 5vw" : "8vh 5vw",
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <div className="scene-number">{number}</div>
      <div className="section-label" style={{ marginBottom: "1rem" }}>{label}</div>
      {children}
    </motion.div>
  );
};

// ─── SCROLL STORYTELLING ──────────────────────────────────────────────────────
const ScrollStory = ({ onScanTrigger }) => {
  const isMobile = useWindowWidth() < 768;

  const features = [
    { icon: "◈", title: "Damage Detection", desc: "Pinpoint accuracy on dents, cracks, and deformation zones" },
    { icon: "◉", title: "Classification Engine", desc: "Front/Rear × Normal/Breakage/Crushed across 6 damage classes" },
    { icon: "◐", title: "Confidence Analysis", desc: "Per-zone probability scores with explainable AI reasoning" },
  ];

  const stats = [
    { value: "0.3s", label: "Avg. Detection Time" },
    { value: "80.1%", label: "Model Accuracy" },
    { value: "6", label: "Damage Classes" },
    { value: "∞", label: "Vehicles / Day" },
  ];

  return (
    <div id="chapter-01" style={{ background: "var(--c-bg2)", paddingTop: "8vh" }}>
      <GridBackground opacity={0.5} />

      {/* Scene 01: Classification */}
      <StoryScene number="01" label="◐ DAMAGE CLASSIFICATION">
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            lineHeight: 0.95,
            letterSpacing: "0.03em",
          }}>
            PRECISION CLASSIFICATION
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? "1rem" : "1.5rem" }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8, borderColor: "rgba(0,212,255,0.3)" }}
              style={{
                padding: isMobile ? "1.25rem" : "2rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--c-border)",
                transition: "border-color 0.3s",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${i === 0 ? "var(--c-blue)" : i === 1 ? "var(--c-cyan)" : "var(--c-gold)"}, transparent)`,
                opacity: 0.5,
              }} />
              <div style={{
                fontSize: "2rem",
                color: i === 0 ? "var(--c-blue)" : i === 1 ? "var(--c-cyan)" : "var(--c-gold)",
                marginBottom: "1rem",
              }}>{f.icon}</div>
              <h3 style={{
                fontFamily: "var(--font-display)", fontSize: "1.4rem",
                letterSpacing: "0.05em", marginBottom: "0.8rem",
              }}>{f.title}</h3>
              <p style={{ color: "var(--c-text-muted)", fontSize: "0.9rem", lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </StoryScene>

      {/* Scene 02: Scalability */}
      <StoryScene number="02" label="◑ ENTERPRISE SCALE">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "2rem" : "4rem", alignItems: "center" }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 0.95,
              marginBottom: "1.5rem",
              letterSpacing: "0.03em",
            }}>
              FLEET-SCALE<br />
              <span style={{ color: "var(--c-gold)" }}>PROCESSING</span><br />
              POWER
            </h2>
            <p style={{ color: "var(--c-text-muted)", lineHeight: 1.8, fontWeight: 300, fontSize: "1.05rem", marginBottom: "2.5rem" }}>
              From a single inspection to an entire rental fleet — Dent Vision AI scales horizontally with zero performance degradation.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: isMobile ? "1rem" : "1.5rem" }}>
              {stats.map((stat, i) => (
                <div key={i}>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2rem, 4vw, 2.8rem)",
                    color: i % 2 === 0 ? "var(--c-blue-bright)" : "var(--c-gold-bright)",
                    lineHeight: 1,
                  }}>{stat.value}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", letterSpacing: "0.15em", marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: isMobile ? 6 : 8 }}>
            {Array.from({ length: isMobile ? 6 : 9 }, (_, i) => (
              <motion.div
                key={i}
                style={{
                  height: isMobile ? 56 : 80,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--c-border)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 4,
                }}
                animate={{
                  borderColor: [
                    "rgba(255,255,255,0.07)",
                    "rgba(59,139,235,0.3)",
                    "rgba(255,255,255,0.07)",
                  ],
                }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
              >
                {/* CSS-animated car silhouette (no Canvas — prevents 9 WebGL contexts) */}
                <motion.div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: isMobile ? "0.55rem" : "0.7rem",
                    color: `hsl(${210 + i * 12}, 70%, 60%)`,
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                  animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                >
                  ◈
                </motion.div>
                <motion.div
                  style={{
                    height: 1,
                    background: `linear-gradient(90deg, transparent, hsl(${210 + i * 12}, 70%, 60%), transparent)`,
                    width: "60%",
                  }}
                  animate={{ scaleX: [0, 1, 0] }}
                  transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, delay: i * 0.1 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </StoryScene>

      {/* Scene 03: CTA */}
      <StoryScene number="03" label="◒ BEGIN ANALYSIS">
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 6vw, 5rem)",
            lineHeight: 0.95,
            marginBottom: "1.5rem",
            letterSpacing: "0.05em",
          }}>
            READY TO DETECT?
          </h2>
          <p style={{ color: "var(--c-text-muted)", maxWidth: 500, margin: "0 auto 3rem", lineHeight: 1.8, fontWeight: 300 }}>
            Upload your vehicle image below. Our AI returns damage classification results in under a second.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <button className="btn-primary" onClick={onScanTrigger} style={{ fontSize: "1rem", padding: "1.1rem 3.5rem" }}>
              ▷ Start Analysis Now
            </button>
          </motion.div>
        </div>
      </StoryScene>
    </div>
  );
};

// ─── UPLOAD SECTION HELPERS ───────────────────────────────────────────────────
const getClassColor = (cls = "") => {
  const value = String(cls || "");
  if (value.includes("Normal")) return "var(--c-cyan)";
  if (value.includes("Crushed")) return "#FFB344";
  if (value.includes("Breakage")) return "#FF4444";
  return "var(--c-blue)";
};

const getClassIcon = (cls = "") => {
  const value = String(cls || "");
  if (value.includes("F_")) return "Front Zone";
  if (value.includes("R_")) return "Rear Zone";
  return "◉";
};

const getSeverity = (cls = "") => {
  const value = String(cls || "");
  if (value.includes("Crushed")) return "MODERATE";
  if (value.includes("Breakage")) return "CRITICAL";
  if (value.includes("Normal")) return "NONE";
  return "UNKNOWN";
};

const classLabel = (cls = "") =>
  String(cls || "")
    .replace("F_Normal", "NO DAMAGE DETECTED")
    .replace("F_Breakage", "FRONT IMPACT · BREAKAGE")
    .replace("F_Crushed", "FRONT IMPACT · CRUSHED")
    .replace("R_Normal", "NO DAMAGE DETECTED")
    .replace("R_Breakage", "REAR IMPACT · BREAKAGE")
    .replace("R_Crushed", "REAR IMPACT · CRUSHED");

// ─── RESULT CARD ──────────────────────────────────────────────────────────────
const ResultCard = ({ item, onRemove }) => {
  const { preview, status, result } = item;
  const isScanning = status === "scanning";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        border: `1px solid ${result ? "rgba(59,139,235,0.25)" : "rgba(255,255,255,0.08)"}`,
        background: result ? "rgba(59,139,235,0.03)" : "rgba(255,255,255,0.02)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      {result && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${getClassColor(result.class)}, transparent)`,
        }} />
      )}

      {/* Remove button */}
      {!isScanning && (
        <button
          onClick={onRemove}
          style={{
            position: "absolute", top: 8, right: 8, zIndex: 10,
            background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--c-text-dim)", cursor: "pointer",
            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem",
          }}
        >
          ✕
        </button>
      )}

      {/* Thumbnail */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={preview}
          alt="Vehicle"
          style={{
            width: "100%", height: 180, objectFit: "cover",
            filter: isScanning ? "brightness(0.35) saturate(0.2)" : "brightness(1)",
            transition: "filter 0.4s",
            display: "block",
          }}
        />
        {isScanning && (
          <>
            <motion.div
              style={{
                position: "absolute", left: 0, right: 0, height: 2, top: 0,
                background: "linear-gradient(90deg, transparent, var(--c-cyan), transparent)",
                boxShadow: "0 0 12px var(--c-cyan)",
              }}
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--c-cyan)" }}>
                ANALYZING
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    style={{ width: 6, height: 6, background: "var(--c-cyan)", opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pending label */}
      {status === "pending" && (
        <div style={{ padding: "0.6rem 0.75rem" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", letterSpacing: "0.1em" }}>
            READY TO ANALYZE
          </div>
        </div>
      )}

      {/* Result content */}
      {result && (
        <div style={{ padding: "1rem" }}>
          {result.demo && (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--c-gold)",
              letterSpacing: "0.12em", marginBottom: "0.75rem",
              padding: "3px 8px", border: "1px solid rgba(200,148,58,0.2)",
              display: "inline-block",
            }}>
              DEMO MODE
            </div>
          )}

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", marginBottom: 2 }}>
            {getClassIcon(result.class)}
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: "1.25rem",
            color: getClassColor(result.class),
            lineHeight: 1.1, letterSpacing: "0.04em", marginBottom: "0.4rem",
          }}>
            {classLabel(result.class)}
          </div>
          <div style={{
            display: "flex", gap: "1rem", marginBottom: "0.75rem",
            fontFamily: "var(--font-mono)", fontSize: "0.6rem",
            color: "var(--c-text-muted)", letterSpacing: "0.08em", flexWrap: "wrap",
          }}>
            <span>CONF: <span style={{ color: getClassColor(result.class) }}>{(result.confidence * 100).toFixed(1)}%</span></span>
            <span>SEV: <span style={{ color: getClassColor(result.class) }}>{getSeverity(result.class)}</span></span>
          </div>

          {result.all_scores && (
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--c-text-dim)", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
                ALL CLASS PROBABILITIES
              </div>
              {Object.entries(result.all_scores)
                .sort(([, a], [, b]) => b - a)
                .map(([cls, score], i) => (
                  <div key={cls} style={{ marginBottom: 6 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                      color: cls === result.class ? getClassColor(cls) : "var(--c-text-dim)",
                      marginBottom: 2, letterSpacing: "0.04em",
                    }}>
                      <span>{cls}</span>
                      <span>{(score * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(score * 100, 100)}%` }}
                        transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: "100%",
                          background: cls === result.class ? getClassColor(cls) : "rgba(255,255,255,0.12)",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div style={{
            marginTop: "0.75rem", padding: "0.6rem 0.75rem",
            background: "rgba(0,0,0,0.3)",
            borderLeft: `2px solid ${getClassColor(result.class)}`,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--c-text-dim)", letterSpacing: "0.12em", marginBottom: 2 }}>AI RECOMMENDATION</div>
            <div style={{ fontSize: "0.75rem", color: "var(--c-text-muted)", lineHeight: 1.5 }}>
              {result.class?.includes("Normal")
                ? "Vehicle appears structurally intact."
                : result.class?.includes("Crushed")
                  ? "Significant structural damage. Immediate assessment recommended."
                  : "Panel breakage identified. Workshop evaluation advised."}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── UPLOAD SECTION ───────────────────────────────────────────────────────────
const UploadSection = ({ sectionRef }) => {
  const [items, setItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();
  const isMobile = useWindowWidth() < 768;

  const handleFiles = (fileList) => {
    Array.from(fileList)
      .filter(f => f.type.startsWith("image/"))
      .forEach(f => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const reader = new FileReader();
        reader.onload = (e) => {
          setItems(prev => [...prev, { id, file: f, preview: e.target.result, status: "pending", result: null }]);
        };
        reader.readAsDataURL(f);
      });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const clearAll = () => setItems([]);

  const runOne = async (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "scanning" } : i));
    const demoClasses = ["F_Breakage", "F_Crushed", "F_Normal", "R_Breakage", "R_Crushed", "R_Normal"];
    try {
      const formData = new FormData();
      formData.append("file", item.file);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/predict`, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "done", result: data } : i));
    } catch {
      const picked = demoClasses[Math.floor(Math.random() * demoClasses.length)];
      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i, status: "done",
        result: {
          class: picked,
          confidence: parseFloat((Math.random() * 0.2 + 0.78).toFixed(3)),
          all_scores: demoClasses.reduce((acc, c) => {
            acc[c] = parseFloat((Math.random() * 0.15 + (c === picked ? 0.78 : 0.02)).toFixed(3));
            return acc;
          }, {}),
          demo: true,
        },
      } : i));
    }
  };

  const analyze = async () => {
    const pending = items.filter(i => i.status === "pending");
    if (!pending.length || scanning) return;
    setScanning(true);
    await Promise.all(pending.map(runOne));
    setScanning(false);
  };

  const [sendState, setSendState] = useState("idle"); // idle | sending | sent | error

  const compressToBase64 = (file) => new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78).split(",")[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

  const sendReport = async () => {
    const done = items.filter(i => i.status === "done" && i.result);
    if (!done.length || sendState === "sending") return;
    setSendState("sending");
    try {
      const images = await Promise.all(done.map(item => compressToBase64(item.file)));
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, results: done.map(i => i.result) }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSendState("sent");
    } catch {
      setSendState("error");
    } finally {
      setTimeout(() => setSendState("idle"), 4000);
    }
  };

  const pendingCount = items.filter(i => i.status === "pending").length;
  const doneCount = items.filter(i => i.status === "done").length;

  return (
    <section ref={sectionRef} style={{ padding: isMobile ? "6vh 5vw 10vh" : "10vh 5vw", position: "relative", minHeight: "100vh" }}>
      <GridBackground opacity={0.3} />
      <ParticleField />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div className="section-label" style={{ marginBottom: "1rem" }}>◈ DAMAGE ANALYSIS TERMINAL</div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            letterSpacing: "0.05em",
          }}>UPLOAD & ANALYZE</h2>
        </div>

        {/* Dropzone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          animate={{
            borderColor: dragOver ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.1)",
            background: dragOver ? "rgba(0,212,255,0.05)" : "rgba(255,255,255,0.02)",
          }}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            padding: isMobile ? "2rem 1.5rem" : "2.5rem 2rem",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative", overflow: "hidden",
            marginBottom: "1.5rem",
            transition: "border-color 0.3s, background 0.3s",
          }}
        >
          {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h], i) => (
            <div key={i} style={{
              position: "absolute", [v]: 8, [h]: 8, width: 16, height: 16,
              borderTop: v === "top" ? "2px solid var(--c-cyan)" : "none",
              borderBottom: v === "bottom" ? "2px solid var(--c-cyan)" : "none",
              borderLeft: h === "left" ? "2px solid var(--c-cyan)" : "none",
              borderRight: h === "right" ? "2px solid var(--c-cyan)" : "none",
              opacity: 0.5,
            }} />
          ))}
          <motion.div
            style={{ fontSize: "3rem", marginBottom: "0.75rem", color: "var(--c-text-dim)" }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ⬆
          </motion.div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
            DROP VEHICLE IMAGES
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
            OR CLICK TO BROWSE — SELECT MULTIPLE
          </div>
          <div style={{
            padding: "4px 16px", border: "1px solid var(--c-border)",
            fontFamily: "var(--font-mono)", fontSize: "0.6rem",
            color: "var(--c-text-dim)", letterSpacing: "0.12em",
          }}>
            JPG · PNG · WEBP · HEIC · MAX 20MB EACH
          </div>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-cyan)", letterSpacing: "0.1em" }}
            >
              {items.length} image{items.length !== 1 ? "s" : ""} loaded — click or drop to add more
            </motion.div>
          )}
        </motion.div>

        {/* Action bar */}
        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}
            >
              <motion.button
                className="btn-primary"
                onClick={analyze}
                disabled={pendingCount === 0 || scanning}
                whileHover={pendingCount > 0 && !scanning ? { scale: 1.02 } : {}}
                whileTap={pendingCount > 0 && !scanning ? { scale: 0.98 } : {}}
                style={{ opacity: pendingCount === 0 || scanning ? 0.45 : 1, cursor: pendingCount === 0 || scanning ? "not-allowed" : "pointer" }}
              >
                {scanning ? "◈ ANALYZING..." : `▷ Run AI Analysis${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
              </motion.button>
              <button
                className="btn-ghost"
                onClick={clearAll}
                disabled={scanning}
                style={{ opacity: scanning ? 0.4 : 1, fontSize: "0.8rem" }}
              >
                ↺ Clear All
              </button>
              <motion.button
                className="btn-primary"
                onClick={sendReport}
                disabled={doneCount === 0 || scanning || sendState === "sending"}
                whileHover={doneCount > 0 && !scanning && sendState === "idle" ? { scale: 1.02 } : {}}
                whileTap={doneCount > 0 && !scanning && sendState === "idle" ? { scale: 0.98 } : {}}
                style={{
                  opacity: doneCount === 0 || scanning || sendState === "sending" ? 0.45 : 1,
                  cursor: doneCount === 0 || scanning || sendState === "sending" ? "not-allowed" : "pointer",
                  background: sendState === "sent"
                    ? "linear-gradient(135deg, #00a86b 0%, #007a50 100%)"
                    : sendState === "error"
                      ? "linear-gradient(135deg, #cc3333 0%, #991111 100%)"
                      : undefined,
                }}
              >
                {sendState === "sending" ? "◈ SENDING..."
                  : sendState === "sent" ? "✓ SENT TO INBOX"
                  : sendState === "error" ? "⚠ FAILED — RETRY"
                  : "✉ Send Report"}
              </motion.button>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", letterSpacing: "0.1em", marginLeft: "auto" }}>
                {doneCount}/{items.length} COMPLETE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results grid */}
        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <AnimatePresence>
                {items.map(item => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </section>
  );
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const Navigation = ({ onAnalyze }) => {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 100], ["rgba(2,4,8,0)", "rgba(2,4,8,0.95)"]);
  const isMobile = useWindowWidth() < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <motion.nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 100, background: bg,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 5vw",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64,
          willChange: "transform",
        }}
      >
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.3rem",
          letterSpacing: "0.15em",
          color: "#fff",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ color: "var(--c-cyan)" }}>◈</span>
          DENT VISION
          <span style={{
            fontSize: "0.65rem", fontFamily: "var(--font-mono)",
            color: "var(--c-text-dim)", letterSpacing: "0.2em",
            padding: "2px 8px", border: "1px solid var(--c-border)",
            verticalAlign: "middle",
          }}>AI</span>
        </div>

        {isMobile ? (
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: "none", border: "1px solid var(--c-border)",
              cursor: "pointer", padding: "8px 10px",
              display: "flex", flexDirection: "column", gap: 5, alignItems: "center",
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={menuOpen ? {
                  rotate: i === 0 ? 45 : i === 2 ? -45 : 0,
                  y: i === 0 ? 7 : i === 2 ? -7 : 0,
                  opacity: i === 1 ? 0 : 1,
                } : { rotate: 0, y: 0, opacity: 1 }}
                style={{ width: 20, height: 1.5, background: "var(--c-cyan)", display: "block" }}
              />
            ))}
          </button>
        ) : (
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {["Technology", "Demo", "Pricing"].map(item => (
              <button
                key={item}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: "0.85rem",
                  fontWeight: 600, letterSpacing: "0.1em", color: "var(--c-text-muted)",
                  textTransform: "uppercase", transition: "color 0.2s",
                }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "var(--c-text-muted)"}
              >
                {item}
              </button>
            ))}
            <button className="btn-primary" onClick={onAnalyze} style={{ fontSize: "0.75rem", padding: "0.6rem 1.5rem" }}>
              Analyze
            </button>
          </div>
        )}
      </motion.nav>

      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "fixed", top: 64, left: 0, right: 0,
              zIndex: 99, background: "rgba(6,13,20,0.98)",
              borderBottom: "1px solid var(--c-border)",
              backdropFilter: "blur(20px)",
              padding: "1.5rem 5vw",
              display: "flex", flexDirection: "column", gap: "1.2rem",
            }}
          >
            {["Technology", "Demo", "Pricing"].map(item => (
              <button key={item} onClick={() => setMenuOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: "1rem",
                fontWeight: 600, letterSpacing: "0.1em", color: "var(--c-text-muted)",
                textTransform: "uppercase", textAlign: "left", padding: "4px 0",
              }}>
                {item}
              </button>
            ))}
            <button className="btn-primary" onClick={() => { setMenuOpen(false); onAnalyze(); }}
              style={{ fontSize: "0.85rem", padding: "0.8rem 1.5rem" }}>
              ▷ Analyze
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = () => {
  const isMobile = useWindowWidth() < 768;
  const isTablet = useWindowWidth() < 1024;
  return (
  <footer style={{
    padding: "4rem 5vw 2rem",
    borderTop: "1px solid var(--c-border)",
    background: "#010204",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
        gap: isMobile ? "2rem" : "3rem",
        marginBottom: "3rem",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            <span style={{ color: "var(--c-cyan)" }}>◈</span> DENT VISION AI
          </div>
          <p style={{ color: "var(--c-text-dim)", fontSize: "0.85rem", lineHeight: 1.8, fontWeight: 300, maxWidth: 300 }}>
            Next-generation vehicle damage detection powered by deep learning. Built for insurers, rental fleets, and automotive professionals.
          </p>
        </div>
        {isTablet && !isMobile ? (
          // On tablet: merge 3 link columns into 2
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { title: "Platform", links: ["Technology", "API Docs", "Integrations", "Security"] },
                { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
                { title: "Legal", links: ["Privacy", "Terms", "Cookies", "GDPR"] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", letterSpacing: "0.2em", marginBottom: "1rem" }}>
                    {col.title}
                  </div>
                  {col.links.map(link => (
                    <div key={link} style={{ color: "var(--c-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem", cursor: "pointer", fontWeight: 300 }}>
                      {link}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : isMobile ? (
          // On mobile: all 3 columns in a single row
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            {[
              { title: "Platform", links: ["Technology", "API Docs", "Integrations", "Security"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookies", "GDPR"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", letterSpacing: "0.15em", marginBottom: "0.8rem" }}>
                  {col.title}
                </div>
                {col.links.map(link => (
                  <div key={link} style={{ color: "var(--c-text-muted)", fontSize: "0.75rem", marginBottom: "0.4rem", cursor: "pointer", fontWeight: 300 }}>
                    {link}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          [
            { title: "Platform", links: ["Technology", "API Docs", "Integrations", "Security"] },
            { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Cookies", "GDPR"] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", letterSpacing: "0.2em", marginBottom: "1rem" }}>
                {col.title}
              </div>
              {col.links.map(link => (
                <div key={link} style={{ color: "var(--c-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem", cursor: "pointer", fontWeight: 300 }}>
                  {link}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      <div style={{
        borderTop: "1px solid var(--c-border)",
        paddingTop: "1.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "1rem",
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", letterSpacing: "0.1em" }}>
          © {new Date().getFullYear()} DENT VISION AI — BUILT BY{" "}
          <a
            href="https://www.linkedin.com/in/shubhamk07/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--c-cyan)",
              textDecoration: "none",
              letterSpacing: "0.1em",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.target.style.opacity = "0.7"}
            onMouseLeave={e => e.target.style.opacity = "1"}
          >
            SAM ↗
          </a>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)" }}>
          SYS_V: 4.2.1 | MODEL: DVA-RESNET-152 | STATUS: OPERATIONAL
        </div>
      </div>
    </div>
  </footer>
  );
};

// ─── CHAPTER TRANSITION ───────────────────────────────────────────────────────
// Title-card wipe between the hero intro and section 01. A dark panel sweeps up to
// cover the screen, shows "CHAPTER 01 — DAMAGE CLASSIFICATION", then lifts away.
// onCovered fires while the screen is fully covered (the hero unmounts + the page
// jumps to 01 behind the panel, so no scroll motion is ever visible).
const ChapterTransition = ({ onCovered, onDone, isMobile }) => {
  const [phase, setPhase] = useState("cover"); // "cover" → "leave"
  const covered = phase !== "cover";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: phase === "leave" ? "-100%" : "0%" }}
      transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => {
        if (phase === "cover") {
          onCovered?.();
          setTimeout(() => setPhase("leave"), 750);
        } else {
          onDone?.();
        }
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "var(--c-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <GridBackground opacity={0.6} />
      {/* leading cyan edge of the wipe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--c-cyan), transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: covered ? 0 : 1, y: covered ? -12 : 0 }}
        transition={{ duration: 0.4, delay: covered ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", textAlign: "center", padding: "0 6vw" }}
      >
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "0.68rem",
          color: "var(--c-text-dim)", letterSpacing: "0.5em", marginBottom: "1.1rem",
        }}>
          CHAPTER
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: isMobile ? "clamp(4rem, 22vw, 6rem)" : "clamp(6rem, 12vw, 9rem)",
          lineHeight: 0.9, letterSpacing: "0.04em",
          background: "linear-gradient(90deg, var(--c-blue-bright), var(--c-cyan))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          marginBottom: "1.2rem",
        }}>
          01
        </div>
        {/* divider draws in */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: covered ? 0 : 1 }}
          transition={{ duration: 0.5, delay: covered ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: 1, width: isMobile ? 180 : 260, margin: "0 auto 1.2rem", background: "var(--c-cyan)", transformOrigin: "center" }}
        />
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: isMobile ? "0.8rem" : "0.95rem",
          color: "rgba(255,255,255,0.82)", letterSpacing: "0.28em",
        }}>
          ◈ DAMAGE CLASSIFICATION
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = ["Initializing AI Core", "Loading Neural Weights", "Calibrating Vision Model", "Systems Online"];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (Math.random() * 3 + 1);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        setPhase(Math.floor(next / 25));
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "var(--c-bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <GridBackground />

      {/* Rotating rings */}
      <div style={{ position: "relative", width: 160, height: 160, marginBottom: "3rem" }}>
        <div style={{
          position: "absolute", inset: 0, border: "1px solid rgba(0,212,255,0.3)",
          borderRadius: "50%",
          animation: "rotate-ring 3s linear infinite",
          borderTopColor: "var(--c-cyan)",
        }} />
        <div style={{
          position: "absolute", inset: 16, border: "1px solid rgba(59,139,235,0.2)",
          borderRadius: "50%",
          animation: "counter-rotate 2s linear infinite",
          borderBottomColor: "var(--c-blue)",
        }} />
        <div style={{
          position: "absolute", inset: 32, border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%",
          animation: "rotate-ring 4s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: "1.5rem",
          color: "var(--c-cyan)",
        }}>
          ◈
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>
        DENT VISION AI
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-cyan)", letterSpacing: "0.2em", marginBottom: "3rem" }}>
        {phases[Math.min(phase, 3)]}
      </div>

      <div style={{ width: 300 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: "var(--font-mono)", fontSize: "0.6rem",
          color: "var(--c-text-dim)", marginBottom: 8,
          letterSpacing: "0.1em",
        }}>
          <span>LOADING</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--c-blue), var(--c-cyan))",
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Two-phase load:
  //   fakeProgressDone → fake bar finished; mount the content so the Canvas starts warming up
  //   sceneReady       → SceneReadySignal fired (first real rendered frame)
  // The loading screen exits only when BOTH are true, so the garage is already drawn
  // the moment the loading screen slides away — zero black-screen gap.
  const [fakeProgressDone, setFakeProgressDone] = useState(false);
  const [sceneReady, setSceneReady]             = useState(false);
  const loaderDone  = fakeProgressDone && sceneReady;
  const showContent = fakeProgressDone;            // mount content early so Canvas warms up

  const uploadRef = useRef();

  const scrollToUpload = () => {
    window.dispatchEvent(new CustomEvent("dv:dismiss-hero"));
    requestAnimationFrame(() => {
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <GlobalStyle />
      <div className="noise-overlay" aria-hidden="true" />
      <h2 className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        Dent Vision AI — AI-powered vehicle damage detection platform
      </h2>

      {/* Loading screen stays until the 3D scene has fired its first real frame */}
      <AnimatePresence>
        {!loaderDone && <LoadingScreen key="loader" onComplete={() => setFakeProgressDone(true)} />}
      </AnimatePresence>

      {/* Content mounts as soon as fake-progress finishes (behind the loading screen)
          so WebGL context creation + shader compilation + GLB parsing happen in parallel. */}
      {showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Navigation onAnalyze={scrollToUpload} />
          <main>
            <HeroSection
              onAnalyze={scrollToUpload}
              onSceneReady={() => setSceneReady(true)}
            />
            <ScrollStory onScanTrigger={scrollToUpload} />
            <UploadSection sectionRef={uploadRef} />
          </main>
          <Footer />
        </motion.div>
      )}
    </>
  );
}
