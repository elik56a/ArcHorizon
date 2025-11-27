
import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid as Grid3D, Environment, ContactShadows, Html, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useProjectStore } from '../../../store/useProjectStore';
import { FLOOR_PITCH } from '../constants';
import { Room3D } from './Room3D';
import { Element3D } from './Element3D';
import { SceneSetup } from './SceneSetup';

const Canvas3D: React.FC<any> = ({ data, activeFloor, showAllFloors = false, onUpdate, cameraStateRef, cameraMode = 'perspective' }) => {
  const { viewStyle } = useProjectStore();
  const isVivid = viewStyle === 'vivid';
  
  const visibleRooms = showAllFloors ? data.rooms : data.rooms.filter((r:any) => r.floor === activeFloor);
  const visibleElements = showAllFloors ? data.elements : data.elements.filter((e:any) => e.floor === activeFloor);
  const elementRefs = useRef<{[key: string]: THREE.Group}>({});

  return (
    <div className={`w-full h-full cursor-grab active:cursor-grabbing touch-none transition-colors duration-1000 ${isVivid ? 'bg-gradient-to-b from-blue-200 to-orange-100' : 'bg-gradient-to-b from-gray-100 to-gray-200'}`}>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
           {cameraMode === 'orthographic' ? (
               <OrthographicCamera makeDefault position={[0, 1000, 0]} zoom={0.5} near={-2000} far={50000} />
           ) : (
               <PerspectiveCamera makeDefault position={[0, 800, 800]} fov={50} near={1} far={100000} />
           )}
           
           <Suspense fallback={<Html center>LOADING...</Html>}>
               <SceneSetup data={data} activeFloor={activeFloor} showAllFloors={showAllFloors} cameraMode={cameraMode} />
               
               {isVivid ? (
                   <>
                       <ambientLight intensity={0.6} color="#ffdcae" />
                       <directionalLight position={[3000, 2000, 1000]} intensity={1.5} castShadow shadow-bias={-0.0001} shadow-mapSize={[2048, 2048]} />
                       <Environment preset="city" background={false} blur={0.8} />
                   </>
               ) : (
                   <>
                       <ambientLight intensity={0.8} />
                       <directionalLight position={[3000, 4000, 2000]} intensity={1} castShadow />
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
                  
                  {!isVivid && <Grid3D position={[0, -1, 0]} infiniteGrid fadeDistance={50000} cellColor="#bbb" sectionColor="#999" />}
                  
                  <ContactShadows resolution={1024} scale={10000} blur={2.5} opacity={0.5} far={100} color="#000000" />
               </group>
               
               <OrbitControls 
                    makeDefault 
                    minPolarAngle={cameraMode === 'orthographic' ? 0 : 0} 
                    maxPolarAngle={cameraMode === 'orthographic' ? 0 : Math.PI / 2.1} 
                    enableRotate={cameraMode !== 'orthographic'}
                    enableDamping={true}
                    dampingFactor={0.05}
                    enablePan={true}
                    enableZoom={true}
               />
           </Suspense>
        </Canvas>
    </div>
  );
};

export default Canvas3D;
