"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  EffectComposer,
  ToneMapping,
  wrapEffect,
} from "@react-three/postprocessing";
import {
  BlendFunction,
  Effect,
  EffectAttribute,
  ToneMappingMode,
} from "postprocessing";
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  DoubleSide,
  HalfFloatType,
  Uniform,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import { useReducedMotion } from "framer-motion";

type Triplet = [number, number, number];
type TulipConfig = {
  isRed: boolean;
  pos: Triplet;
  rot: Triplet;
  scale: number;
  open: number;
};

const BOUQUET_LAYOUT: TulipConfig[] = [
  { isRed: true, pos: [0.12, 1.05, 0.55], rot: [0.18, -0.15, -0.08], scale: 1.05, open: 0.02 },
  { isRed: false, pos: [-0.82, 0.92, 0.25], rot: [0.16, 0.28, 0.18], scale: 0.98, open: 0 },
  { isRed: true, pos: [-1.22, 0.12, 0.75], rot: [0.48, 0.35, 0.32], scale: 1.02, open: 0.16 },
  { isRed: false, pos: [1.18, 0.42, 0.45], rot: [0.24, -0.45, -0.34], scale: 1, open: 0.03 },
  { isRed: false, pos: [1.02, 1.38, -0.35], rot: [0.12, -0.32, -0.26], scale: 0.94, open: -0.02 },
  { isRed: true, pos: [-1.52, 1.45, -0.15], rot: [0.15, 0.42, 0.28], scale: 1.02, open: 0.02 },
  { isRed: true, pos: [-0.32, 1.72, -0.45], rot: [0.1, 0.05, 0.06], scale: 1.06, open: 0.04 },
  { isRed: true, pos: [0.55, 1.25, -0.55], rot: [0.14, -0.22, -0.15], scale: 0.92, open: 0.03 },
  { isRed: false, pos: [-1.15, 1.32, -0.65], rot: [0.12, 0.25, 0.16], scale: 0.9, open: 0 },
];

type Surface = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
};

// Match PlaneGeometry's vertex order and triangle winding. Only CPU arrays are
// memoized; R3F owns and disposes the actual BufferGeometries and materials.
function createSurface(segU: number, segV: number, kind: "petal" | "leaf"): Surface {
  const count = (segU + 1) * (segV + 1);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices = new Uint16Array(segU * segV * 6);

  for (let row = 0; row <= segV; row++) {
    for (let column = 0; column <= segU; column++) {
      const i = row * (segU + 1) + column;
      const u = column / segU;
      const v = 1 - row / segV;
      let x: number;
      let y: number;
      let z: number;

      if (kind === "petal") {
        const width = Math.sin(Math.pow(v, 0.72) * Math.PI) * 0.72;
        x = (u - 0.5) * width;
        y = v * 1.28;
        z = Math.pow((u - 0.5) * 2, 2) * 0.22 * Math.sin(v * Math.PI)
          + Math.sin(v * Math.PI) * 0.24 - Math.pow(v, 3.2) * 0.14;
      } else {
        const width = Math.sin(Math.pow(v, 0.65) * Math.PI) * 0.42 * (1 - v * 0.35);
        x = (u - 0.5) * width;
        y = v * 2.55;
        z = Math.abs(u - 0.5) * 0.14 * (1 - v * 0.5) + Math.pow(v, 1.9) * 0.38;
      }

      positions.set([x, y, z], i * 3);
      uvs.set([u, v], i * 2);
    }
  }

  let offset = 0;
  for (let row = 0; row < segV; row++) {
    for (let column = 0; column < segU; column++) {
      const a = row * (segU + 1) + column;
      const b = a + segU + 1;
      indices.set([a, b, a + 1, b, b + 1, a + 1], offset);
      offset += 6;
    }
  }

  // Area-weighted vertex normals, equivalent to computeVertexNormals().
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const abX = positions[b] - positions[a];
    const abY = positions[b + 1] - positions[a + 1];
    const abZ = positions[b + 2] - positions[a + 2];
    const acX = positions[c] - positions[a];
    const acY = positions[c + 1] - positions[a + 1];
    const acZ = positions[c + 2] - positions[a + 2];
    const nx = abY * acZ - abZ * acY;
    const ny = abZ * acX - abX * acZ;
    const nz = abX * acY - abY * acX;

    for (const vertex of [a, b, c]) {
      normals[vertex] += nx;
      normals[vertex + 1] += ny;
      normals[vertex + 2] += nz;
    }
  }

  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    if (length > 0) {
      normals[i] /= length;
      normals[i + 1] /= length;
      normals[i + 2] /= length;
    }
  }

  return { positions, normals, uvs, indices };
}

