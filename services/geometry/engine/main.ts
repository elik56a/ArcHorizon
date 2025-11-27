import { SketchData } from '../../../types';
import { normalizeTypes } from './normalization';
import { sanitizeScale, pruneArtifacts } from './sanitization';
import { separateRooms, snapRooms, condenseLayout, stackFloors } from './topology';
import { ensureConnectivity, fixDoors, limitEntryDoors, removeDuplicates } from './connections';
import { ensureNaturalLight, fixWindows, pruneExteriorDoors } from './openings';
import { optimizeFurniturePlacement } from './furniture';

export const optimizeDesign = (data: SketchData): SketchData => {
    let newData = JSON.parse(JSON.stringify(data)) as SketchData;
    
    // 0. PRE-PROCESS
    newData = normalizeTypes(newData);
    newData = sanitizeScale(newData);
    newData = pruneArtifacts(newData);
    
    // 1. TOPOLOGY RESOLUTION
    // Fix "Floating Rooms" by pulling everything into a cluster
    newData = condenseLayout(newData);
    
    // Iterative push/pull to stabilize layout without overlaps or gaps
    newData = separateRooms(newData); // Remove stacking
    newData = snapRooms(newData);     // Close gaps
    newData = separateRooms(newData); // Clean up any new collisions from snapping
    
    // ALIGN FLOORS (Vertical Stacking)
    newData = stackFloors(newData);

    // 2. LOGICAL CONNECTIONS
    // Force connectivity and add doors
    ensureConnectivity(newData);
    ensureNaturalLight(newData);
    
    // 3. OPENING CORRECTION
    fixWindows(newData);
    fixDoors(newData);
    
    // 4. RULE ENFORCEMENT
    newData = removeDuplicates(newData);
    newData = limitEntryDoors(newData);
    newData = pruneExteriorDoors(newData);
    
    // 5. INTERIOR LAYOUT
    optimizeFurniturePlacement(newData);

    return newData;
};