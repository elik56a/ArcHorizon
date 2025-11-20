
import React, { useEffect, Suspense, useRef, useState } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid as Grid3D, Environment, ContactShadows, Html, Edges } from '@react-three/drei';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import * as THREE from 'three';

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
      ambientLight: any;
      directionalLight: any;
      orthographicCamera: any;
    }
  }
}

const WALL_HEIGHT = 280; // cm
const WALL_THICKNESS = 15; // cm
const OPENING_THICKNESS = 22; // cm
const FLOOR_PITCH = 300; // cm (Height difference between floors)

interface Canvas3DProps {
  data: SketchData;
  activeFloor: number;
  showAllFloors?: boolean;
  onUpdate?: (data: SketchData) => void;
  cameraStateRef?: React.MutableRefObject<{ position: any, target: any } | null>;
}

// --- 3D COMPONENTS ---

interface Element3DProps {
    element: ArchitecturalElement;
    onPointerDown: (e: ThreeEvent<PointerEvent>, id: string) => void;
    elementRefs: React.MutableRefObject<{[key: string]: THREE.Group}>;
    yOffset: number;
}

const Element3D: React.FC<Element3DProps> = ({ element, onPointerDown, elementRefs, yOffset }) => {
  const { x, y, width, height, rotation, type, color, id } = element;
  const px = x + width / 2;
  const pz = y + height / 2;
  const rotY = -rotation * (Math.PI / 180);

  const materialProps = { color: color || '#ffffff', roughness: 0.5 };
  const baseY = 30 + yOffset;

  // --- LONG PRESS LOGIC ---
  const timerRef = useRef<any>(null);
  const startPosRef = useRef<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
          onPointerDown(e, id); 
          timerRef.current = null;
      }, 500);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      if (timerRef.current && startPosRef.current) {
          const dx = Math.abs(e.clientX - startPosRef.current.x);
          const dy = Math.abs(e.clientY - startPosRef.current.y);
          if (dx > 5 || dy > 5) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
          }
      }
  };

  const setRef = (el: any) => { if (el) elementRefs.current[id] = el; };

  const renderContent = () => {
      switch (type) {
        case 'bed_king':
        case 'bed_single':
          return (
            <group>
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                <boxGeometry args={[width, 40, height]} />
                <meshStandardMaterial {...materialProps} color={color || "#f0f0f0"} />
                <Edges color="black" threshold={15} />
              </mesh>
              <mesh castShadow receiveShadow position={[-width/2 + 5, 20, 0]}>
                 <boxGeometry args={[10, 80, height]} />
                 <meshStandardMaterial color="#ccc" />
                 <Edges color="black" threshold={15} />
              </mesh>
              <mesh position={[-width/2 + 25, 25, -height/4]} rotation={[0,0,0.2]}>
                 <boxGeometry args={[20, 10, 30]} />
                 <meshStandardMaterial color="white" />
                 <Edges color="black" threshold={15} />
              </mesh>
               <mesh position={[-width/2 + 25, 25, height/4]} rotation={[0,0,0.2]}>
                 <boxGeometry args={[20, 10, 30]} />
                 <meshStandardMaterial color="white" />
                 <Edges color="black" threshold={15} />
              </mesh>
            </group>
          );
        case 'sofa':
          return (
            <group>
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                 <boxGeometry args={[width, 40, height]} />
                 <meshStandardMaterial color={color || "#ddd"} />
                 <Edges color="black" threshold={15} />
              </mesh>
              <mesh castShadow position={[-width/2 + 10, 30, 0]}>
                 <boxGeometry args={[20, 60, height]} />
                 <meshStandardMaterial color="#ccc" />
                 <Edges color="black" threshold={15} />
              </mesh>
               <mesh castShadow position={[0, 15, -height/2 + 10]}>
                 <boxGeometry args={[width, 50, 20]} />
                 <meshStandardMaterial color="#ccc" />
                 <Edges color="black" threshold={15} />
              </mesh>
              <mesh castShadow position={[0, 15, height/2 - 10]}>
                 <boxGeometry args={[width, 50, 20]} />
                 <meshStandardMaterial color="#ccc" />
                 <Edges color="black" threshold={15} />
              </mesh>
            </group>
          );
        case 'dining_table':
        case 'desk':
          return (
             <group position={[0, 12.5, 0]}>
                <mesh castShadow position={[0, 35, 0]}>
                   <boxGeometry args={[width, 5, height]} />
                   <meshStandardMaterial color={color || "#e8e8e8"} />
                   <Edges color="black" threshold={15} />
                </mesh>
                <mesh position={[width/2-5, 0, height/2-5]}>
                   <boxGeometry args={[5, 70, 5]} />
                   <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[-width/2+5, 0, height/2-5]}>
                   <boxGeometry args={[5, 70, 5]} />
                   <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[width/2-5, 0, -height/2+5]}>
                   <boxGeometry args={[5, 70, 5]} />
                   <meshStandardMaterial color="#333" />
                </mesh>
                 <mesh position={[-width/2+5, 0, -height/2+5]}>
                   <boxGeometry args={[5, 70, 5]} />
                   <meshStandardMaterial color="#333" />
                </mesh>
             </group>
          );
        case 'wardrobe':
           return (
             <group position={[0, 70, 0]}>
                <mesh castShadow receiveShadow>
                   <boxGeometry args={[width, 200, height]} />
                   <meshStandardMaterial color={color || "#f5f5f5"} />
                   <Edges color="black" threshold={15} />
                </mesh>
                <mesh position={[width/2 + 1, 0, 0]}>
                    <boxGeometry args={[1, 190, 2]} />
                    <meshStandardMaterial color="#ddd" />
                    <Edges color="black" threshold={15} />
                </mesh>
             </group>
           );
        case 'toilet':
            return (
               <group position={[0, -30, 0]}>
                   <mesh position={[-width/2 + 10, 40, 0]}>
                       <boxGeometry args={[20, 40, 40]} />
                       <meshStandardMaterial color={color || "white"} />
                       <Edges color="black" threshold={15} />
                   </mesh>
                   <mesh position={[0, 20, 0]}>
                       <boxGeometry args={[30, 35, 30]} />
                       <meshStandardMaterial color={color || "white"} />
                       <Edges color="black" threshold={15} />
                   </mesh>
               </group>
            );
         case 'door':
         case 'entry_door':
            return (
               <group position={[0, 70, 0]}>
                   <mesh position={[0, 0, -height/2 + 2]}>
                       <boxGeometry args={[width + 5, 200, 4]} />
                       <meshStandardMaterial color="#333" />
                   </mesh>
                   <mesh position={[0, 0, height/2 - 2]}>
                       <boxGeometry args={[width + 5, 200, 4]} />
                       <meshStandardMaterial color="#333" />
                   </mesh>
                   <mesh position={[0, 98, 0]}>
                       <boxGeometry args={[width + 5, 4, height]} />
                       <meshStandardMaterial color="#333" />
                   </mesh>
               </group>
            );
          case 'window':
             return (
                <group position={[0, 90, 0]}>
                     <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[width + 4, 110, OPENING_THICKNESS]} />
                        <meshStandardMaterial color="#222" />
                     </mesh>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[width, 100, OPENING_THICKNESS + 2]} />
                        <meshPhysicalMaterial 
                           color={color || "#88ccff"} 
                           roughness={0.0} 
                           transmission={0.5} 
                           transparent 
                           opacity={0.6} 
                        />
                    </mesh>
                </group>
             );
        default:
          return (
            <mesh position={[0, -20, 0]}>
               <boxGeometry args={[width, 20, height]} />
               <meshStandardMaterial color={color || "#ccc"} wireframe />
            </mesh>
          );
      }
  };

  return (
    <group 
        ref={setRef} 
        position={[px, baseY, pz]} 
        rotation={[0, rotY, 0]} 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
        onClick={(e) => e.stopPropagation()}
    >
        {renderContent()}
        <mesh visible={false}>
            <boxGeometry args={[width, 100, height]} />
        </mesh>
    </group>
  );
};

