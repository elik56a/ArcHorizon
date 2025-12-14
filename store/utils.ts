
import { SketchData, Layer, Room, ArchitecturalElement, DrawingPath } from '../types';
import { getLayerConfig, LAYER_CONFIGS } from '../config/layerRegistry';
import { runLayerValidators } from '../services/validators/registry';
import { Discipline } from '../types/layer';

// Ensure data structure is consistent and has required layers
export const normalizeSketchData = (data: SketchData): SketchData => {
    if (!data.layers) data.layers = [];
    const standardDisciplines: Discipline[] = ['arc', 'plumbing', 'elec', 'hvac', 'fire'];
    
    standardDisciplines.forEach(disc => {
        const exists = data.layers.find(l => l.discipline === disc);
        if (!exists) {
            // Migrate legacy data to ARC layer if it exists
            if (disc === 'arc' && (data.rooms.length > 0 || data.elements.length > 0)) {
                 const arcLayer: Layer = {
                    id: 'layer-arc-main',
                    discipline: 'arc',
                    name: 'Architecture',
                    isVisible: true,
                    isLocked: false,
                    // @ts-ignore
                    rooms: data.rooms || [],
                    // @ts-ignore
                    elements: data.elements || [],
                    // @ts-ignore
                    drawings: data.drawings || [],
                    validations: []
                };
                data.layers.push(arcLayer);
            } else {
                data.layers.push({
                    id: `layer-${disc}-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                    discipline: disc,
                    name: LAYER_CONFIGS[disc].label,
                    isVisible: true,
                    isLocked: false,
                    rooms: [],
                    elements: [],
                    drawings: [],
                    validations: []
                });
            }
        }
    });

    data.layers = data.layers.map(l => ({ ...l, validations: l.validations || [] }));
    
    // Flatten for legacy view components (Canvas2D/3D still consume flat arrays)
    const allRooms: Room[] = [];
    const allElements: ArchitecturalElement[] = [];
    const allDrawings: DrawingPath[] = [];
    
    data.layers.forEach(layer => {
        if (layer.isVisible) {
            if (layer.rooms) allRooms.push(...layer.rooms.map(r => ({...r, layerId: layer.id})));
            if (layer.elements) allElements.push(...layer.elements.map(el => ({...el, layerId: layer.id})));
            if (layer.drawings) allDrawings.push(...layer.drawings.map(d => ({...d, layerId: layer.id})));
        }
    });
    
    data.rooms = allRooms;
    data.elements = allElements;
    data.drawings = allDrawings;
    
    return data;
};

// Auto-save logic
export const autoSave = (currentData: SketchData | undefined, savedSketches: SketchData[]) => {
    if (!currentData) return savedSketches;
    const existingIndex = savedSketches.findIndex(s => s.id === currentData.id);
    const newSaved = [...savedSketches];
    if (existingIndex >= 0) newSaved[existingIndex] = currentData;
    else newSaved.push(currentData);
    return newSaved;
};

// Validation logic
export const validateAndReturn = (sketch: SketchData, activeLayerId: string): SketchData => {
    const activeLayerIndex = sketch.layers.findIndex(l => l.id === activeLayerId);
    if (activeLayerIndex === -1) return sketch;
    
    const layer = sketch.layers[activeLayerIndex];
    const config = getLayerConfig(layer.discipline);
    const results = runLayerValidators(layer, sketch, config.validators);
    
    const newLayers = [...sketch.layers];
    newLayers[activeLayerIndex] = { ...layer, validations: results };
    
    return { ...sketch, layers: newLayers };
};
