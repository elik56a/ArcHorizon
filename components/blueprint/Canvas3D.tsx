
import React, { useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid as Grid3D, Environment, ContactShadows, Html } from '@react-three/drei';
import { SketchData, Room, ArchitecturalElement } from '../../types';

const WALL_HEIGHT = 280; // cm
const WALL_THICKNESS = 15; // cm
const OPENING_THICKNESS = 22; // cm

interface Canvas3DProps {
  data: SketchData;
  activeFloor: number;
}

// --- 3D COMPONENTS ---

const Element3D: React.FC<{ element: ArchitecturalElement }> = ({ element }) => {
  const { x, y, width, height, rotation, type } = element;
  const px = x + width / 2;
  const pz = y + height / 2;
  const rotY = -rotation * (Math.PI / 180);

  const materialProps = { color: '#ffffff', roughness: 0.5 };

  switch (type) {
    case 'bed_king':
    case 'bed_single':
      return (
        <group position={[px, 30, pz]} rotation={[0, rotY, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[width, 40, height]} />
            <meshStandardMaterial {...materialProps} color="#f0f0f0" />
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
        <group position={[px, 25, pz]} rotation={[0, rotY, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
             <boxGeometry args={[width, 40, height]} />
             <meshStandardMaterial color="#ddd" />
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
         <group position={[px, 37.5, pz]} rotation={[0, rotY, 0]}>
            <mesh castShadow position={[0, 35, 0]}>
               <boxGeometry args={[width, 5, height]} />
               <meshStandardMaterial color="#e8e8e8" />
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
         <group position={[px, 100, pz]} rotation={[0, rotY, 0]}>
            <mesh castShadow receiveShadow>
               <boxGeometry args={[width, 200, height]} />
               <meshStandardMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[width/2 + 1, 0, 0]}>
                <boxGeometry args={[1, 190, 2]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>
         </group>
       );
    case 'toilet':
        return (
           <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
               <mesh position={[-width/2 + 10, 40, 0]}>
                   <boxGeometry args={[20, 40, 40]} />
                   <meshStandardMaterial color="white" />
               </mesh>
               <mesh position={[0, 20, 0]}>
                   <boxGeometry args={[30, 35, 30]} />
                   <meshStandardMaterial color="white" />
               </mesh>
           </group>
        );
     case 'door':
     case 'entry_door':
        return (
           <group position={[px, 100, pz]} rotation={[0, rotY, 0]}>
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
            <group position={[px, 120, pz]} rotation={[0, rotY, 0]}>
                 <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[width + 4, 110, OPENING_THICKNESS]} />
                    <meshStandardMaterial color="#222" />
                 </mesh>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[width, 100, OPENING_THICKNESS + 2]} />
                    <meshPhysicalMaterial 
                       color="#88ccff" 
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
        <mesh position={[px, 10, pz]} rotation={[0, rotY, 0]}>
           <boxGeometry args={[width, 20, height]} />
           <meshStandardMaterial color="#ccc" wireframe />
        </mesh>
      );
  }
};

const Room3D: React.FC<{ room: Room }> = ({ room }) => {
  const { x, y, width, height, floorFinish } = room;
  const px = x + width / 2;
  const pz = y + height / 2;

  const floorColor = 
    floorFinish === 'tiled' ? '#e0e0e0' : 
    floorFinish === 'wood' ? '#d4a373' :
    floorFinish === 'concrete' ? '#999' :
    '#f5f5f5';

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

const SceneSetup = ({ rooms }: { rooms: Room[] }) => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  
  useEffect(() => {
     if (rooms.length === 0) return;

     const minX = Math.min(...rooms.map(r => r.x));
     const maxX = Math.max(...rooms.map(r => r.x + r.width));
     const minY = Math.min(...rooms.map(r => r.y));
     const maxY = Math.max(...rooms.map(r => r.y + r.height));

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
  }, [rooms, camera, controls]);

  return null;
};

const Canvas3D: React.FC<Canvas3DProps> = ({ data, activeFloor }) => {
  const visibleRooms = data.rooms.filter(r => r.floor === activeFloor);
  const visibleElements = data.elements.filter(e => e.floor === activeFloor);

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 cursor-grab active:cursor-grabbing">
        <Canvas 
            shadows 
            dpr={[1, 2]}
            camera={{ position: [0, 800, 800], fov: 50, near: 1, far: 100000 }} 
            gl={{ antialias: true, logarithmicDepthBuffer: true }}
        >
           <Suspense fallback={<Html center><div className="text-xs font-mono animate-pulse">LOADING 3D...</div></Html>}>
               <SceneSetup rooms={visibleRooms} />
               <ambientLight intensity={0.8} />
               <directionalLight position={[3000, 4000, 2000]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.001}>
                  <orthographicCamera attach="shadow-camera" args={[-5000, 5000, 5000, -5000]} near={0.1} far={20000} />
               </directionalLight>
               
               <group>
                  {visibleRooms.map(room => <Room3D key={room.id} room={room} />)}
                  {visibleElements.map(el => <Element3D key={el.id} element={el} />)}
                  
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
