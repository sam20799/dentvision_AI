/**
 * VehicleScene3D.jsx
 * Reusable Three.js vehicle scene components.
 * Used by HeroSection, ScrollStory, and UploadSection.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshReflectorMaterial, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ── Procedural car mesh (no external GLB required) ─────────────────────────
export function CarMesh({ color = '#0A0F1E', scanProgress = 0, damageZones = [], rotate = false }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current && rotate) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.25
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main chassis */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.5, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.92} roughness={0.08} envMapIntensity={2.5} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0.1, 0.6, 0]} castShadow>
        <boxGeometry args={[1.4, 0.45, 1.05]} />
        <meshStandardMaterial color="#080810" metalness={0.6} roughness={0.25} />
      </mesh>

      {/* Hood rake */}
      <mesh position={[0.9, 0.36, 0]} rotation={[0, 0, 0.22]} castShadow>
        <boxGeometry args={[0.85, 0.06, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.92} roughness={0.08} />
      </mesh>

      {/* Trunk rake */}
      <mesh position={[-0.78, 0.36, 0]} rotation={[0, 0, -0.16]} castShadow>
        <boxGeometry args={[0.75, 0.06, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.92} roughness={0.08} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0.6, 0.62, 0]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.6, 0.05, 1.0]} />
        <meshStandardMaterial color="#040408" metalness={0.4} roughness={0} transparent opacity={0.9} />
      </mesh>

      {/* Rear window */}
      <mesh position={[-0.55, 0.62, 0]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[0.55, 0.05, 1.0]} />
        <meshStandardMaterial color="#040408" metalness={0.4} roughness={0} transparent opacity={0.9} />
      </mesh>

      {/* Wheels */}
      {[[-0.92, -0.14, 0.66], [0.92, -0.14, 0.66], [-0.92, -0.14, -0.66], [0.92, -0.14, -0.66]].map((pos, i) => (
        <group key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 36]} />
            <meshStandardMaterial color="#090909" metalness={0.15} roughness={0.85} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.17, 0.17, 0.24, 20]} />
            <meshStandardMaterial color="#777" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.005, 0]}>
            <torusGeometry args={[0.22, 0.022, 8, 36]} />
            <meshStandardMaterial color="#444" metalness={0.85} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      {[[1.38, 0.18, 0.42], [1.38, 0.18, -0.42]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.07, 0.1, 0.2]} />
          <meshStandardMaterial color="#fff" emissive="#5599ff" emissiveIntensity={2.5} />
        </mesh>
      ))}

      {/* Taillights */}
      {[[-1.38, 0.18, 0.36], [-1.38, 0.18, -0.36]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.07, 0.08, 0.18]} />
          <meshStandardMaterial color="#ff1111" emissive="#ff1111" emissiveIntensity={2} />
        </mesh>
      ))}

      {/* Grille */}
      <mesh position={[1.4, 0.1, 0]}>
        <boxGeometry args={[0.06, 0.25, 0.7]} />
        <meshStandardMaterial color="#0A0A12" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* AI Scan beam */}
      {scanProgress > 0 && (
        <mesh position={[1.4 - scanProgress * 2.8, 0.3, 0]}>
          <boxGeometry args={[0.015, 1.8, 1.6]} />
          <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={4} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Damage zones */}
      {damageZones.map((zone, i) => (
        <mesh key={i} position={zone.position}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff2020" emissiveIntensity={3} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Dynamic lights */}
      <pointLight position={[2.5, 1.5, 0]} color="#3B8BEB" intensity={2} distance={6} />
      <pointLight position={[-2.5, 1, 0]} color="#00D4FF" intensity={1} distance={5} />
    </group>
  )
}

// ── Standard reflective floor ───────────────────────────────────────────────
export function ReflectiveFloor({ resolution = 512 }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={resolution}
          mixBlur={1}
          mixStrength={50}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#010408"
          metalness={0.8}
        />
      </mesh>
      <ContactShadows position={[0, -0.44, 0]} opacity={0.75} scale={6} blur={2} />
    </>
  )
}

// ── Hero scene with slow camera drift ──────────────────────────────────────
export function HeroVehicleScene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 6, 5]} intensity={1.8} castShadow color="#88AAFF" shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-6, 4, -4]} intensity={0.9} color="#002266" />
      <spotLight position={[0, 10, 0]} intensity={2.5} angle={0.25} penumbra={0.6} castShadow color="#ffffff" />
      <Environment preset="night" />
      <CarMesh color="#0A0F1E" rotate={true} />
      <ReflectiveFloor />
    </>
  )
}

// ── Scan scene ──────────────────────────────────────────────────────────────
export function ScanVehicleScene({ scanProgress = 0 }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} color="#3B8BEB" />
      <pointLight position={[0, 4, 0]} color="#00D4FF" intensity={2.5} distance={10} />
      <Environment preset="warehouse" />
      <CarMesh
        color="#111827"
        scanProgress={scanProgress}
        damageZones={scanProgress > 0.7 ? [
          { position: [1.1, 0.2, 0.52] },
          { position: [-0.85, 0.1, -0.57] },
        ] : []}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#030608" metalness={0.75} roughness={0.7} />
      </mesh>
      <ContactShadows position={[0, -0.44, 0]} opacity={0.6} scale={5} blur={1.5} />
    </>
  )
}

// ── Mini scene for grid cards ───────────────────────────────────────────────
export function MiniVehicleScene({ hue = 220 }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 2]} color="#3B8BEB" intensity={2} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
        <CarMesh color={`hsl(${hue}, 45%, 12%)`} />
      </Float>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#030508" metalness={0.7} roughness={0.8} />
      </mesh>
      <ContactShadows position={[0, -0.44, 0]} opacity={0.5} scale={4} blur={2} />
    </>
  )
}
