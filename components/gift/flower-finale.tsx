"use client";

import { Component, Suspense, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  Sparkles,
  Sphere,
} from "@react-three/drei";
import type { Group } from "three";

type FlowerFinaleProps = {
  reducedMotion: boolean;
};

function FlowerFallback() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pt-[16dvh]"
      role="img"
      aria-label="وردة وردية مضيئة ليك"
    >
      <svg
        viewBox="-150 -160 300 370"
        className="h-[min(64dvh,34rem)] w-[min(80vw,25rem)] overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="gift-petal">
            <stop offset="0%" stopColor="#FFF0E9" />
            <stop offset="65%" stopColor="#EFC5D0" />
            <stop offset="100%" stopColor="#DFA8BA" />
          </radialGradient>

          <radialGradient id="gift-center">
            <stop offset="0%" stopColor="#FFF8D7" />
            <stop offset="100%" stopColor="#DCB66F" />
          </radialGradient>
        </defs>

        <path
          d="M0 40 Q-9 105 0 185"
          fill="none"
          stroke="#C2A16B"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <ellipse
          cx="20"
          cy="122"
          rx="12"
          ry="35"
          transform="rotate(35 20 122)"
          fill="#CCB58A"
        />

        {Array.from({ length: 10 }, (_, index) => (
          <ellipse
            key={index}
            cx="0"
            cy="-49"
            rx="29"
            ry="71"
            transform={`rotate(${index * 36})`}
            fill="url(#gift-petal)"
            opacity="0.9"
          />
        ))}

        <circle r="30" fill="url(#gift-center)" />
        <circle r="13" fill="#FFF9DF" opacity="0.6" />
      </svg>
    </div>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <FlowerFallback /> : this.props.children;
  }
}

