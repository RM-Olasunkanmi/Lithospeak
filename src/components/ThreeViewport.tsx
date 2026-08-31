import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { MeshData, PreviewMode } from "../types";

export interface SphereMarker {
  id: string;
  lon: number;
  lat: number;
  active: boolean;
  color: string;
}

export type ViewCommand = { type: "front" | "side" | "top" | "reset" | "fit"; token: number };

function toBufferGeometry(mesh: MeshData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.vertices, 3));
  geometry.setIndex(mesh.indices);
  geometry.computeVertexNormals();
  return geometry;
}

function sceneRadius(meshes: MeshData[]): number {
  let maxLenSq = 1;
  for (const mesh of meshes) {
    for (let i = 0; i < mesh.vertices.length; i += 3) {
      const lenSq = mesh.vertices[i] ** 2 + mesh.vertices[i + 1] ** 2 + mesh.vertices[i + 2] ** 2;
      if (lenSq > maxLenSq) maxLenSq = lenSq;
    }
  }
  return Math.sqrt(maxLenSq);
}

function CameraRig({ command, radius, controlsRef }: { command?: ViewCommand; radius: number; controlsRef: React.MutableRefObject<any> }) {
  const { camera } = useThree();
  const initial = useRef(false);

  useEffect(() => {
    if (initial.current) return;
    initial.current = true;
    camera.position.set(radius * 1.15, radius * 0.75, radius * 1.15);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  }, [camera, radius, controlsRef]);

  useEffect(() => {
    if (!command) return;
    const distance = Math.max(radius * 2.1, 60);
    const controls = controlsRef.current;
    if (command.type === "front") camera.position.set(0, 0, distance);
    if (command.type === "side") camera.position.set(distance, 0, 0);
    if (command.type === "top") camera.position.set(0, distance, 0.001);
    if (command.type === "reset" || command.type === "fit") camera.position.set(radius * 1.15, radius * 0.75, radius * 1.15);
    camera.lookAt(0, 0, 0);
    controls?.target.set(0, 0, 0);
    controls?.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.token]);

  return null;
}

function ViewMesh({
  mesh,
  mode,
  active,
  onSelect,
  onSpherePick
}: {
  mesh: MeshData;
  mode: PreviewMode;
  active: boolean;
  onSelect?: () => void;
  onSpherePick?: (lon: number, lat: number) => void;
}) {
  const geometry = useMemo(() => toBufferGeometry(mesh), [mesh]);
  const material = useMemo(() => {
    if (mode === "wireframe") {
      return new THREE.MeshStandardMaterial({ color: active ? "#ff8a3d" : "#7a828d", wireframe: true });
    }
    if (mode === "backlight") {
      return new THREE.MeshPhysicalMaterial({
        color: "#ffe9b8",
        emissive: new THREE.Color("#ffb95c"),
        emissiveIntensity: 1.15,
        roughness: 0.3,
        transmission: 0.1
      });
    }
    if (mode === "transmission") {
      return new THREE.MeshPhysicalMaterial({ color: "#f4f2ee", roughness: 0.45, transmission: 0.85, thickness: 0.7, clearcoat: 0.25 });
    }
    return new THREE.MeshStandardMaterial({ color: active ? "#eef1f4" : "#c7ccd3", roughness: 0.75, metalness: 0.04 });
  }, [active, mode]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
        if (!onSpherePick) return;
        const point = event.point.clone().normalize();
        const lat = 90 - (Math.acos(point.y) * 180) / Math.PI;
        const lon = ((Math.atan2(point.z, point.x) * 180) / Math.PI + 360) % 360;
        onSpherePick(lon, lat);
      }}
    />
  );
}

function Marker({ marker, radius, onSelect }: { marker: SphereMarker; radius: number; onSelect?: (id: string) => void }) {
  const phi = ((90 - marker.lat) * Math.PI) / 180;
  const theta = (marker.lon * Math.PI) / 180;
  const r = radius * 1.015;
  const position: [number, number, number] = [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(marker.id);
      }}
    >
      <sphereGeometry args={[marker.active ? radius * 0.032 : radius * 0.022, 16, 16]} />
      <meshBasicMaterial color={marker.color} toneMapped={false} />
    </mesh>
  );
}

function BuildPlate({ size, visible }: { size: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[0, -0.01, 0]}>
      <gridHelper args={[size, 10, "#3a4048", "#22262c"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0d0f13" roughness={1} />
      </mesh>
    </group>
  );
}

export default function ThreeViewport({
  meshes,
  mode,
  activePart,
  onPartSelect,
  onSpherePick,
  markers,
  onMarkerSelect,
  viewCommand,
  showGrid = true,
  buildPlateSize = 220
}: {
  meshes: MeshData[];
  mode: PreviewMode;
  activePart?: string;
  onPartSelect?: (name: string) => void;
  onSpherePick?: (lon: number, lat: number) => void;
  markers?: SphereMarker[];
  onMarkerSelect?: (id: string) => void;
  viewCommand?: ViewCommand;
  showGrid?: boolean;
  buildPlateSize?: number;
}) {
  const controlsRef = useRef<any>(null);
  const radius = useMemo(() => sceneRadius(meshes), [meshes]);

  return (
    <Canvas shadows camera={{ position: [140, 90, 140], fov: 40 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#0b0d10"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[radius * 2, radius * 3, radius * 1.6]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-radius * 2.2, radius * 0.6, -radius * 1.4]} intensity={0.6} color="#9db4ff" />
      <directionalLight position={[0, -radius * 1.5, radius * 1.2]} intensity={0.35} color="#ffcf9e" />

      {meshes.map((mesh) => (
        <ViewMesh
          key={mesh.name}
          mesh={mesh}
          mode={mode}
          active={mesh.name === activePart}
          onSelect={() => onPartSelect?.(mesh.name)}
          onSpherePick={mesh.metadata.shape === "sphere" || mesh.metadata.shape === "split-sphere" ? onSpherePick : undefined}
        />
      ))}

      {markers?.map((marker) => (
        <Marker key={marker.id} marker={marker} radius={radius} onSelect={onMarkerSelect} />
      ))}

      <BuildPlate size={buildPlateSize} visible={showGrid} />
      <CameraRig command={viewCommand} radius={radius} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.12} makeDefault />
    </Canvas>
  );
}
