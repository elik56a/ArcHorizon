
import React, { useState } from 'react';
import { SketchData, ElementType, RoomType } from '../types';
import { 
  Settings2, PlusSquare, Trash2, Type, Palette, Maximize, RotateCw, Box,
  DoorOpen, DoorClosed, AppWindow, TrendingUp, TrendingDown,
  BedDouble, Bed, Armchair, Utensils, Monitor, RectangleVertical,
  CircleDot, Droplets, Bath, ShowerHead, Flame, Square
} from 'lucide-react';

interface RightSidePanelProps {
  selection: { id: string; type: 'room' | 'element' } | null;
  data: SketchData | null;
  onUpdateItem: (id: string, type: 'room' | 'element', field: string, value: any) => void;
  onDeleteItem: (id: string, type: 'room' | 'element') => void;
  onAddItem: (type: ElementType | RoomType, category: 'room' | 'element') => void;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({ 
  selection, 
  data, 
  onUpdateItem, 
  onDeleteItem,
  onAddItem 
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'settings'>('library');

  if (!data) return <div className="w-80 bg-white border-l border-gray-200 h-full"></div>;

  // --- EDIT MODE ---
  if (selection) {
    const item = selection.type === 'room' 
      ? data.rooms.find(r => r.id === selection.id)
      : data.elements.find(e => e.id === selection.id);

    if (!item) return null;

    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <Settings2 size={12} />
              Properties
           </div>
           <h2 className="text-lg font-bold capitalize text-gray-900 flex items-center justify-between">
             {item.type.replace('_', ' ')}
             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-mono">{selection.type}</span>
           </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
           {/* Identity Group */}
           <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><Type size={12}/> Identity</label>
              {selection.type === 'room' && (
                <div>
                   <span className="text-[10px] text-gray-400 block mb-1">Name</span>
                   <input 
                     type="text" 
                     value={(item as any).name || ''} 
                     onChange={(e) => onUpdateItem(item.id, selection.type, 'name', e.target.value)}
                     className="w-full p-2 text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
              )}
           </div>

           {/* Geometry Group */}
           <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><Maximize size={12}/> Dimensions & Pos</label>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                     <span className="text-[10px] text-gray-400 block mb-1">Width (cm)</span>
                     <input 
                       type="number" 
                       value={item.width} 
                       onChange={(e) => onUpdateItem(item.id, selection.type, 'width', Number(e.target.value))}
                       className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                  </div>
                  <div>
                     <span className="text-[10px] text-gray-400 block mb-1">Depth (cm)</span>
                     <input 
                       type="number" 
                       value={item.height} 
                       onChange={(e) => onUpdateItem(item.id, selection.type, 'height', Number(e.target.value))}
                       className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                  </div>
                  <div>
                     <span className="text-[10px] text-gray-400 block mb-1">X Pos</span>
                     <input 
                       type="number" 
                       value={item.x} 
                       onChange={(e) => onUpdateItem(item.id, selection.type, 'x', Number(e.target.value))}
                       className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                  </div>
                  <div>
                     <span className="text-[10px] text-gray-400 block mb-1">Y Pos</span>
                     <input 
                       type="number" 
                       value={item.y} 
                       onChange={(e) => onUpdateItem(item.id, selection.type, 'y', Number(e.target.value))}
                       className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                  </div>
              </div>
           </div>

           {/* Rotation & Style */}
           <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><RotateCw size={12}/> Transform & Style</label>
              {selection.type === 'element' && (
                 <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-xs">Rotation</span>
                    <div className="flex gap-1">
                       {[0, 90, 180, 270].map(deg => (
                          <button 
                             key={deg}
                             onClick={() => onUpdateItem(item.id, selection.type, 'rotation', deg)}
                             className={`w-8 h-8 text-[10px] font-bold rounded ${
                                // @ts-ignore
                                (item.rotation || 0) === deg ? 'bg-black text-white' : 'bg-white border hover:bg-gray-100'
                             }`}
                          >
                             {deg}°
                          </button>
                       ))}
                    </div>
                 </div>
              )}

              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                     <Palette size={12} className="text-gray-400"/>
                     <span className="text-xs font-medium">Appearance</span>
                 </div>
                 <div className="grid grid-cols-5 gap-2">
                    {['#ffffff', '#f3f4f6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#000000', 'transparent'].map(color => (
                       <button 
                          key={color}
                          onClick={() => onUpdateItem(item.id, selection.type, 'color', color === 'transparent' ? undefined : color)}
                          className={`w-8 h-8 rounded-full border-2 ${item.color === color ? 'border-black scale-110' : 'border-gray-200'}`}
                          style={{ backgroundColor: color === 'transparent' ? 'white' : color }}
                          title={color}
                       >
                          {color === 'transparent' && <span className="text-[8px] text-gray-400">Auto</span>}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div>
                 <span className="text-[10px] text-gray-400 block mb-1">Opacity</span>
                 <input 
                    type="range" 
                    min="0" max="1" step="0.1"
                    value={item.opacity ?? 1}
                    onChange={(e) => onUpdateItem(item.id, selection.type, 'opacity', parseFloat(e.target.value))}
                    className="w-full accent-black"
                 />
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
           <button 
             onClick={() => onDeleteItem(item.id, selection.type)}
             className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold flex items-center justify-center gap-2 transition-colors"
           >
              <Trash2 size={16} /> Delete Element
           </button>
        </div>
      </div>
    );
  }

  // --- LIBRARY MODE ---
  const elementCategories = {
     'Structures': ['door', 'window', 'entry_door', 'stairs_up', 'stairs_down'],
     'Furniture': ['bed_king', 'bed_single', 'sofa', 'dining_table', 'desk', 'wardrobe'],
     'Sanitary': ['toilet', 'sink', 'bathtub', 'shower', 'stove']
  };

  const getIconForType = (type: string) => {
      switch (type) {
          // Structures
          case 'door': return <DoorOpen size={20} className="text-blue-600" />;
          case 'entry_door': return <DoorClosed size={20} className="text-blue-800" />;
          case 'window': return <AppWindow size={20} className="text-cyan-600" />;
          case 'stairs_up': return <TrendingUp size={20} className="text-gray-600" />;
          case 'stairs_down': return <TrendingDown size={20} className="text-gray-600" />;
          
          // Furniture
          case 'bed_king': return <BedDouble size={20} className="text-indigo-600" />;
          case 'bed_single': return <Bed size={20} className="text-indigo-500" />;
          case 'sofa': return <Armchair size={20} className="text-orange-600" />;
          case 'dining_table': return <Utensils size={20} className="text-gray-700" />;
          case 'desk': return <Monitor size={20} className="text-gray-600" />;
          case 'wardrobe': return <RectangleVertical size={20} className="text-amber-700" />;
          
          // Sanitary
          case 'toilet': return <CircleDot size={20} className="text-cyan-500" />;
          case 'sink': return <Droplets size={20} className="text-cyan-400" />;
          case 'bathtub': return <Bath size={20} className="text-cyan-600" />;
          case 'shower': return <ShowerHead size={20} className="text-cyan-600" />;
          case 'stove': return <Flame size={20} className="text-red-500" />;
          
          default: return <Square size={20} className="text-gray-400" />;
      }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-20">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
           <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <Box size={12} />
              Library
           </div>
           <h2 className="text-lg font-bold text-gray-900">Add Elements</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
             <h3 className="text-xs font-bold text-blue-800 mb-2 uppercase">Architecture</h3>
             <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => onAddItem('bedroom', 'room')} className="bg-white p-2 rounded border border-blue-200 shadow-sm hover:shadow text-xs font-medium text-left flex items-center gap-2 text-blue-900">
                    <PlusSquare size={14} /> Add Room
                 </button>
             </div>
          </div>

          {Object.entries(elementCategories).map(([cat, types]) => (
             <div key={cat}>
                <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase border-b pb-1">{cat}</h3>
                <div className="grid grid-cols-2 gap-2">
                   {types.map((t) => (
                      <button 
                        key={t}
                        onClick={() => onAddItem(t as ElementType, 'element')}
                        className="bg-white hover:bg-gray-50 p-2 rounded border border-gray-200 shadow-sm text-xs font-medium text-left capitalize transition-all active:scale-95 flex flex-col items-center justify-center gap-1 h-16 text-center group"
                      >
                         <div className="w-8 h-8 bg-gray-50 rounded-full mb-1 flex items-center justify-center group-hover:bg-white transition-colors">
                            {getIconForType(t)}
                         </div>
                         <span className="truncate w-full">{t.replace('_', ' ')}</span>
                      </button>
                   ))}
                </div>
             </div>
          ))}
      </div>
      <div className="p-4 text-[10px] text-gray-400 text-center bg-gray-50 border-t">
         Select an item to add it to the center of the active floor.
      </div>
    </div>
  );
};

export default RightSidePanel;