function SurfaceGeometry({ surface }: { surface: Surface }) {
  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[surface.positions, 3]} />
      <bufferAttribute attach="attributes-normal" args={[surface.normals, 3]} />
      <bufferAttribute attach="attributes-uv" args={[surface.uvs, 2]} />
      <bufferAttribute attach="index" args={[surface.indices, 1]} />
    </bufferGeometry>
  );
}

// THREE.BokehPass is a three/examples Pass, which cannot be inserted into the
// pmndrs EffectComposer. Port its exact 41-tap shader to a depth-aware Effect.
// readDepth() uses the composer's depth texture, avoiding a second depth render.
// Preserve the sampled alpha so the CSS daylight gradient remains visible.
const BOKEH_FRAGMENT = /* glsl */ `
  uniform float focus;
  uniform float aperture;
  uniform float maxblur;
  uniform float aspect;
  uniform float nearClip;
  uniform float farClip;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float depth = readDepth(uv);
    float viewZ = (nearClip * farClip) / ((farClip - nearClip) * depth - farClip);
    vec2 aspectcorrect = vec2(1.0, aspect);
    vec2 dofblur = vec2(clamp((focus + viewZ) * aperture, -maxblur, maxblur));
    vec2 dofblur9 = dofblur * 0.9;
    vec2 dofblur7 = dofblur * 0.7;
    vec2 dofblur4 = dofblur * 0.4;
    vec4 col = inputColor;

    col += texture2D(inputBuffer, uv + vec2( 0.00,  0.40) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.15,  0.37) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.29,  0.29) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.37,  0.15) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.40,  0.00) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.37, -0.15) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.29, -0.29) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.15, -0.37) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.00, -0.40) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.15,  0.37) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.29,  0.29) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.37,  0.15) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.40,  0.00) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.37, -0.15) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2(-0.29, -0.29) * aspectcorrect * dofblur);
    col += texture2D(inputBuffer, uv + vec2( 0.15, -0.37) * aspectcorrect * dofblur);

    col += texture2D(inputBuffer, uv + vec2( 0.15,  0.37) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2(-0.37,  0.15) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2( 0.37, -0.15) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2(-0.15, -0.37) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2(-0.15,  0.37) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2( 0.37,  0.15) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2(-0.37, -0.15) * aspectcorrect * dofblur9);
    col += texture2D(inputBuffer, uv + vec2( 0.15, -0.37) * aspectcorrect * dofblur9);

    col += texture2D(inputBuffer, uv + vec2( 0.29,  0.29) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2( 0.40,  0.00) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2( 0.29, -0.29) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2( 0.00, -0.40) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2(-0.29,  0.29) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2(-0.40,  0.00) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2(-0.29, -0.29) * aspectcorrect * dofblur7);
    col += texture2D(inputBuffer, uv + vec2( 0.00,  0.40) * aspectcorrect * dofblur7);

    col += texture2D(inputBuffer, uv + vec2( 0.29,  0.29) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2( 0.40,  0.00) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2( 0.29, -0.29) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2( 0.00, -0.40) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2(-0.29,  0.29) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2(-0.40,  0.00) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2(-0.29, -0.29) * aspectcorrect * dofblur4);
    col += texture2D(inputBuffer, uv + vec2( 0.00,  0.40) * aspectcorrect * dofblur4);

    outputColor = col / 41.0;
  }
`;

type BokehOptions = { focus?: number; aperture?: number; maxblur?: number };

class TulipBokehEffect extends Effect {
  constructor({ focus = 5.65, aperture = 0.0028, maxblur = 0.0085 }: BokehOptions = {}) {
    super("TulipBokehEffect", BOKEH_FRAGMENT, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["focus", new Uniform(focus)],
        ["aperture", new Uniform(aperture)],
        ["maxblur", new Uniform(maxblur)],
        ["aspect", new Uniform(1)],
        ["nearClip", new Uniform(0.1)],
        ["farClip", new Uniform(50)],
      ]),
    });
  }

  override setSize(width: number, height: number) {
    const aspect = this.uniforms.get("aspect");
    if (aspect) aspect.value = width / Math.max(1, height);
  }
}

