
import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { THEME } from '../../../theme';
import { Settings2, Trash2 } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
    const { selection, getCurrentSketch, updateItem, deleteItem, unitSystem } = useProjectStore();
    const data = getCurrentSketch();

    if (!selection || !data) return null;

    const item = selection.type === 'room' ? data.rooms.find(r => r.id === selection.id) : data.elements.find(e => e.id === selection.id);
    if (!item) return null;

    const isImperial = unitSystem === 'imperial';
    const toDisplay = (val: number) => isImperial ? Number((val * 0.0328084).toFixed(2)) : val;
    const fromInput = (val: number) => isImperial ? Math.round(val / 0.0328084) : val;

    return (
      <div className="h-full flex flex-col bg-white">
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
};
