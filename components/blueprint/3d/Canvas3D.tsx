
import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid as Grid3D, Environment, ContactShadows, Html, OrthographicCamera, PerspectiveCamera, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useProjectStore } from '../../../store/useProjectStore';
import { FLOOR_PITCH } from '../constants';
import { Room3D } from './Room3D';
import { Element3D } from './Element3D';
import { SceneSetup } from './SceneSetup';
import { SketchData } from '../../../types';

interface Canvas3DProps {
    data: SketchData;
    activeFloor: number;
    showAllFloors?: boolean;
    onUpdate?: any;
    cameraStateRef?: any;
    cameraMode?: 'orthographic' | 'perspective';
}

const Canvas3D: React.FC<Canvas3DProps> = ({ data, activeFloor, showAllFloors = false, onUpdate, cameraStateRef, cameraMode = 'perspective' }) => {
  const { viewStyle } = useProjectStore();
  const isVivid = viewStyle === 'vivid'; // Vivid is now "Realistic"
  
  const visibleRooms = showAllFloors ? data.rooms : data.rooms.filter((r:any) => r.floor === activeFloor);
  const visibleElements = showAllFloors ? data.elements : data.elements.filter((e:any) => e.floor === activeFloor);
  const elementRefs = useRef<{[key: string]: THREE.Group}>({});

  return (
    <div className={`w-full h-full cursor-grab active:cursor-grabbing touch-none transition-colors duration-1000 ${isVivid ? 'bg-gradient-to-b from-[#eef2f3] to-[#8e9eab]' : 'bg-[#e5e5e5]'}`}>
        <Canvas 
            shadows="soft" 
            dpr={[1, 2]} 
            gl={{ 
                antialias: true, 
                preserveDrawingBuffer: true,
                logarithmicDepthBuffer: true // Helps with z-fighting on large scenes
            }}
        >
           {/* Camera Setup: Increased NEAR plane to 10 to significantly improve depth precision and stop floor flickering */}
           {cameraMode === 'orthographic' ? (
               <OrthographicCamera makeDefault position={[0, 1000, 0]} zoom={0.5} near={-2000} far={50000} />
           ) : (
               <PerspectiveCamera makeDefault position={[0, 800, 800]} fov={45} near={10} far={100000} />
           )}
           
           <Suspense fallback={<Html center><div className="text-xs font-bold font-mono animate-pulse">BUILDING SCENE...</div></Html>}>
               <SceneSetup data={data} activeFloor={activeFloor} showAllFloors={showAllFloors} cameraMode={cameraMode as 'orthographic' | 'perspective'} />
               
               {isVivid ? (
                   <>
                       <ambientLight intensity={0.4} color="#ffffff" />
                       <directionalLight 
                            position={[5000, 8000, 3000]} 
                            intensity={1.2} 
                            castShadow 
                            shadow-mapSize={[4096, 4096]}
                            shadow-bias={-0.0005} // Reducing bias artifacts
                       >
                           <orthographicCamera attach="shadow-camera" args={[-3000, 3000, 3000, -3000]} />
                       </directionalLight>
                       <Environment preset="apartment" background={false} blur={0.5} />
                       {/* Soft shadows for realistic grounding */}
                       <SoftShadows size={40} samples={16} focus={0} />
                   </>
               ) : (
                   <>
                       <ambientLight intensity={0.9} color="white" />
                       <directionalLight position={[1000, 2000, 1000]} intensity={0.6} castShadow />
                       <Environment preset="city" />
                   </>
               )}

               <group>
                  {visibleRooms.map((room: any) => (
                    <Room3D key={room.id} room={room} elements={visibleElements.filter((e:any) => e.roomId === room.id || e.floor === room.floor)} yOffset={(room.floor - 1) * FLOOR_PITCH} isVivid={isVivid} />
                  ))}
                  {visibleElements.map((el: any, idx: number) => (
                      <Element3D key={el.id} index={idx} element={el} onPointerDown={() => {}} elementRefs={elementRefs} yOffset={(el.floor - 1) * FLOOR_PITCH} isVivid={isVivid} />
                  ))}
                  
                  {!isVivid && <Grid3D position={[0, -1, 0]} infiniteGrid fadeDistance={25000} cellColor="#999" sectionColor="#555" />}
                  
                  {/* Contact Shadows are heavy, only use in realistic mode or very subtly */}
                  {isVivid && <ContactShadows resolution={1024} scale={5000} blur={2} opacity={0.4} far={50} color="#000000" />}
               </group>
               
               <OrbitControls 
                    makeDefault 
                    minPolarAngle={0} 
                    maxPolarAngle={Math.PI / 2.1} 
                    enableRotate={cameraMode !== 'orthographic'}
                    enableDamping={true}
                    dampingFactor={0.08}
                    enablePan={true}
                    enableZoom={true}
                    maxDistance={5000}
               />
           </Suspense>
        </Canvas>
    </div>
  );
};

export default Canvas3D;