function ProceduralFlower({ reducedMotion }: FlowerFinaleProps) {
  const flower = useRef<Group>(null);
  const viewport = useThree((state) => state.viewport);

  // Fit the bloom and stem on narrow mobile screens.
  const scale = Math.min(1, viewport.width / 4.8, viewport.height / 6.8);

  useFrame((_, delta) => {
    if (flower.current && !reducedMotion) {
      flower.current.rotation.z += Math.min(delta, 0.05) * 0.045;
    }
  });

  return (
    <>
      <ambientLight intensity={1.7} />
      <hemisphereLight args={["#FFF1E7", "#E0BDD0", 1.8]} />
      <pointLight position={[3, 3, 4]} color="#FFE6B7" intensity={28} />
      <pointLight position={[-3, 1, 2]} color="#F4BDD2" intensity={14} />
      <pointLight position={[0, -2, 3]} color="#FFF3CF" intensity={7} />

      <Float
        enabled={!reducedMotion}
        speed={0.75}
        rotationIntensity={0.12}
        floatIntensity={0.28}
        floatingRange={[-0.12, 0.12]}
      >
        <group
          ref={flower}
          position={[0, -0.35, 0]}
          scale={scale}
          rotation={[-0.12, 0.06, 0]}
        >
          {/* Gold stem */}
          <mesh position={[0, -2.02, -0.13]} rotation={[0, 0, -0.035]}>
            <cylinderGeometry args={[0.045, 0.065, 2.15, 12]} />
            <meshStandardMaterial
              color="#BEA06B"
              metalness={0.45}
              roughness={0.4}
              emissive="#A68851"
              emissiveIntensity={0.08}
            />
          </mesh>

          {/* Sculpted gold leaves */}
          <Sphere
            args={[1, 24, 16]}
            position={[0.32, -1.9, -0.12]}
            rotation={[0, 0, -0.75]}
            scale={[0.19, 0.58, 0.08]}
          >
            <meshStandardMaterial
              color="#CEB987"
              metalness={0.25}
              roughness={0.42}
            />
          </Sphere>

          <Sphere
            args={[1, 24, 16]}
            position={[-0.25, -2.35, -0.14]}
            rotation={[0, 0, 0.8]}
            scale={[0.15, 0.43, 0.07]}
          >
            <meshStandardMaterial
              color="#BBA67C"
              metalness={0.25}
              roughness={0.42}
            />
          </Sphere>

          {/* Outer petal ring */}
          {Array.from({ length: 10 }, (_, index) => {
            const angle = (index / 10) * Math.PI * 2;

            return (
              <Sphere
                key={`outer-${index}`}
                args={[1, 32, 24]}
                position={[
                  Math.cos(angle) * 1.03,
                  Math.sin(angle) * 1.03,
                  -0.1,
                ]}
                rotation={[0.08, 0.1, angle - Math.PI / 2]}
                scale={[0.48, 0.93, 0.24]}
              >
                <MeshDistortMaterial
                  color={index % 2 === 0 ? "#F0CBD5" : "#E9B9CA"}
                  emissive="#E9AFC5"
                  emissiveIntensity={0.2}
                  roughness={0.3}
                  metalness={0.12}
                  clearcoat={0.65}
                  clearcoatRoughness={0.3}
                  distort={0.11}
                  speed={reducedMotion ? 0 : 0.45}
                />
              </Sphere>
            );
          })}

          {/* Smaller petals give the bloom depth */}
          {Array.from({ length: 7 }, (_, index) => {
            const angle = (index / 7) * Math.PI * 2 + Math.PI / 7;

            return (
              <Sphere
                key={`inner-${index}`}
                args={[1, 32, 24]}
                position={[
                  Math.cos(angle) * 0.53,
                  Math.sin(angle) * 0.53,
                  0.24,
                ]}
                rotation={[0.04, -0.08, angle - Math.PI / 2]}
                scale={[0.34, 0.65, 0.2]}
              >
                <MeshDistortMaterial
                  color="#F8DDE0"
                  emissive="#F2C3D0"
                  emissiveIntensity={0.25}
                  roughness={0.27}
                  metalness={0.1}
                  clearcoat={0.7}
                  distort={0.09}
                  speed={reducedMotion ? 0 : 0.35}
                />
              </Sphere>
            );
          })}

          {/* Luminous gold heart */}
          <Sphere
            args={[1, 32, 24]}
            position={[0, 0, 0.43]}
            scale={[0.42, 0.42, 0.24]}
          >
            <MeshDistortMaterial
              color="#F6DA99"
              emissive="#FFD999"
              emissiveIntensity={0.8}
              metalness={0.45}
              roughness={0.22}
              clearcoat={0.7}
              distort={0.08}
              speed={reducedMotion ? 0 : 0.4}
            />
          </Sphere>

          <Sphere
            args={[1, 24, 16]}
            position={[0, 0, 0.53]}
            scale={[0.19, 0.19, 0.09]}
          >
            <meshBasicMaterial color="#FFF0C7" toneMapped={false} />
          </Sphere>

          {/* Small glowing beads around the flower center */}
          {Array.from({ length: 12 }, (_, index) => {
            const angle = (index / 12) * Math.PI * 2;

            return (
              <Sphere
                key={`gold-${index}`}
                args={[0.043, 12, 8]}
                position={[
                  Math.cos(angle) * 0.3,
                  Math.sin(angle) * 0.3,
                  0.61,
                ]}
              >
                <meshBasicMaterial color="#FFF3C9" toneMapped={false} />
              </Sphere>
            );
          })}
        </group>
      </Float>

      <Sparkles
        count={60}
        scale={[6, 6, 3]}
        position={[0, -0.3, 0]}
        size={2.8}
        speed={reducedMotion ? 0 : 0.22}
        opacity={0.7}
        color="#DAB989"
        noise={[0.3, 0.5, 0.2]}
      />

      <Sparkles
        count={24}
        scale={[4, 4, 2]}
        size={3.5}
        speed={reducedMotion ? 0 : 0.14}
        opacity={0.45}
        color="#E8ADC2"
      />
    </>
  );
}

export default function FlowerFinale({ reducedMotion }: FlowerFinaleProps) {
  return (
    <div
      className="absolute inset-0"
      role="img"
      aria-label="وردة ثلاثية الأبعاد وردية وذهبية، وحولها أنوار صغيرة"
    >
      <SceneBoundary>
        <Canvas
          camera={{ position: [0, 0.3, 9], fov: 42, near: 0.1, far: 40 }}
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? "demand" : "always"}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "low-power",
          }}
          fallback={<FlowerFallback />}
          style={{ width: "100%", height: "100%" }}
        >
          <Suspense fallback={null}>
            <ProceduralFlower reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
