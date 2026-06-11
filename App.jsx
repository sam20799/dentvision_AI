
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, MeshReflectorMaterial, ContactShadows, Sphere, Box, Torus, Cylinder, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

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
      cursor: crosshair;
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
  `}</style>
);

// ─── PARTICLE FIELD ───────────────────────────────────────────────────────────
const ParticleField = () => {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 6,
  }));

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
            background: p.id % 3 === 0 ? "var(--c-cyan)" : p.id % 3 === 1 ? "var(--c-blue)" : "rgba(255,255,255,0.4)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.5, 1],
          }}
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
      position: "absolute", inset: 0,
      backgroundImage: `
        linear-gradient(rgba(59,139,235,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,139,235,0.06) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
      animation: "grid-shift 4s linear infinite",
    }} />
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 70% 50% at 50% 50%, transparent 0%, var(--c-bg) 100%)"
    }} />
  </div>
);

// ─── 3D VEHICLE SCENE ─────────────────────────────────────────────────────────
const CarBody = ({ color = "#1A1A2E", scanProgress = 0, damageZones = [] }) => {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main body */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.5, 1.2]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={2}
        />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.1, 0.6, 0]} castShadow>
        <boxGeometry args={[1.4, 0.45, 1.05]} />
        <meshStandardMaterial color="#0D0D1A" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Hood slope */}
      <mesh position={[0.9, 0.38, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.8, 0.08, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Trunk slope */}
      <mesh position={[-0.75, 0.38, 0]} rotation={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[0.7, 0.08, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0.62, 0.62, 0]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.55, 0.06, 1.0]} />
        <meshStandardMaterial color="#050510" metalness={0.5} roughness={0.0} transparent opacity={0.85} />
      </mesh>
      {/* Wheels */}
      {[[-0.9, -0.15, 0.65], [0.9, -0.15, 0.65], [-0.9, -0.15, -0.65], [0.9, -0.15, -0.65]].map((pos, i) => (
        <group key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 32]} />
            <meshStandardMaterial color="#0A0A0A" metalness={0.2} roughness={0.8} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.22, 16]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <torusGeometry args={[0.22, 0.025, 8, 32]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Headlights */}
      <mesh position={[1.38, 0.18, 0.4]}>
        <boxGeometry args={[0.08, 0.1, 0.2]} />
        <meshStandardMaterial color="#fff" emissive="#4488ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.38, 0.18, -0.4]}>
        <boxGeometry args={[0.08, 0.1, 0.2]} />
        <meshStandardMaterial color="#fff" emissive="#4488ff" emissiveIntensity={2} />
      </mesh>
      {/* Taillights */}
      <mesh position={[-1.38, 0.18, 0.35]}>
        <boxGeometry args={[0.08, 0.08, 0.18]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-1.38, 0.18, -0.35]}>
        <boxGeometry args={[0.08, 0.08, 0.18]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={1.5} />
      </mesh>

      {/* Scan beam */}
      {scanProgress > 0 && (
        <mesh position={[1.4 - scanProgress * 2.8, 0.3, 0]}>
          <boxGeometry args={[0.02, 1.5, 1.5]} />
          <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={3} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Damage zones */}
      {damageZones.map((zone, i) => (
        <mesh key={i} position={zone.position}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff2222"
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Point lights for drama */}
      <pointLight ref={glowRef} position={[2, 1, 0]} color="#3B8BEB" intensity={1.5} distance={5} />
      <pointLight position={[-2, 0.5, 0]} color="#00D4FF" intensity={0.8} distance={4} />
    </group>
  );
};

const HeroScene = () => {
  const { camera } = useThree();
  const groupRef = useRef();

  useFrame((state) => {
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
    camera.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    camera.lookAt(0, 0.2, 0);
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow color="#6BA5FF" />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#004499" />
      <spotLight position={[0, 8, 0]} intensity={2} angle={0.3} penumbra={0.5} castShadow color="#ffffff" />
      <Environment preset="night" />

      <group ref={groupRef}>
        <CarBody color="#0A0F1E" />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#010408"
          metalness={0.8}
        />
      </mesh>
      <ContactShadows position={[0, -0.44, 0]} opacity={0.7} scale={6} blur={2} />
    </>
  );
};

const ScanScene = ({ scanProgress }) => {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 5, 3]} intensity={1} color="#3B8BEB" />
      <pointLight position={[0, 3, 0]} color="#00D4FF" intensity={2} distance={8} />
      <Environment preset="warehouse" />

      <group ref={groupRef}>
        <CarBody color="#111827" scanProgress={scanProgress} damageZones={scanProgress > 0.7 ? [
          { position: [1.1, 0.2, 0.5] },
          { position: [-0.8, 0.1, -0.55] },
        ] : []} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#020608" metalness={0.8} roughness={0.6} />
      </mesh>
      <ContactShadows position={[0, -0.44, 0]} opacity={0.6} scale={5} blur={1.5} />
    </>
  );
};

