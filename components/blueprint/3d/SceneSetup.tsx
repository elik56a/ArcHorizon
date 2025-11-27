
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { SketchData } from '../../../types';
import { FLOOR_PITCH } from '../constants';

interface SceneSetupProps { 
    data: SketchData; 
    activeFloor: number; 
    showAllFloors: boolean;
    cameraMode?: 'orthographic' | 'perspective';
}

export const SceneSetup = ({ data, activeFloor, showAllFloors, cameraMode }: SceneSetupProps) => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const lastProjectRef = useRef<string | null>(null);

  useEffect(() => {
     if (!data || data.rooms.length === 0) return;
     
     const minX = Math.min(...data.rooms.map(r => r.x));
     const maxX = Math.max(...data.rooms.map(r => r.x + r.width));
     const minY = Math.min(...data.rooms.map(r => r.y));
     const maxY = Math.max(...data.rooms.map(r => r.y + r.height));
     const width = maxX - minX;
     const depth = maxY - minY;
     const centerX = minX + width / 2;
     const centerZ = minY + depth / 2;
     const currentFloorY = (activeFloor - 1) * FLOOR_PITCH;
     const maxDim = Math.max(width, depth);
     const fitOffset = maxDim * 1.5;

     // Reset logic only if project changes
     if (data.id !== lastProjectRef.current) {
         lastProjectRef.current = data.id;
         
         if (cameraMode === 'orthographic') {
             // For Top-Down View
             camera.position.set(centerX, currentFloorY + 1000, centerZ);
             camera.lookAt(centerX, currentFloorY, centerZ);
             camera.zoom = 1; 
             camera.updateProjectionMatrix();
         } else {
             // For Perspective View
             camera.position.set(centerX, currentFloorY + fitOffset, centerZ + fitOffset);
             camera.lookAt(centerX, currentFloorY, centerZ);
         }

         if (controls) { 
             // @ts-ignore
             controls.target.set(centerX, currentFloorY, centerZ); 
             // @ts-ignore
             controls.update(); 
         }
     }
  }, [data.id, activeFloor, cameraMode]);
  return null;
};
