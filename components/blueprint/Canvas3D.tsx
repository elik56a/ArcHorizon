
import React, { useEffect, Suspense, useRef, useState } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid as Grid3D, Environment, ContactShadows, Html } from '@react-three/drei';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import * as THREE from 'three';
import { Render3DElement } from './ElementRenderer'; 

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      ambientLight: any;
      directionalLight: any;
      orthographicCamera: any;
      [elemName: string]: any;
    }
  }
}

const WALL_HEIGHT = 280; 
const WALL_THICKNESS = 25; // MATCH 2D
const FLOOR_PITCH = 300; 

// --- WALL GENERATOR ---
interface Hole {
  start: number;
  width: number;
  bottom: number;
  height: number;
}

interface WallGeneratorProps {
  length: number;
  height: number;
  thickness: number;
  holes: Hole[];
  position: [number, number, number]; 
  rotation: [number, number, number];
}

const WallGenerator: React.FC<WallGeneratorProps> = ({ length, height, thickness, holes, position, rotation }) => {
  const sortedHoles = [...holes].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  sortedHoles.forEach((hole, idx) => {
      // Ensure hole is within bounds (Simple clamping to avoid artifacts if logic fails elsewhere)
      const holeStart = Math.max(0, hole.start);
      const holeEnd = Math.min(length, hole.start + hole.width);
      const holeW = holeEnd - holeStart;
      
      if (holeW <= 0) return;

      const solidLength = holeStart - cursor;
      if (solidLength > 1) {
          segments.push({ type: 'solid', width: solidLength, height: height, x: cursor + solidLength / 2, y: height / 2 });
      }
      if (hole.bottom > 1) {
          segments.push({ type: 'sill', width: holeW, height: hole.bottom, x: holeStart + holeW / 2, y: hole.bottom / 2 });
      }
      const headerHeight = height - (hole.bottom + hole.height);
      if (headerHeight > 1) {
          segments.push({ type: 'header', width: holeW, height: headerHeight, x: holeStart + holeW / 2, y: height - headerHeight / 2 });
      }
      cursor = holeEnd;
  });

  const remaining = length - cursor;
  if (remaining > 1) {
      segments.push({ type: 'solid', width: remaining, height: height, x: cursor + remaining / 2, y: height / 2 });
  }

  return (
      <group position={position} rotation={rotation}>
          <group position={[-length / 2, 0, 0]}>
            {segments.map((seg, i) => (
                <mesh key={i} position={[seg.x, seg.y, 0]} castShadow receiveShadow>
                    <boxGeometry args={[seg.width, seg.height, thickness]} />
                    <meshStandardMaterial color="white" roughness={0.8} />
                </mesh>
            ))}
          </group>
      </group>
  );
};

// --- 3D COMPONENTS ---
interface Element3DProps {
    element: ArchitecturalElement;
    onPointerDown: (e: ThreeEvent<PointerEvent>, id: string) => void;
    elementRefs: React.MutableRefObject<{[key: string]: THREE.Group}>;
    yOffset: number;
}

const Element3D: React.FC<Element3DProps> = ({ element, onPointerDown, elementRefs, yOffset }) => {
  const { x, y, width, height, rotation, id, color } = element;
  const px = x + width / 2;
  const pz = y + height / 2;
  const rotY = -rotation * (Math.PI / 180);
  const baseY = 0 + yOffset; 

  const setRef = (el: any) => { if (el) elementRefs.current[id] = el; };

  return (
    <group 
        ref={setRef} 
        position={[px, baseY, pz]} 
        rotation={[0, rotY, 0]} 
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, id); }}
    >
        <Render3DElement el={element} color={color} />
    </group>
  );
};