// ─── SCAN OVERLAY EFFECT ──────────────────────────────────────────────────────
const ScanOverlay = ({ isScanning }) => {
  if (!isScanning) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
      overflow: "hidden",
    }}>
      <motion.div
        style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, var(--c-cyan), transparent)",
          boxShadow: "0 0 20px var(--c-cyan)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${i * 12.5}%`,
          left: 0, right: 0,
          height: 1,
          background: "rgba(0,212,255,0.08)",
        }} />
      ))}
    </div>
  );
};

// ─── DATA OVERLAY ─────────────────────────────────────────────────────────────
const DataOverlay = ({ visible }) => {
  const dataPoints = [
    { label: "FRONT_IMPACT_ZONE", value: "0.83", pos: { top: "20%", left: "8%" } },
    { label: "REAR_DEFORMATION", value: "0.61", pos: { top: "65%", right: "8%" } },
    { label: "CONFIDENCE", value: "97.4%", pos: { bottom: "20%", left: "8%" } },
    { label: "SEVERITY_INDEX", value: "HIGH", pos: { top: "30%", right: "8%" } },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {dataPoints.map((dp, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute", ...dp.pos,
                zIndex: 5,
              }}
              initial={{ opacity: 0, x: dp.pos.left ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              <div style={{
                background: "rgba(0,0,0,0.7)",
                border: "1px solid var(--c-border-bright)",
                padding: "8px 14px",
                backdropFilter: "blur(10px)",
              }}>
                <div style={{ fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: "var(--c-cyan)", letterSpacing: "0.1em", marginBottom: 2 }}>
                  {dp.label}
                </div>
                <div style={{ fontSize: "1rem", fontFamily: "var(--font-display)", color: "#fff" }}>
                  {dp.value}
                </div>
                <motion.div
                  style={{ height: 1, background: "var(--c-cyan)", marginTop: 4 }}
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                />
              </div>
              {/* Connecting line */}
              <div style={{
                position: "absolute",
                [dp.pos.left ? "right" : "left"]: "-30px",
                top: "50%",
                width: 30, height: 1,
                background: "var(--c-cyan)",
                opacity: 0.5,
              }} />
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
};

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
const HeroSection = ({ onAnalyze }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

  return (
    <section style={{
      position: "relative", height: "100vh", overflow: "hidden",
      display: "flex", alignItems: "center",
    }}>
      <GridBackground />
      <ParticleField />

      {/* 3D Canvas */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Canvas shadows camera={{ position: [0, 1.5, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 30%, rgba(2,4,8,0.7) 100%)",
        zIndex: 1,
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
        background: "linear-gradient(transparent, var(--c-bg))",
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", padding: "0 5vw" }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 40 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label" style={{ marginBottom: "1.5rem" }}>
            ◈ NEXT-GEN AUTOMOTIVE INTELLIGENCE
          </div>
          <h1 className="hero-headline">
            <span style={{ display: "block" }}>DENT</span>
            <motion.span
              style={{
                display: "block",
                background: "linear-gradient(90deg, var(--c-blue-bright), var(--c-cyan))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              VISION
            </motion.span>
            <span style={{ display: "block", color: "rgba(255,255,255,0.15)", WebkitTextStroke: "1px rgba(255,255,255,0.15)", WebkitTextFillColor: "transparent" }}>AI</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              fontFamily: "var(--font-body)", fontSize: "clamp(1rem, 2vw, 1.25rem)",
              fontWeight: 300, letterSpacing: "0.1em", color: "var(--c-text-muted)",
              maxWidth: 500, marginTop: "1.5rem", marginBottom: "2.5rem",
              lineHeight: 1.6,
            }}
          >
            AI-Powered Vehicle Damage Detection in Seconds
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <button className="btn-primary" onClick={onAnalyze}>
              ▷ Analyze Damage
            </button>
            <button className="btn-ghost">
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 2 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", textAlign: "right" }}>
          <div>SYS_STATUS: ACTIVE</div>
          <div style={{ color: "var(--c-cyan)" }}>AI_CORE: ONLINE</div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2,
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", letterSpacing: "0.2em" }}>SCROLL</div>
        <div style={{ width: 1, height: 40, background: "linear-gradient(var(--c-cyan), transparent)" }} />
      </motion.div>
    </section>
  );
};

// ─── STORY SCENE ──────────────────────────────────────────────────────────────
const StoryScene = ({ number, label, children, align = "left" }) => {
  const ref = useRef();
  const inView = useInView(ref, { threshold: 0.3, once: false });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 60 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "8vh 5vw",
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
  const containerRef = useRef();
  const [scanProgress, setScanProgress] = useState(0);
  const [showDataOverlay, setShowDataOverlay] = useState(false);
  const [activeScene, setActiveScene] = useState(0);

  // ✅ Persist across renders and scroll events
  const hasTriggered = useRef(false);
  const animationId = useRef(null);

const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start end", "end start"], // ← ADD THIS
});

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setActiveScene(Math.floor(v * 5));

      const inScanScene = v > 0.25 && v < 0.65; // ✅ wider exit boundary

      // RESET when leaving scene
      if (!inScanScene) {
        // ✅ Only reset if we were previously triggered
        if (hasTriggered.current) {
          hasTriggered.current = false;
          setScanProgress(0);
          setShowDataOverlay(false);
        }

        if (animationId.current) {
          cancelAnimationFrame(animationId.current);
          animationId.current = null;
        }
        return;
      }

      // ✅ Trigger earlier so animation has room to complete
      if (v > 0.30 && !hasTriggered.current) {
        hasTriggered.current = true;

        let start = null;

        const runScan = (t) => {
          if (!start) start = t;

          const progress = (t - start) / 2500;
          const value = Math.min(progress, 1);

          setScanProgress(value);

          if (value < 1) {
            animationId.current = requestAnimationFrame(runScan);
          } else {
            animationId.current = null;
            setShowDataOverlay(true);
          }
        };

        animationId.current = requestAnimationFrame(runScan);
      }
    });

    return () => {
      unsub();
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [scrollYProgress]); // ✅ scrollYProgress is stable, effect runs once

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
    <div ref={containerRef} style={{ background: "var(--c-bg2)" }}>
      <GridBackground opacity={0.5} />

      {/* Scene 1: Vehicle Entry */}
      <StoryScene number="01" label="◈ VEHICLE ACQUISITION">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 0.95,
              marginBottom: "1.5rem",
              letterSpacing: "0.03em",
            }}>
              EVERY VEHICLE TELLS A STORY
            </h2>
            <p style={{ color: "var(--c-text-muted)", lineHeight: 1.8, fontWeight: 300, fontSize: "1.05rem" }}>
              Upload any vehicle image — front, rear, or side — and watch our vision model parse every surface, panel, and structural element with forensic precision.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {["JPG", "PNG", "WEBP", "HEIC"].map(fmt => (
                <span key={fmt} style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                  border: "1px solid var(--c-border)", padding: "4px 12px",
                  color: "var(--c-text-dim)", letterSpacing: "0.1em",
                }}>{fmt}</span>
              ))}
            </div>
          </div>
          <div style={{
            height: 300, position: "relative",
            border: "1px solid var(--c-border)",
            overflow: "hidden",
          }}>
            <Canvas camera={{ position: [0, 1.2, 4.5], fov: 50 }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.3} />
                <pointLight position={[3, 3, 3]} color="#3B8BEB" intensity={2} />
                <pointLight position={[-3, 2, -3]} color="#00D4FF" intensity={1} />
                <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
                  <CarBody color="#111827" />
                </Float>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
                  <planeGeometry args={[10, 10]} />
                  <meshStandardMaterial color="#050810" metalness={0.8} roughness={0.8} />
                </mesh>
                <ContactShadows position={[0, -0.44, 0]} opacity={0.5} scale={5} blur={2} />
              </Suspense>
            </Canvas>
            <ScanOverlay isScanning={false} />
          </div>
        </div>
      </StoryScene>

      {/* Scene 2: AI Scanning */}
      <StoryScene number="02" label="◉ AI NEURAL SCAN">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div style={{
            height: 350, position: "relative",
            border: "1px solid rgba(0,212,255,0.15)",
            overflow: "hidden",
          }}>
            <Canvas camera={{ position: [0, 1.2, 4.5], fov: 50 }}>
              <Suspense fallback={null}>
                <ScanScene scanProgress={scanProgress} />
              </Suspense>
            </Canvas>
            <ScanOverlay isScanning={scanProgress > 0 && scanProgress < 1} />
            <DataOverlay visible={showDataOverlay} />

            {/* Live indicator */}
            <div style={{
              position: "absolute", top: 16, left: 16, zIndex: 10,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <motion.div
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-cyan)" }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-cyan)" }}>
                SCANNING...
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", marginBottom: 4,
                fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)",
              }}>
                <span>SCAN_PROGRESS</span>
                <span>{Math.round(scanProgress * 100)}%</span>
              </div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <motion.div style={{
                  height: "100%",
                  background: "linear-gradient(90deg, var(--c-blue), var(--c-cyan))",
                  width: `${scanProgress * 100}%`,
                }} />
              </div>
            </div>
          </div>

          <div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 0.95,
              marginBottom: "1.5rem",
              letterSpacing: "0.03em",
            }}>
              INTELLIGENT<br />
              <span style={{ color: "var(--c-cyan)" }}>NEURAL</span><br />
              SCANNING
            </h2>
            <p style={{ color: "var(--c-text-muted)", lineHeight: 1.8, fontWeight: 300, fontSize: "1.05rem" }}>
              A high-resolution convolutional network sweeps every pixel. Scanning lines isolate damage zones while suppressing false positives through multi-pass confidence scoring.
            </p>
            <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Resolution", value: "4096×4096" },
                { label: "Layers", value: "152 Deep" },
                { label: "Inference", value: "< 300ms" },
                { label: "GPU Cores", value: "A100 × 8" },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "12px 16px",
                  background: "rgba(0,212,255,0.04)",
                  border: "1px solid rgba(0,212,255,0.1)",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--c-cyan)" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StoryScene>

      {/* Scene 3: Inspection */}
      <StoryScene number="03" label="◐ DAMAGE CLASSIFICATION">
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8, borderColor: "rgba(0,212,255,0.3)" }}
              style={{
                padding: "2rem",
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

      {/* Scene 4: Scalability */}
      <StoryScene number="04" label="◑ ENTERPRISE SCALE">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <motion.div
                key={i}
                style={{
                  height: 80,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--c-border)",
                  position: "relative",
                  overflow: "hidden",
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
                <Canvas camera={{ position: [0, 0.8, 3], fov: 60 }}>
                  <ambientLight intensity={0.4} />
                  <pointLight position={[2, 2, 2]} color="#3B8BEB" intensity={1.5} />
                  <Float speed={2} rotationIntensity={0.5} floatIntensity={0.2}>
                    <CarBody color={`hsl(${220 + i * 10}, 40%, 15%)`} />
                  </Float>
                </Canvas>
              </motion.div>
            ))}
          </div>
        </div>
      </StoryScene>

      {/* Scene 5: CTA */}
      <StoryScene number="05" label="◒ BEGIN ANALYSIS">
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