const Room3D: React.FC<{ room: Room, yOffset: number }> = ({ room, yOffset }) => {
  const { x, y, width, height, floorFinish, color, type } = room;
  const px = x + width / 2;
  const pz = y + height / 2;
  const floorY = 0.5 + yOffset;

  const isGarden = type === 'garden';
  const isParking = type === 'parking';
  const isBalcony = type === 'balcony' || type === 'terrace';

  // Determine Floor Color
  let floorColor = '#f5f5f5';
  if (color) floorColor = color;
  else if (isGarden) floorColor = '#4ade80'; // Green
  else if (isParking) floorColor = '#9ca3af'; // Asphalt Gray
  else if (floorFinish === 'wood') floorColor = '#d4a373';
  else if (floorFinish === 'tiled') floorColor = '#e0e0e0';
  else if (floorFinish === 'concrete') floorColor = '#999';
  
  // Determine Wall Configuration
  const hasWalls = !isGarden && !isParking;
  const wallHeight = isBalcony ? 110 : WALL_HEIGHT; // Balcony walls are lower
  
  return (
    <group>
       {/* Floor Plane */}
       <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[px, floorY, pz]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={floorColor} roughness={isGarden ? 1 : 0.5} />
       </mesh>

       {/* Walls (Only for non-outdoor ground areas) */}
       {hasWalls && (
           <group>
               <mesh castShadow receiveShadow position={[px, wallHeight/2 + yOffset, y]}>
                  <boxGeometry args={[width + WALL_THICKNESS, wallHeight, WALL_THICKNESS]} />
                  <meshStandardMaterial color="white" />
               </mesh>
               <mesh castShadow receiveShadow position={[px, wallHeight/2 + yOffset, y + height]}>
                  <boxGeometry args={[width + WALL_THICKNESS, wallHeight, WALL_THICKNESS]} />
                  <meshStandardMaterial color="white" />
               </mesh>
               <mesh castShadow receiveShadow position={[x, wallHeight/2 + yOffset, pz]}>
                  <boxGeometry args={[WALL_THICKNESS, wallHeight, height - WALL_THICKNESS]} />
                  <meshStandardMaterial color="white" />
               </mesh>
               <mesh castShadow receiveShadow position={[x + width, wallHeight/2 + yOffset, pz]}>
                  <boxGeometry args={[WALL_THICKNESS, wallHeight, height - WALL_THICKNESS]} />
                  <meshStandardMaterial color="white" />
               </mesh>
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
      return () => {
          if (controls && camera && cameraStateRef) {
             // @ts-ignore
             cameraStateRef.current = { position: camera.position.clone(), target: controls.target.clone() };
          }
      };
  }, []); 

  useEffect(() => {
     if (!data || data.rooms.length === 0) return;
     const isNewProject = data.id !== lastProjectRef.current;

     if (isNewProject) {
         lastProjectRef.current = data.id;

         if (!cameraStateRef?.current) {
             const minX = Math.min(...data.rooms.map(r => r.x));
             const maxX = Math.max(...data.rooms.map(r => r.x + r.width));
             const minY = Math.min(...data.rooms.map(r => r.y));
             const maxY = Math.max(...data.rooms.map(r => r.y + r.height));

             const width = maxX - minX;
             const depth = maxY - minY;
             const centerX = minX + width / 2;
             const centerZ = minY + depth / 2;
             
             const currentFloorY = (activeFloor - 1) * FLOOR_PITCH;
             // @ts-ignore
             const aspectFactor = (camera.aspect < 1 ? 1/camera.aspect : 1);
             const fitOffset = Math.max(width, depth) * 0.8 * aspectFactor;

             camera.position.set(centerX, currentFloorY + fitOffset, centerZ + fitOffset);
             camera.lookAt(centerX, currentFloorY, centerZ);
             
             if (controls) {
                // @ts-ignore
                controls.target.set(centerX, currentFloorY, centerZ);
                // @ts-ignore
                controls.update();
             }
         } else {
             camera.position.copy(cameraStateRef.current.position);
             // @ts-ignore
             controls.target.copy(cameraStateRef.current.target);
             // @ts-ignore
             controls.update();
         }
     }
  }, [data.id]);

  useEffect(() => {
      if (!controls) return;
      const targetHeight = (activeFloor - 1) * FLOOR_PITCH;
      // @ts-ignore
      const currentTargetY = controls.target.y;
      const heightDiff = targetHeight - currentTargetY;
      
      if (!showAllFloors && Math.abs(heightDiff) > 1) {
           camera.position.y += heightDiff;
           // @ts-ignore
           controls.target.y += heightDiff;
           // @ts-ignore
           controls.update();
      }
  }, [activeFloor, showAllFloors]);

  return null;
};

const DragManager: React.FC<{ 
    onUpdate: (data: SketchData) => void, 
    data: SketchData,
    elementRefs: React.MutableRefObject<{[key: string]: THREE.Group}>,
    dragState: { id: string | null, offset: THREE.Vector3 | null },
    setDragState: React.Dispatch<React.SetStateAction<{ id: string | null, offset: THREE.Vector3 | null }>>
}> = ({ onUpdate, data, elementRefs, dragState, setDragState }) => {
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!dragState.id) return;
        e.stopPropagation();
        const elGroup = elementRefs.current[dragState.id];
        if (!elGroup) return;

        let currentOffset = dragState.offset;
        if (!currentOffset) {
             currentOffset = e.point.clone().sub(elGroup.position);
             currentOffset.y = 0; 
             setDragState(prev => ({ ...prev, offset: currentOffset }));
             return;
        }
        const point = e.point;
        const newPos = point.sub(currentOffset);
        const snappedX = Math.round(newPos.x / 10) * 10;
        const snappedZ = Math.round(newPos.z / 10) * 10;
        elGroup.position.x = snappedX;
        elGroup.position.z = snappedZ;
    };

    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (!dragState.id) return;
        e.stopPropagation();
        const elGroup = elementRefs.current[dragState.id];
        if (elGroup) {
            const finalX = elGroup.position.x;
            const finalZ = elGroup.position.z;
            const elConfig = data.elements.find(el => el.id === dragState.id);
            if (elConfig) {
                const newX = finalX - elConfig.width / 2;
                const newY = finalZ - elConfig.height / 2;
                const newElements = data.elements.map(el => 
                    el.id === dragState.id ? { ...el, x: newX, y: newY } : el
                );
                onUpdate({ ...data, elements: newElements });
            }
        }
        setDragState({ id: null, offset: null });
    };

    return (
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]} 
            visible={!!dragState.id} 
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <planeGeometry args={[100000, 100000]} />
            <meshBasicMaterial color="red" transparent opacity={0} />
        </mesh>
    );
};

