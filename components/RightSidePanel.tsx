
import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { THEME } from '../theme';
import { 
  Settings2, Trash2, Box, LayoutGrid,
  DoorOpen, Maximize2, BedDouble, Bed, Sofa, 
  Utensils, Monitor, Archive, Bath, ShowerHead, 
  Waves, Flame, Move, Trees, Palette, Car, Armchair,
  Lamp, Tv, Refrigerator
} from 'lucide-react';

const RightSidePanel: React.FC = () => {
  const { selection, getCurrentSketch, updateItem, deleteItem, addItem, unitSystem } = useProjectStore();
  const data = getCurrentSketch();

  // --- ITEM PROPERTIES MODE ---
  if (selection && data) {
    const item = selection.type === 'room' ? data.rooms.find(r => r.id === selection.id) : data.elements.find(e => e.id === selection.id);
    if (!item) return null;

    const isImperial = unitSystem === 'imperial';

    // Converters
    const toDisplay = (val: number) => isImperial ? Number((val * 0.0328084).toFixed(2)) : val;
    const fromInput = (val: number) => isImperial ? Math.round(val / 0.0328084) : val;

    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-5 border-b border-gray-200 bg-white">
           <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-2">
              <Settings2 size={14} /> Selected {selection.type}
           </div>
           <div className="flex items-baseline justify-between">
               <h2 className="text-lg font-bold text-gray-900 capitalize">{item.type.replace(/_/g, ' ')}</h2>
               <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{selection.id.split('-')[1] || selection.id}</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
           <div>
              <label className={THEME.label}>Identity</label>
              {selection.type === 'room' && (
                 <input type="text" value={(item as any).name || ''} onChange={(e) => updateItem(item.id, selection.type, 'name', e.target.value)} className={THEME.input} placeholder="Room Name" />
              )}
              {selection.type === 'element' && (
                  <div className="text-sm text-gray-500 italic py-1 mb-2">Type: {item.type}</div>
              )}
              <div className="mt-2">
                 <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">Label</label>
                 <input 
                    type="text" 
                    value={(item as any).label || ''} 
                    onChange={(e) => updateItem(item.id, selection.type, 'label', e.target.value)} 
                    className={THEME.input} 
                    placeholder="Add visible label..." 
                 />
              </div>
           </div>
           
           <div>
              <label className={THEME.label}>Visual Styles</label>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1">
                      <span className="text-[10px] text-gray-500 mb-1 block font-medium">Color</span>
                      <div className="flex gap-2 items-center">
                          <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-300 shadow-sm">
                            <input 
                                type="color" 
                                value={item.color || '#ffffff'} 
                                onChange={(e) => updateItem(item.id, selection.type, 'color', e.target.value)}
                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0" 
                            />
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{item.color || '#ffffff'}</span>
                      </div>
                  </div>
                  <div className="flex-1">
                       <span className="text-[10px] text-gray-500 mb-1 block font-medium">Opacity</span>
                       <div className="flex items-center gap-2">
                           <input 
                             type="range" min="0.1" max="1" step="0.1" 
                             value={item.opacity ?? 1} 
                             onChange={(e) => updateItem(item.id, selection.type, 'opacity', Number(e.target.value))}
                             className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                           />
                           <span className="text-[10px] w-6 text-right font-mono text-gray-500">{Math.round((item.opacity ?? 1) * 100)}%</span>
                       </div>
                  </div>
              </div>
           </div>

           <div>
              <label className={THEME.label}>Dimensions & Position <span className="text-gray-400 font-normal lowercase ml-1">({isImperial ? 'ft' : 'cm'})</span></label>
              <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">W</span>
                      <input 
                        type="number" 
                        value={toDisplay(item.width)} 
                        onChange={(e) => updateItem(item.id, selection.type, 'width', fromInput(Number(e.target.value)))} 
                        className={`${THEME.input} pl-6`} 
                      />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">H</span>
                      <input 
                        type="number" 
                        value={toDisplay(item.height)} 
                        onChange={(e) => updateItem(item.id, selection.type, 'height', fromInput(Number(e.target.value)))} 
                        className={`${THEME.input} pl-6`} 
                      />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">X</span>
                      <input 
                        type="number" 
                        value={toDisplay(item.x)} 
                        onChange={(e) => updateItem(item.id, selection.type, 'x', fromInput(Number(e.target.value)))} 
                        className={`${THEME.input} pl-6`} 
                      />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">Y</span>
                      <input 
                        type="number" 
                        value={toDisplay(item.y)} 
                        onChange={(e) => updateItem(item.id, selection.type, 'y', fromInput(Number(e.target.value)))} 
                        className={`${THEME.input} pl-6`} 
                      />
                  </div>
              </div>
           </div>

           {selection.type === 'element' && (
             <div>
                <label className={THEME.label}>Rotation</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                   {[0, 90, 180, 270].map(deg => (
                      <button 
                        key={deg} 
                        onClick={() => updateItem(item.id, selection.type, 'rotation', deg)} 
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${// @ts-ignore
                        (item.rotation || 0) === deg ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                         {deg}°
                      </button>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50">
           <button 
            onClick={() => deleteItem(item.id, selection.type)} 
            className="w-full py-2.5 bg-white border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-all rounded-md flex items-center justify-center gap-2 shadow-sm"
           >
              <Trash2 size={16} /> Delete {selection.type === 'room' ? 'Room' : 'Object'}
           </button>
        </div>
      </div>
    );
  }

  // --- LIBRARY MODE ---
  
  const getIconForType = (type: string) => {
      switch(type) {
          case 'living': return <Armchair size={20} />;
          case 'kitchen': return <Utensils size={20} />;
          case 'bedroom': return <BedDouble size={20} />;
          case 'bathroom': return <Bath size={20} />;
          case 'dining': return <Utensils size={20} />;
          case 'garden': return <Trees size={20} />;
          case 'parking': return <Car size={20} />;
          case 'pool': return <Waves size={20} />;
          
          case 'door': 
          case 'entry_door': return <DoorOpen size={20} />;
          case 'window': return <Maximize2 size={20} />;
          case 'stairs_up': return <Move size={20} className="-rotate-45" />;
          
          case 'bed_king': return <BedDouble size={20} />;
          case 'bed_single': return <Bed size={20} />;
          case 'nightstand': return <Box size={16} />;
          
          case 'sofa': return <Sofa size={20} />;
          case 'sofa_l_shape': return <Sofa size={20} />;
          case 'tv_unit': return <Tv size={20} />;
          case 'dining_table': return <Utensils size={20} />;
          case 'desk': return <Monitor size={20} />;
          case 'wardrobe': return <Archive size={20} />;
          
          case 'toilet': return <Bath size={20} className="scale-75" />;
          case 'sink_single': return <Waves size={20} />;
          case 'bathtub': return <Bath size={20} />;
          case 'shower': return <ShowerHead size={20} />;
          case 'stove': return <Flame size={20} />;
          case 'fridge': return <Refrigerator size={20} />;
          default: return <Box size={20} />;
      }
  };

  const structuralZones = ['living', 'kitchen', 'bedroom', 'bathroom', 'dining', 'garden', 'parking', 'utility'];

  const libraryCategories = {
     'Openings': ['door', 'entry_door', 'sliding_door', 'window', 'stairs_up'],
     'Furniture': ['bed_king', 'bed_single', 'nightstand', 'sofa', 'sofa_l_shape', 'armchair', 'dining_table', 'tv_unit', 'wardrobe', 'desk'],
     'Wet Areas': ['toilet', 'sink_single', 'shower', 'bathtub', 'stove', 'fridge', 'kitchen_island']
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-5 border-b border-gray-200 bg-white">
           <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-2">
              <LayoutGrid size={14} /> Component Library
           </div>
           <h2 className="text-lg font-bold text-gray-900">Add Elements</h2>
           <p className="text-xs text-gray-500 mt-1">Drag or click to add to active floor</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
          
          {/* Top Section: Structural Zones */}
          <div>
             <h3 className="text-[11px] font-bold uppercase text-gray-800 bg-gray-100 py-1.5 px-2 rounded mb-3 tracking-wider flex items-center gap-2 border border-gray-200">
                <Box size={12} className="text-blue-600"/> Room Zones
             </h3>
             <div className="grid grid-cols-2 gap-2">
                {structuralZones.map((t) => (
                    <button 
                        key={t}
                        onClick={() => addItem(t as any, 'room')}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group bg-white text-left"
                    >
                         <div className="text-gray-400 group-hover:text-black transition-colors">
                            {getIconForType(t)}
                         </div>
                         <span className="text-xs font-bold text-gray-700 group-hover:text-black capitalize">
                            {t}
                         </span>
                    </button>
                ))}
             </div>
          </div>

          {/* Other Categories */}
          {Object.entries(libraryCategories).map(([cat, types]) => (
             <div key={cat}>
                <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 px-1 border-b border-gray-100 pb-1">{cat}</h3>
                <div className="grid grid-cols-3 gap-2">
                   {types.map((t) => (
                      <button 
                        key={t}
                        onClick={() => addItem(t as any, 'element')}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all group bg-white aspect-square"
                        title={`Add ${t.replace(/_/g, ' ')}`}
                      >
                         <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                            {getIconForType(t)}
                         </div>
                         <span className="text-[10px] font-medium text-gray-600 text-center capitalize leading-tight group-hover:text-blue-700 overflow-hidden text-ellipsis w-full">
                            {t.replace(/_/g, ' ')}
                         </span>
                      </button>
                   ))}
                </div>
             </div>
          ))}
      </div>
    </div>
  );
};

export default RightSidePanel;