// ─── UPLOAD SECTION ───────────────────────────────────────────────────────────
const UploadSection = ({ sectionRef }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [scanStage, setScanStage] = useState(0);
  const fileInputRef = useRef();

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setResults(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setScanning(true);
    setResults(null);
    setError(null);
    setScanStage(0);

    const stages = ["Initializing neural network...", "Parsing image structure...", "Running damage classifier...", "Computing confidence scores..."];
    for (let i = 0; i < stages.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setScanStage(i + 1);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/predict`, {method: "POST",body: formData});
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      // Demo fallback when no backend
      const demoClasses = ["F_Breakage", "F_Crushed", "F_Normal", "R_Breakage", "R_Crushed", "R_Normal"];
      const picked = demoClasses[Math.floor(Math.random() * demoClasses.length)];
      setResults({
        class: picked,
        confidence: (Math.random() * 0.2 + 0.78).toFixed(3),
        all_scores: demoClasses.reduce((acc, c) => {
          acc[c] = parseFloat((Math.random() * 0.15 + (c === picked ? 0.78 : 0.02)).toFixed(3));
          return acc;
        }, {}),
        demo: true,
      });
    } finally {
      setScanning(false);
    }
  };

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

  const scanMessages = [
    "Initializing neural network...",
    "Parsing image structure...",
    "Running damage classifier...",
    "Computing confidence scores...",
  ];

  return (
    <section ref={sectionRef} style={{ padding: "10vh 5vw", position: "relative", minHeight: "100vh" }}>
      <GridBackground opacity={0.3} />
      <ParticleField />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div className="section-label" style={{ marginBottom: "1rem" }}>◈ DAMAGE ANALYSIS TERMINAL</div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            letterSpacing: "0.05em",
          }}>UPLOAD & ANALYZE</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "1fr", gap: "2rem" }}>
          {/* Upload zone */}
          <motion.div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !preview && fileInputRef.current?.click()}
            animate={{
              borderColor: dragOver ? "rgba(0,212,255,0.6)" : preview ? "rgba(59,139,235,0.3)" : "rgba(255,255,255,0.1)",
              background: dragOver ? "rgba(0,212,255,0.05)" : "rgba(255,255,255,0.02)",
            }}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              padding: preview ? "1.5rem" : "4rem 2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: preview ? "default" : "pointer",
              position: "relative",
              overflow: "hidden",
              minHeight: 280,
              transition: "border-color 0.3s, background 0.3s",
            }}
          >
            {/* Corner markers */}
            {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h], i) => (
              <div key={i} style={{
                position: "absolute",
                [v]: 8, [h]: 8,
                width: 16, height: 16,
                borderTop: v === "top" ? "2px solid var(--c-cyan)" : "none",
                borderBottom: v === "bottom" ? "2px solid var(--c-cyan)" : "none",
                borderLeft: h === "left" ? "2px solid var(--c-cyan)" : "none",
                borderRight: h === "right" ? "2px solid var(--c-cyan)" : "none",
                opacity: 0.5,
              }} />
            ))}

            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Vehicle preview"
                  style={{
                    maxWidth: "100%", maxHeight: 320,
                    objectFit: "contain",
                    filter: scanning ? "brightness(0.5) saturate(0.3)" : "brightness(1)",
                    transition: "filter 0.5s",
                  }}
                />
                {scanning && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <motion.div
                      style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--c-cyan), transparent)" }}
                      animate={{ top: ["0%", "100%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                    <div style={{ zIndex: 1, textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--c-cyan)", marginBottom: 12 }}>
                        ANALYZING
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--c-text-muted)" }}>
                        {scanMessages[Math.min(scanStage - 1, 3)] || "Processing..."}
                      </div>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 12 }}>
                        {Array.from({ length: 4 }, (_, i) => (
                          <motion.div
                            key={i}
                            style={{ width: 8, height: 8, background: i < scanStage ? "var(--c-cyan)" : "rgba(255,255,255,0.1)" }}
                            animate={i < scanStage ? { opacity: [1, 0.5, 1] } : {}}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {!scanning && !results && (
                    <motion.button
                      className="btn-primary"
                      onClick={analyze}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      ▷ Run AI Analysis
                    </motion.button>
                  )}
                  <button
                    className="btn-ghost"
                    onClick={() => { setFile(null); setPreview(null); setResults(null); }}
                    style={{ fontSize: "0.8rem" }}
                  >
                    ↺ New Image
                  </button>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  style={{ fontSize: "4rem", marginBottom: "1.5rem", color: "var(--c-text-dim)" }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ⬆
                </motion.div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  DROP VEHICLE IMAGE
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--c-text-dim)", letterSpacing: "0.15em" }}>
                  OR CLICK TO BROWSE
                </div>
                <div style={{
                  marginTop: "2rem", padding: "8px 20px",
                  border: "1px solid var(--c-border)",
                  fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                  color: "var(--c-text-dim)", letterSpacing: "0.15em",
                }}>
                  JPG · PNG · WEBP · HEIC · MAX 20MB
                </div>
              </>
            )}
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  border: "1px solid rgba(59,139,235,0.2)",
                  background: "rgba(59,139,235,0.03)",
                  padding: "2rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${getClassColor(results.class)}, transparent)`,
                }} />

                {results.demo && (
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-gold)",
                    letterSpacing: "0.15em", marginBottom: "1.5rem",
                    padding: "4px 12px", border: "1px solid rgba(200,148,58,0.2)",
                    display: "inline-block",
                  }}>
                    DEMO MODE — CONNECT BACKEND FOR LIVE RESULTS
                  </div>
                )}

                <div className="section-label" style={{ marginBottom: "0.5rem" }}>
                  CLASSIFICATION RESULT
                </div>

                {/* Main class */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                    color: "var(--c-text-dim)", marginBottom: 4,
                    letterSpacing: "0.1em",
                  }}>{getClassIcon(results.class)}</div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "3rem",
                    color: getClassColor(results.class),
                    lineHeight: 1,
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem",
                  }}>
                   {results.class
                      .replace("F_Normal", "NO DAMAGE DETECTED")
                      .replace("F_Breakage", "FRONT IMPACT · BREAKAGE")
                      .replace("F_Crushed", "FRONT IMPACT · CRUSHED")
                      .replace("R_Normal", "NO DAMAGE DETECTED")
                      .replace("R_Breakage", "REAR IMPACT · BREAKAGE")
                      .replace("R_Crushed", "REAR IMPACT · CRUSHED")
                    }
                  </div>
                  <div style={{
                    display: "flex", gap: "1.5rem", marginBottom: "2rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                    color: "var(--c-text-muted)", letterSpacing: "0.1em",
                  }}>
                    <span>CONFIDENCE: <span style={{ color: getClassColor(results.class) }}>{(results.confidence * 100).toFixed(1)}%</span></span>
                    <span>SEVERITY: <span style={{ color: getClassColor(results.class) }}>{getSeverity(results.class)}</span></span>
                  </div>
                </motion.div>

                {/* All scores */}
                {results.all_scores && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--c-text-dim)", letterSpacing: "0.15em", marginBottom: "1rem" }}>
                      ALL CLASS PROBABILITIES
                    </div>
                    {Object.entries(results.all_scores)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cls, score], i) => (
                        <motion.div
                          key={cls}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          style={{ marginBottom: 10 }}
                        >
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                            color: cls === results.class ? getClassColor(cls) : "var(--c-text-dim)",
                            marginBottom: 4, letterSpacing: "0.05em",
                          }}>
                            <span>{cls}</span>
                            <span>{(score * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(score * 100, 100)}%` }}
                              transition={{ duration: 0.8, delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                              style={{
                                height: "100%",
                                background: cls === results.class
                                  ? getClassColor(cls)
                                  : "rgba(255,255,255,0.15)",
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                  </motion.div>
                )}

                {/* Recommendation */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    background: "rgba(0,0,0,0.3)",
                    borderLeft: `3px solid ${getClassColor(results.class)}`,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--c-text-dim)", letterSpacing: "0.15em", marginBottom: 4 }}>AI RECOMMENDATION</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--c-text-muted)", lineHeight: 1.6 }}>
                    {results?.class?.includes("Normal")
                      ? "Vehicle appears structurally intact. Cosmetic assessment may still be warranted."
                      : results?.class?.includes("Crushed")
                        ? "Significant structural damage detected. Immediate professional assessment recommended."
                        : "Panel breakage identified. Workshop evaluation and repair estimate advised."}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </section>
  );
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const Navigation = ({ onAnalyze }) => {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 100], ["rgba(2,4,8,0)", "rgba(2,4,8,0.95)"]);

  return (
    <motion.nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        zIndex: 100, background: bg,
        borderBottom: "1px solid transparent",
        padding: "0 5vw",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
        backdropFilter: "blur(20px)",
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
    </motion.nav>
  );
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{
    padding: "4rem 5vw 2rem",
    borderTop: "1px solid var(--c-border)",
    background: "#010204",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            <span style={{ color: "var(--c-cyan)" }}>◈</span> DENT VISION AI
          </div>
          <p style={{ color: "var(--c-text-dim)", fontSize: "0.85rem", lineHeight: 1.8, fontWeight: 300, maxWidth: 300 }}>
            Next-generation vehicle damage detection powered by deep learning. Built for insurers, rental fleets, and automotive professionals.
          </p>
        </div>
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
  const [loaded, setLoaded] = useState(false);
  const uploadRef = useRef();

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <GlobalStyle />
      <div className="noise-overlay" aria-hidden="true" />
      <h2 className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        Dent Vision AI — AI-powered vehicle damage detection platform
      </h2>

      <AnimatePresence>
        {!loaded && <LoadingScreen key="loader" onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Navigation onAnalyze={scrollToUpload} />
          <main>
            <HeroSection onAnalyze={scrollToUpload} />
            <ScrollStory onScanTrigger={scrollToUpload} />
            <UploadSection sectionRef={uploadRef} />
          </main>
          <Footer />
        </motion.div>
      )}
    </>
  );
}