const Room3D: React.FC<{ room: Room, elements: ArchitecturalElement[], yOffset: number }> = ({ room, elements, yOffset }) => {
  const { x, y, width, height, floorFinish, color, type } = room;
  const px = x + width / 2;
  const pz = y + height / 2;

  const isGarden = type === 'garden';
  const isParking = type === 'parking';
  const isPool = type === 'pool';
  const isBalcony = type === 'balcony' || type === 'terrace';

  let elevation = 0.1;
  if (isGarden) elevation = 0.1;
  else if (isParking) elevation = 0.2;
  else if (isPool) elevation = 0.3;
  else elevation = 2.5; 

  const floorY = elevation + yOffset;

  let floorColor = '#f5f5f5';
  if (color) floorColor = color;
  else if (isPool) floorColor = '#06b6d4'; 
  else if (isGarden) floorColor = '#4ade80'; 
  else if (isParking) floorColor = '#9ca3af'; 
  else if (floorFinish === 'wood') floorColor = '#d4a373';
  else if (floorFinish === 'tiled') floorColor = '#e0e0e0';
  
  const hasWalls = !isGarden && !isParking && !isPool;
  const wallHeight = isBalcony ? 110 : WALL_HEIGHT; 

  const TOLERANCE = 20; 
  const getHolesForWall = (wall: 'north' | 'south' | 'west' | 'east'): Hole[] => {
      const holes: Hole[] = [];
      elements.forEach(el => {
          if (!['window', 'door', 'entry_door', 'balcony_door', 'wall_opening'].includes(el.type)) return;
          
          let isOnWall = false;
          let start = 0;
          let holeWidth = 0;
          
          // FIX: For windows/doors/openings, 'width' is always the linear span, 'height' is thickness.
          const linearSpan = el.width;

          let bottom = 0;
          let holeHeight = 210; 
          if (el.type === 'window') {
              bottom = 110; // Sill height for window
              holeHeight = 110;
          } else if (el.type === 'entry_door') {
              holeHeight = 230;
          } else if (el.type === 'wall_opening') {
              holeHeight = WALL_HEIGHT - 30; // Nearly full height, leave beam
          }

          if (wall === 'north') { 
             if (Math.abs(el.y - y) < TOLERANCE) { isOnWall = true; start = el.x - x; holeWidth = linearSpan; }
          } else if (wall === 'south') { 
             if (Math.abs(el.y - (y+height)) < TOLERANCE || Math.abs((el.y + el.height) - (y + height)) < TOLERANCE) { 
                 isOnWall = true; start = el.x - x; holeWidth = linearSpan; 
             }
          } else if (wall === 'west') { 
             if (Math.abs(el.x - x) < TOLERANCE) { isOnWall = true; start = el.y - y; holeWidth = linearSpan; }
          } else if (wall === 'east') { 
             if (Math.abs(el.x - (x+width)) < TOLERANCE || Math.abs((el.x + el.width) - (x + width)) < TOLERANCE) { 
                 isOnWall = true; start = el.y - y; holeWidth = linearSpan; 
             }
          }

          if (isOnWall) {
              // CRITICAL FIX: BOUNDS CHECK
              // Only add hole if it actually lies within this specific wall segment.
              // Otherwise, it's a ghost hole from an adjacent/distant wall on the same axis.
              const wallLength = (wall === 'north' || wall === 'south') ? width + WALL_THICKNESS : height + WALL_THICKNESS;
              
              // Allow generous tolerance for corners (50cm), but reject far outliers
              if (start > -50 && (start + holeWidth) < wallLength + 50) {
                  holes.push({ start, width: holeWidth, bottom, height: holeHeight });
              }
          }
      });
      return holes;
  };

  return (
    <group>
       <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[px, floorY, pz]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={floorColor} roughness={isPool ? 0.1 : (isGarden ? 1 : 0.5)} metalness={isPool ? 0.5 : 0} />
       </mesh>

       {hasWalls && (
           <group position={[0, yOffset, 0]}>
               <WallGenerator length={width + WALL_THICKNESS} height={wallHeight} thickness={WALL_THICKNESS} holes={getHolesForWall('north')} position={[px, 0, y]} rotation={[0, 0, 0]} />
               <WallGenerator length={width + WALL_THICKNESS} height={wallHeight} thickness={WALL_THICKNESS} holes={getHolesForWall('south')} position={[px, 0, y + height]} rotation={[0, 0, 0]} />
               <WallGenerator length={height - WALL_THICKNESS} height={wallHeight} thickness={WALL_THICKNESS} holes={getHolesForWall('west')} position={[x, 0, pz]} rotation={[0, Math.PI / 2, 0]} />
               <WallGenerator length={height - WALL_THICKNESS} height={wallHeight} thickness={WALL_THICKNESS} holes={getHolesForWall('east')} position={[x + width, 0, pz]} rotation={[0, Math.PI / 2, 0]} />
           </group>
       )}
    </group>
  );
};

