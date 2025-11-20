
import React from 'react';
import { SketchData, ElementType, RoomType } from '../types';
import { THEME } from '../theme';
import { 
  Settings2, Trash2, Box, LayoutGrid,
  DoorOpen, Maximize2, BedDouble, Bed, Sofa, 
  Utensils, Monitor, Archive, Bath, ShowerHead, 
  Waves, Flame, Move, Trees
} from 'lucide-react';

interface RightSidePanelProps {
  selection: { id: string; type: 'room' | 'element' } | null;
  data: SketchData | null;
  onUpdateItem: (id: string, type: 'room' | 'element', field: string, value: any) => void;
  onDeleteItem: (id: string, type: 'room' | 'element') => void;
  onAddItem: (type: ElementType | RoomType, category: 'room' | 'element') => void;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({ selection, data, onUpdateItem, onDeleteItem, onAddItem }) => {
  
  // --- ITEM PROPERTIES MODE ---
  if (selection && data) {
    const item = selection.type === 'room' ? data.rooms.find(r => r.id === selection.id) : data.elements.find(e => e.id === selection.id);
    if (!item) return null;

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
                 <input type="text" value={(item as any).name || ''} onChange={(e) => onUpdateItem(item.id, selection.type, 'name', e.target.value)} className={THEME.input} placeholder="Room Name" />
              )}
              {selection.type === 'element' && (
                  <div className="text-sm text-gray-500 italic py-2">Element ID: {item.id}</div>
              )}
           </div>

           <div>
              <label className={THEME.label}>Dimensions & Position</label>
              <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">W</span>
                      <input type="number" value={item.width} onChange={(e) => onUpdateItem(item.id, selection.type, 'width', Number(e.target.value))} className={`${THEME.input} pl-6`} />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">H</span>
                      <input type="number" value={item.height} onChange={(e) => onUpdateItem(item.id, selection.type, 'height', Number(e.target.value))} className={`${THEME.input} pl-6`} />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">X</span>
                      <input type="number" value={item.x} onChange={(e) => onUpdateItem(item.id, selection.type, 'x', Number(e.target.value))} className={`${THEME.input} pl-6`} />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-mono">Y</span>
                      <input type="number" value={item.y} onChange={(e) => onUpdateItem(item.id, selection.type, 'y', Number(e.target.value))} className={`${THEME.input} pl-6`} />
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
                        onClick={() => onUpdateItem(item.id, selection.type, 'rotation', deg)} 
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
            onClick={() => onDeleteItem(item.id, selection.type)} 
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
          case 'door': return <DoorOpen size={20} />;
          case 'entry_door': return <DoorOpen size={20} strokeWidth={2.5} />;
          case 'window': return <Maximize2 size={20} />;
          case 'stairs_up': return <Move size={20} className="-rotate-45" />;
          case 'bedroom': return <BedDouble size={20} />;
          case 'garden': return <Trees size={20} />;
          case 'bed_king': return <BedDouble size={20} />;
          case 'bed_single': return <Bed size={20} />;
          case 'sofa': return <Sofa size={20} />;
          case 'dining_table': return <Utensils size={20} />;
          case 'desk': return <Monitor size={20} />;
          case 'wardrobe': return <Archive size={20} />;
          case 'toilet': return <Bath size={20} className="scale-75" />;
          case 'sink': return <Waves size={20} />;
          case 'bathtub': return <Bath size={20} />;
          case 'shower': return <ShowerHead size={20} />;
          case 'stove': return <Flame size={20} />;
          default: return <Box size={20} />;
      }
  };

  const libraryCategories = {
     'Structure': ['bedroom', 'garden', 'door', 'window', 'entry_door', 'stairs_up'],
     'Furniture': ['bed_king', 'bed_single', 'sofa', 'dining_table', 'desk', 'wardrobe'],
     'Utilities': ['toilet', 'sink', 'bathtub', 'shower', 'stove']
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-5 border-b border-gray-200 bg-white">
           <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-2">
              <LayoutGrid size={14} /> Component Library
           </div>
           <h2 className="text-lg font-bold text-gray-900">Add Elements</h2>
           <p className="text-xs text-gray-500 mt-1">Click to add to center of active floor</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {Object.entries(libraryCategories).map(([cat, types]) => (
             <div key={cat}>
                <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 px-1">{cat}</h3>
                <div className="grid grid-cols-3 gap-2">
                   {types.map((t) => (
                      <button 
                        key={t}
                        onClick={() => onAddItem(t as any, t === 'bedroom' || t === 'garden' ? 'room' : 'element')}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all group bg-white aspect-square"
                        title={`Add ${t.replace('_', ' ')}`}
                      >
                         <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                            {getIconForType(t)}
                         </div>
                         <span className="text-[10px] font-medium text-gray-600 text-center capitalize leading-tight group-hover:text-blue-700">
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
