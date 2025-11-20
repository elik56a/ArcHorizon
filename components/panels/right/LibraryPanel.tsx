
import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { LayoutGrid, Box } from 'lucide-react';
import { getGroupedLibraryItems } from '../../../config/libraryConfig';

export const LibraryPanel: React.FC = () => {
  const { addItem } = useProjectStore();
  const groupedItems = getGroupedLibraryItems();

  // Separate "Zones" (Rooms) from everything else (Elements)
  const zones = groupedItems['Zones'] || [];
  // Flatten the rest into categories
  const categories = Object.keys(groupedItems).filter(k => k !== 'Zones');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-5 border-b border-gray-200 bg-white">
           <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-2">
              <LayoutGrid size={14} /> Component Library
           </div>
           <h2 className="text-lg font-bold text-gray-900">Add Elements</h2>
           <p className="text-xs text-gray-500 mt-1">Drag or click to add to active floor</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
          
          {/* Top Section: Zones */}
          <div>
             <h3 className="text-[11px] font-bold uppercase text-gray-800 bg-gray-100 py-1.5 px-2 rounded mb-3 tracking-wider flex items-center gap-2 border border-gray-200">
                <Box size={12} className="text-blue-600"/> Room Zones
             </h3>
             <div className="grid grid-cols-2 gap-2">
                {zones.map((item) => {
                    const Icon = item.icon;
                    return (
                    <button 
                        key={item.type}
                        onClick={() => addItem(item.type, 'room')}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group bg-white text-left"
                    >
                         <div className="text-gray-400 group-hover:text-black transition-colors">
                            <Icon size={20} />
                         </div>
                         <span className="text-xs font-bold text-gray-700 group-hover:text-black capitalize">
                            {item.label}
                         </span>
                    </button>
                )})}
             </div>
          </div>

          {/* Other Categories */}
          {categories.map((cat) => {
             const items = groupedItems[cat];
             if (!items || items.length === 0) return null;
             
             return (
                <div key={cat}>
                    <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 px-1 border-b border-gray-100 pb-1">{cat}</h3>
                    <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                        <button 
                            key={item.type}
                            onClick={() => addItem(item.type, 'element')}
                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md transition-all group bg-white aspect-square"
                            title={`Add ${item.label}`}
                        >
                            <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                                <Icon size={20} />
                            </div>
                            <span className="text-[10px] font-medium text-gray-600 text-center capitalize leading-tight group-hover:text-blue-700 overflow-hidden text-ellipsis w-full px-0.5">
                                {item.label}
                            </span>
                        </button>
                    )})}
                    </div>
                </div>
             );
          })}
      </div>
    </div>
  );
};