interface SceneSetupProps { 
    data: SketchData; 
    activeFloor: number; 
    showAllFloors: boolean;
    cameraStateRef?: React.MutableRefObject<{ position: any, target: any } | null>;
}

const SceneSetup = ({ data, activeFloor, showAllFloors, cameraStateRef }: SceneSetupProps) => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const lastProjectRef = useRef<string | null>(null);

  useEffect(() => {
     if (!data || data.rooms.length === 0) return;
     if (data.id !== lastProjectRef.current) {
         lastProjectRef.current = data.id;
         const minX = Math.min(...data.rooms.map(r => r.x));
         const maxX = Math.max(...data.rooms.map(r => r.x + r.width));
         const minY = Math.min(...data.rooms.map(r => r.y));
         const maxY = Math.max(...data.rooms.map(r => r.y + r.height));
         const width = maxX - minX;
         const depth = maxY - minY;
         const centerX = minX + width / 2;
         const centerZ = minY + depth / 2;
         const currentFloorY = (activeFloor - 1) * FLOOR_PITCH;
         const fitOffset = Math.max(width, depth) * 1.2;

         camera.position.set(centerX, currentFloorY + fitOffset, centerZ + fitOffset);
         camera.lookAt(centerX, currentFloorY, centerZ);
         if (controls) { 
             // @ts-ignore
             controls.target.set(centerX, currentFloorY, centerZ); 
             // @ts-ignore
             controls.update(); 
         }
     }
  }, [data.id]);
  return null;
};

const Canvas3D: React.FC<any> = ({ data, activeFloor, showAllFloors = false, onUpdate, cameraStateRef }) => {
  const visibleRooms = showAllFloors ? data.rooms : data.rooms.filter((r:any) => r.floor === activeFloor);
  const visibleElements = showAllFloors ? data.elements : data.elements.filter((e:any) => e.floor === activeFloor);
  const elementRefs = useRef<{[key: string]: THREE.Group}>({});

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 cursor-grab active:cursor-grabbing touch-none">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 800, 800], fov: 50, near: 1, far: 100000 }} gl={{ antialias: true }}>
           <Suspense fallback={<Html center>LOADING...</Html>}>
               <SceneSetup data={data} activeFloor={activeFloor} showAllFloors={showAllFloors} cameraStateRef={cameraStateRef}/>
               <ambientLight intensity={0.8} />
               <directionalLight position={[3000, 4000, 2000]} intensity={1} castShadow />
               
               <group>
                  {visibleRooms.map((room: any) => (
                    <Room3D key={room.id} room={room} elements={visibleElements.filter((e:any) => e.roomId === room.id || e.floor === room.floor)} yOffset={(room.floor - 1) * FLOOR_PITCH} />
                  ))}
                  {visibleElements.map((el: any) => (
                      <Element3D key={el.id} element={el} onPointerDown={() => {}} elementRefs={elementRefs} yOffset={(el.floor - 1) * FLOOR_PITCH} />
                  ))}
                  <Grid3D position={[0, -1, 0]} infiniteGrid fadeDistance={50000} cellColor="#bbb" sectionColor="#999" />
                  <ContactShadows resolution={1024} scale={10000} blur={2} opacity={0.5} far={100} color="#000000" />
               </group>
               <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
               <Environment preset="city" />
           </Suspense>
        </Canvas>
    </div>
  );
};

export default Canvas3D;
