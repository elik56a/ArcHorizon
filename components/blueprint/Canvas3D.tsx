
import React, { useEffect, Suspense, useRef, useState } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid as Grid3D, Environment, ContactShadows, Html } from '@react-three/drei';
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

interface Canvas3DProps {
  data: SketchData;
  activeFloor: number;
  onUpdate?: (data: SketchData) => void;
}

// --- 3D COMPONENTS ---

interface Element3DProps {
    element: ArchitecturalElement;
    onPointerDown: (e: ThreeEvent<PointerEvent>, id: string) => void;
    elementRefs: React.MutableRefObject<{[key: string]: THREE.Group}>;
}

const Element3D: React.FC<Element3DProps> = ({ element, onPointerDown, elementRefs }) => {
  const { x, y, width, height, rotation, type, color, id } = element;
  const px = x + width / 2;
  const pz = y + height / 2;
  const rotY = -rotation * (Math.PI / 180);

  const materialProps = { color: color || '#ffffff', roughness: 0.5 };

  // --- LONG PRESS LOGIC ---
  const timerRef = useRef<any>(null);
  const startPosRef = useRef<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      // NOTE: We do NOT stop propagation immediately. 
      // This allows OrbitControls to function for rotation if it's just a click or drag on scene.
      // If long press triggers, we will engage Drag Mode which disables OrbitControls in the parent.
      
      startPosRef.current = { x: e.clientX, y: e.clientY };

      // Start Long Press Timer (500ms)
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
          onPointerDown(e, id); // Trigger Drag Mode
          timerRef.current = null;
      }, 500);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
      // Cancel long press if released early (Click)
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      // Cancel long press if moved significantly (Orbiting)
      if (timerRef.current && startPosRef.current) {
          const dx = Math.abs(e.clientX - startPosRef.current.x);
          const dy = Math.abs(e.clientY - startPosRef.current.y);
          if (dx > 5 || dy > 5) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
          }
      }
  };

  // Wrapper to register ref
  const setRef = (el: any) => {
      if (el) elementRefs.current[id] = el;
  };

  // Inner content based on type
  const renderContent = () => {
      switch (type) {
        case 'bed_king':
        case 'bed_single':
          return (
            <group>
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                <boxGeometry args={[width, 40, height]} />
                <meshStandardMaterial {...materialProps} color={color || "#f0f0f0"} />
              </mesh>
              <mesh castShadow receiveShadow position={[-width/2 + 5, 20, 0]}>
                 <boxGeometry args={[10, 80, height]} />
                 <meshStandardMaterial color="#ccc" />
              </mesh>
              <mesh position={[-width/2 + 25, 25, -height/4]} rotation={[0,0,0.2]}>
                 <boxGeometry args={[20, 10, 30]} />
                 <meshStandardMaterial color="white" />
              </mesh>
               <mesh position={[-width/2 + 25, 25, height/4]} rotation={[0,0,0.2]}>
                 <boxGeometry args={[20, 10, 30]} />
                 <meshStandardMaterial color="white" />
              </mesh>
            </group>
          );
        case 'sofa':
          return (
            <group>
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                 <boxGeometry args={[width, 40, height]} />
                 <meshStandardMaterial color={color || "#ddd"} />
              </mesh>
              <mesh castShadow position={[-width/2 + 10, 30, 0]}>
                 <boxGeometry args={[20, 60, height]} />
                 <meshStandardMaterial color="#ccc" />
              </mesh>
               <mesh castShadow position={[0, 15, -height/2 + 10]}>
                 <boxGeometry args={[width, 50, 20]} />
                 <meshStandardMaterial color="#ccc" />
              </mesh>
              <mesh castShadow position={[0, 15, height/2 - 10]}>
                 <boxGeometry args={[width, 50, 20]} />
                 <meshStandardMaterial color="#ccc" />
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
                </mesh>
                <mesh position={[width/2 + 1, 0, 0]}>
                    <boxGeometry args={[1, 190, 2]} />
                    <meshStandardMaterial color="#ddd" />
                </mesh>
             </group>
           );
        case 'toilet':
            return (
               <group position={[0, -30, 0]}>
                   <mesh position={[-width/2 + 10, 40, 0]}>
                       <boxGeometry args={[20, 40, 40]} />
                       <meshStandardMaterial color={color || "white"} />
                   </mesh>
                   <mesh position={[0, 20, 0]}>
                       <boxGeometry args={[30, 35, 30]} />
                       <meshStandardMaterial color={color || "white"} />
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
        position={[px, 30, pz]} 
        rotation={[0, rotY, 0]} 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
    >
        {renderContent()}
        {/* Invisible hit box for easier selection */}
        <mesh visible={false}>
            <boxGeometry args={[width, 100, height]} />
        </mesh>
    </group>
  );
};

const Room3D: React.FC<{ room: Room }> = ({ room }) => {
  const { x, y, width, height, floorFinish, color } = room;
  const px = x + width / 2;
  const pz = y + height / 2;

  const floorColor = color || (
    floorFinish === 'tiled' ? '#e0e0e0' : 
    floorFinish === 'wood' ? '#d4a373' :
    floorFinish === 'concrete' ? '#999' :
    '#f5f5f5');

  return (
    <group>
       <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.5, pz]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={floorColor} roughness={0.8} />
       </mesh>

       <mesh castShadow receiveShadow position={[px, WALL_HEIGHT/2, y]}>
          <boxGeometry args={[width + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="white" />
       </mesh>
       <mesh castShadow receiveShadow position={[px, WALL_HEIGHT/2, y + height]}>
          <boxGeometry args={[width + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="white" />
       </mesh>
       <mesh castShadow receiveShadow position={[x, WALL_HEIGHT/2, pz]}>
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, height - WALL_THICKNESS]} />
          <meshStandardMaterial color="white" />
       </mesh>
       <mesh castShadow receiveShadow position={[x + width, WALL_HEIGHT/2, pz]}>
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, height - WALL_THICKNESS]} />
          <meshStandardMaterial color="white" />
       </mesh>
    </group>
  );
};