const BokehDepthOfField = wrapEffect(TulipBokehEffect);

type MotionState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scroll: number;
  targetScroll: number;
  time: number;
};

type SceneProps = { reducedMotion: boolean };
type MotionProps = SceneProps & { movement: RefObject<MotionState> };

function CameraRig({ movement, reducedMotion }: MotionProps) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch") return;
      movement.current.targetX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      movement.current.targetY = -(event.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    };
    const resetPointer = () => {
      movement.current.targetX = 0;
      movement.current.targetY = 0;
    };
    const updateScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      movement.current.targetScroll = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      invalidate();
    };

    updateScroll();
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("pointerleave", resetPointer);

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("pointerleave", resetPointer);
    };
  }, [invalidate, movement, reducedMotion]);

  useFrame(({ camera }, delta) => {
    const state = movement.current;
    const step = Math.min(delta, 0.05);
    const smoothing = 1 - Math.exp(-3 * step);
    state.time += step;
    state.x = reducedMotion ? 0 : state.x + (state.targetX - state.x) * smoothing;
    state.y = reducedMotion ? 0 : state.y + (state.targetY - state.y) * smoothing;
    state.scroll = reducedMotion
      ? state.targetScroll
      : state.scroll + (state.targetScroll - state.scroll) * (1 - Math.exp(-5 * step));

    camera.position.set(state.x * 0.42, 1.35 + state.y * 0.25 - state.scroll * 0.35, 6.2);
    camera.lookAt(state.x * 0.12, 1.05 - state.scroll * 0.2, 0);
  }, -2);

  return <PerspectiveCamera makeDefault fov={36} near={0.1} far={50} position={[0, 1.35, 6.2]} />;
}

