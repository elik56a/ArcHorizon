
import { Layer, SketchData, ValidationResult, ValidatorFn } from '../../types';

export const arcValidators: Record<string, ValidatorFn> = {
  'arc-missing-doors': (layer: Layer, sketch: SketchData): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    // Only check rooms on this layer
    layer.rooms.forEach(room => {
      // Skip outdoor/aux types
      if (['garden', 'parking', 'pool', 'terrace', 'balcony'].includes(room.type)) return;

      // Check if room has any door-like element associated with it
      // Note: In strict ARC mode, elements have roomId. In multi-layer, we might check geometric overlap.
      // For now, rely on roomId linkage which is maintained by the geometry engine.
      const hasDoor = layer.elements.some(el => 
        el.roomId === room.id && 
        ['door', 'entry_door', 'sliding_door', 'wall_opening'].includes(el.type)
      );

      if (!hasDoor) {
        results.push({
          id: `val-door-${room.id}`,
          layerId: layer.id,
          elementId: room.id,
          message: `Room "${room.name}" has no entrance/exit.`,
          severity: 'warning'
        });
      }
    });

    return results;
  },

  'arc-floating-elements': (layer: Layer, sketch: SketchData): ValidationResult[] => {
    const results: ValidationResult[] = [];
    // Example: Check for furniture totally outside any room
    // Simplified bounding box check
    
    layer.elements.forEach(el => {
       if (['door', 'window', 'wall_opening'].includes(el.type)) return; // Wall hosts are checked elsewhere
       
       const room = layer.rooms.find(r => r.id === el.roomId);
       if (!room) {
           // It might be floating or assigned to a deleted room
           results.push({
               id: `val-float-${el.id}`,
               layerId: layer.id,
               elementId: el.id,
               message: `${el.type} is not assigned to any room.`,
               severity: 'info'
           });
       }
    });

    return results;
  }
};