const SceneSetup = ({ data, lastProjectRef }: { data: SketchData, lastProjectRef: React.MutableRefObject<string | null> }) => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  
  useEffect(() => {
     if (!data || data.rooms.length === 0) return;
     
     // CRITICAL: Only reset camera if we are loading a completely different project ID
     // Moving floors or dragging elements should NOT reset the camera.
     if (data.id === lastProjectRef.current) return;
     lastProjectRef.current = data.id;

     // Calculate global bounds (all floors) to center the building
     const minX = Math.min(...data.rooms.map(r => r.x));
     const maxX = Math.max(...data.rooms.map(r => r.x + r.width));
     const minY = Math.min(...data.rooms.map(r => r.y));
     const maxY = Math.max(...data.rooms.map(r => r.y + r.height));

     const width = maxX - minX;
     const depth = maxY - minY;
     const centerX = minX + width / 2;
     const centerZ = minY + depth / 2;
     
     const maxDim = Math.max(width, depth);
     const size = Math.max(maxDim, 100); 
     
     // @ts-ignore
     const aspect = camera.aspect || 1;
     const aspectFactor = aspect < 1 ? 1 / aspect : 1;

     const fitOffset = size * 0.8 * aspectFactor;

     camera.position.set(centerX, fitOffset, centerZ + fitOffset);
     camera.lookAt(centerX, 0, centerZ);
     camera.updateProjectionMatrix();

     if (controls) {
        // @ts-ignore
        controls.target.set(centerX, 0, centerZ);
        // @ts-ignore
        controls.update();
     }
  }, [data.id, camera, controls, lastProjectRef]); // Dependencies must be stable

  return null;
};