function Tulip({
  config,
  index,
  petalSurface,
  leafSurface,
  stemCurve,
  movement,
  reducedMotion,
}: MotionProps & {
  config: TulipConfig;
  index: number;
  petalSurface: Surface;
  leafSurface: Surface;
  stemCurve: CatmullRomCurve3;
}) {
  const root = useRef<Group>(null);
  const petals = useRef<Array<Mesh | null>>([]);
  const phase = index * 0.85;
  const speed = 0.7 + (index % 3) * 0.18;

  useFrame(() => {
    const state = movement.current;
    if (root.current) {
      root.current.rotation.x = config.rot[0]
        + (reducedMotion ? 0 : Math.sin(state.time * speed + phase) * 0.032 - state.y * 0.06);
      root.current.rotation.z = config.rot[2]
        + (reducedMotion ? 0 : Math.cos(state.time * speed * 0.85 + phase) * 0.038 - state.x * 0.08);
    }

    petals.current.forEach((petal, petalIndex) => {
      if (!petal) return;
      const outer = petalIndex >= 3;
      petal.rotation.x = (outer ? -0.14 : -0.22) + config.open
        + state.scroll * (outer ? 0.24 : 0.14)
        + (reducedMotion ? 0 : Math.sin(state.time * 1.1 + phase) * 0.012);
    });
  });

  return (
    <group ref={root} position={config.pos} rotation={config.rot} scale={config.scale}>
      <mesh>
        <tubeGeometry args={[stemCurve, 12, 0.048, 8, false]} />
        <meshStandardMaterial color="#4b703c" roughness={0.62} />
      </mesh>

      <group>
        {Array.from({ length: 6 }, (_, petalIndex) => {
          const outer = petalIndex >= 3;
          const angle = (petalIndex % 3) * Math.PI * 2 / 3 + (outer ? Math.PI / 3 : 0);
          return (
            <group key={petalIndex} rotation={[0, angle, 0]}>
              <mesh
                ref={(node) => { petals.current[petalIndex] = node; }}
                castShadow
                receiveShadow
                rotation={[(outer ? -0.14 : -0.22) + config.open, 0, 0]}
                position={[0, 0, outer ? 0.14 : 0.1]}
                scale={outer ? [1.04, 0.98, 1.04] : 1}
              >
                <SurfaceGeometry surface={petalSurface} />
                <meshPhysicalMaterial
                  color={config.isRed ? "#9b0a15" : "#f1eadc"}
                  emissive={config.isRed ? "#220204" : "#1c1915"}
                  roughness={config.isRed ? 0.48 : 0.52}
                  metalness={config.isRed ? 0.02 : 0}
                  sheen={config.isRed ? 0.9 : 0.65}
                  sheenRoughness={config.isRed ? 0.38 : 0.45}
                  sheenColor={config.isRed ? "#e62e3d" : "#ffffff"}
                  side={DoubleSide}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {[0, 1].map((leafIndex) => (
        <mesh
          key={leafIndex}
          position={[leafIndex === 0 ? -0.06 : 0.06, -1.35, -0.04]}
          rotation={[-0.08, leafIndex === 0 ? 0.45 : -0.55, 0]}
          scale={0.95 + leafIndex * 0.1}
        >
          <SurfaceGeometry surface={leafSurface} />
          <meshPhysicalMaterial
            color="#3e6131"
            roughness={0.55}
            sheen={0.4}
            sheenColor="#7ca368"
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Bouquet({ movement, reducedMotion }: MotionProps) {
  const size = useThree((state) => state.size);
  const petalSurface = useMemo(() => createSurface(18, 24, "petal"), []);
  const leafSurface = useMemo(() => createSurface(10, 24, "leaf"), []);
  const stemCurve = useMemo(() => new CatmullRomCurve3([
    new Vector3(0, -2.2, 0),
    new Vector3(0.03, -1, 0.02),
    new Vector3(0, 0, 0),
  ]), []);
  const viewHeight = 2 * Math.tan(36 * Math.PI / 360) * 6.2;
  const viewWidth = viewHeight * size.width / Math.max(1, size.height);
  const scale = Math.min(1, viewWidth / 4.6, viewHeight / 5.5);

  return (
    <group scale={scale} position={[0, 1.05 - 0.65 * scale, 0]}>
      {BOUQUET_LAYOUT.map((config, index) => (
        <Tulip
          key={index}
          config={config}
          index={index}
          petalSurface={petalSurface}
          leafSurface={leafSurface}
          stemCurve={stemCurve}
          movement={movement}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function TulipScene({ reducedMotion }: SceneProps) {
  const movement = useRef<MotionState>({
    x: 0, y: 0, targetX: 0, targetY: 0, scroll: 0, targetScroll: 0, time: 0,
  });

  return (
    <>
      <fogExp2 attach="fog" args={["#e6e3da", 0.045]} />
      <CameraRig movement={movement} reducedMotion={reducedMotion} />
      <hemisphereLight args={["#fffdf8", "#3b4d34", 1.15]} />
      <directionalLight
        color="#fff6e8"
        intensity={2.1}
        position={[3.5, 5.5, 4]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-near={0.1}
        shadow-camera-far={14}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight color="#ffffff" intensity={1.4} position={[2.2, 4, -3.5]} />
      <Bouquet movement={movement} reducedMotion={reducedMotion} />

      {[
        { radius: 0.16, position: [0.35, 2.35, -2.5] as Triplet },
        { radius: 0.11, position: [0.62, 2.3, -2.5] as Triplet },
      ].map(({ radius, position }) => (
        <mesh key={radius} position={position}>
          <circleGeometry args={[radius, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}

      <EffectComposer multisampling={0} enableNormalPass={false} frameBufferType={HalfFloatType}>
        <BokehDepthOfField focus={5.65} aperture={0.0028} maxblur={0.0085} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}

class BackgroundBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function subscribeToVisibilityChange(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getVisibilitySnapshot() {
  return !document.hidden;
}

function getServerVisibilitySnapshot() {
  return true;
}

export default function TulipBackground() {
  const reducedMotion = Boolean(useReducedMotion());
  const visible = useSyncExternalStore(
    subscribeToVisibilityChange,
    getVisibilitySnapshot,
    getServerVisibilitySnapshot,
  );

  return (
    <div
      aria-hidden="true"
      className="tulip-background"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <BackgroundBoundary>
        <Canvas
          dpr={[1, 1.75]}
          shadows="percentage"
          frameloop={visible ? (reducedMotion ? "demand" : "always") : "never"}
          fallback={null}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
          onCreated={({ gl }) => gl.setClearColor("#000000", 0)}
          style={{ pointerEvents: "none" }}
        >
          <Suspense fallback={null}>
            <TulipScene reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </BackgroundBoundary>
    </div>
  );
}