const Canvas3D: React.FC<Canvas3DProps> = ({ data, activeFloor, showAllFloors = false, onUpdate, cameraStateRef }) => {
  const visibleRooms = showAllFloors ? data.rooms : data.rooms.filter(r => r.floor === activeFloor);
  const visibleElements = showAllFloors ? data.elements : data.elements.filter(e => e.floor === activeFloor);
  const elementRefs = useRef<{[key: string]: THREE.Group}>({});
  const [dragState, setDragState] = useState<{id: string | null, offset: THREE.Vector3 | null}>({ id: null, offset: null });

  const handleElementDown = (e: ThreeEvent<PointerEvent>, id: string) => {
      if (!onUpdate) return;
      setDragState({ id, offset: null });
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 cursor-grab active:cursor-grabbing touch-none">
        <Canvas 
            shadows 
            dpr={[1, 2]}
            camera={{ position: [0, 800, 800], fov: 50, near: 1, far: 100000 }} 
            gl={{ antialias: true, logarithmicDepthBuffer: true }}
        >
           <Suspense fallback={<Html center><div className="text-xs font-mono animate-pulse">LOADING 3D...</div></Html>}>
               <SceneSetup 
                    data={data} 
                    activeFloor={activeFloor}
                    showAllFloors={showAllFloors}
                    cameraStateRef={cameraStateRef}
               />
               <ambientLight intensity={0.8} />
               <directionalLight position={[3000, 4000, 2000]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.001}>
                  <orthographicCamera attach="shadow-camera" args={[-5000, 5000, 5000, -5000]} near={0.1} far={20000} />
               </directionalLight>
               
               <group>
                  {visibleRooms.map(room => (
                    <Room3D 
                        key={room.id} 
                        room={room} 
                        yOffset={(room.floor - 1) * FLOOR_PITCH} 
                    />
                  ))}
                  {visibleElements.map(el => (
                      <Element3D 
                        key={el.id} 
                        element={el} 
                        onPointerDown={handleElementDown} 
                        elementRefs={elementRefs}
                        yOffset={(el.floor - 1) * FLOOR_PITCH}
                      />
                  ))}
                  
                  <Grid3D position={[0, -1, 0]} infiniteGrid fadeDistance={50000} cellColor="#bbb" sectionColor="#999" />
                  <ContactShadows resolution={1024} scale={10000} blur={2} opacity={0.5} far={100} color="#000000" />
                  
                  {onUpdate && (
                      <DragLogicWrapper 
                        onUpdate={onUpdate} 
                        data={data} 
                        elementRefs={elementRefs} 
                        dragState={dragState} 
                        setDragState={setDragState} 
                      />
                  )}
               </group>
               
               <OrbitControls 
                  makeDefault 
                  minPolarAngle={0} 
                  maxPolarAngle={Math.PI / 2.1} 
                  enabled={!dragState.id}
               />
               <Environment preset="city" />
           </Suspense>
        </Canvas>
    </div>
  );
};

const DragLogicWrapper: React.FC<any> = (props) => {
    return <DragManager {...props} />;
};

export default Canvas3D;