const DragManager: React.FC<{ 
    onUpdate: (data: SketchData) => void, 
    data: SketchData,
    elementRefs: React.MutableRefObject<{[key: string]: THREE.Group}>,
    dragState: { id: string | null, offset: THREE.Vector3 | null },
    setDragState: React.Dispatch<React.SetStateAction<{ id: string | null, offset: THREE.Vector3 | null }>>
}> = ({ onUpdate, data, elementRefs, dragState, setDragState }) => {
    const { camera, controls } = useThree();

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!dragState.id) return;
        e.stopPropagation(); // Stop other interactions while dragging
        
        const elGroup = elementRefs.current[dragState.id];
        if (!elGroup) return;

        // Calculate Offset on first move to prevent jump
        // We do this here because we need the intersection with THIS plane (y=0) to be consistent
        let currentOffset = dragState.offset;
        if (!currentOffset) {
             currentOffset = e.point.clone().sub(elGroup.position);
             // Only care about X/Z offset
             currentOffset.y = 0; 
             setDragState(prev => ({ ...prev, offset: currentOffset }));
             return; // Skip first frame to allow state update
        }

        const point = e.point;
        const newPos = point.sub(currentOffset);
        
        // Snap
        const snappedX = Math.round(newPos.x / 10) * 10;
        const snappedZ = Math.round(newPos.z / 10) * 10;

        // Update visual only (direct manipulation)
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

            // Find element config to calculate top-left
            const elConfig = data.elements.find(el => el.id === dragState.id);
            if (elConfig) {
                const newX = finalX - elConfig.width / 2;
                const newY = finalZ - elConfig.height / 2;

                // Commit to state
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
            visible={!!dragState.id} // Only active during drag
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            // IMPORTANT: Catch initial clicks on the drag plane if the user moves quickly
            onPointerDown={(e) => e.stopPropagation()}
        >
            <planeGeometry args={[100000, 100000]} />
            <meshBasicMaterial color="red" transparent opacity={0} />
        </mesh>
    );
};

const Canvas3D: React.FC<Canvas3DProps> = ({ data, activeFloor, onUpdate }) => {
  const visibleRooms = data.rooms.filter(r => r.floor === activeFloor);
  const visibleElements = data.elements.filter(e => e.floor === activeFloor);
  const elementRefs = useRef<{[key: string]: THREE.Group}>({});
  const [dragState, setDragState] = useState<{id: string | null, offset: THREE.Vector3 | null}>({ id: null, offset: null });
  
  // Store last project ID at the parent level to prevent camera reset on re-renders caused by parent
  const lastProjectRef = useRef<string | null>(null);

  const handleElementDown = (e: ThreeEvent<PointerEvent>, id: string) => {
      if (!onUpdate) return;
      // Start drag state with null offset; let DragManager calculate it on first move relative to the ground plane
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
               <SceneSetup data={data} lastProjectRef={lastProjectRef} />
               <ambientLight intensity={0.8} />
               <directionalLight position={[3000, 4000, 2000]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.001}>
                  <orthographicCamera attach="shadow-camera" args={[-5000, 5000, 5000, -5000]} near={0.1} far={20000} />
               </directionalLight>
               
               <group>
                  {visibleRooms.map(room => <Room3D key={room.id} room={room} />)}
                  {visibleElements.map(el => (
                      <Element3D 
                        key={el.id} 
                        element={el} 
                        onPointerDown={handleElementDown} 
                        elementRefs={elementRefs}
                      />
                  ))}
                  
                  <Grid3D position={[0, -1, 0]} infiniteGrid fadeDistance={50000} cellColor="#bbb" sectionColor="#999" />
                  <ContactShadows resolution={1024} scale={10000} blur={2} opacity={0.5} far={100} color="#000000" />
                  
                  {/* Drag Logic Layer */}
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
               {/* OrbitControls disabled when dragging to prevent camera movement */}
               <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} enabled={!dragState.id}/>
               <Environment preset="city" />
           </Suspense>
        </Canvas>
    </div>
  );
};

// Helper to access useThree inside the canvas
const DragLogicWrapper: React.FC<any> = (props) => {
    return <DragManager {...props} />;
};

export default Canvas3D;
