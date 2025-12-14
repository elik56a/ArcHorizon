
import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { useUiStore } from '../../../store/useUiStore';
import { LayoutGrid, Box, AlertCircle } from 'lucide-react';
import { PaletteItem } from '../../../types/layer';
import { useTranslation } from '../../../hooks/useTranslation';

interface LibraryPanelProps {
    disciplineStyle: any;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ disciplineStyle }) => {
  const { t } = useTranslation();
  const { startCreation, getActiveLayerConfig, getDiscipline } = useProjectStore();
  const { setActiveRightPanel, setPanelOpen } = useUiStore();
  const config = getActiveLayerConfig();
  const activeDiscipline = getDiscipline();

  // Group items based on PaletteCategory
  const groupedItems: Record<string, PaletteItem[]> = {};
  
  if (config.palette) {
      config.palette.forEach(item => {
          if (!groupedItems[item.category]) {
              groupedItems[item.category] = [];
          }
          groupedItems[item.category].push(item);
      });
  }

  // Ensure "Zones" (Rooms) come first if they exist
  const zones = groupedItems['Zones'] || [];
  const categories = Object.keys(groupedItems).filter(k => k !== 'Zones');

  const isEmpty = zones.length === 0 && categories.length === 0;

  const handleItemClick = (type: any, category: any) => {
      startCreation(type, category);
      setActiveRightPanel('properties');
      setPanelOpen('right', true);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className={`p-5 border-b border-gray-200 ${disciplineStyle.bg}`}>
           <div className={`flex items-center gap-2 text-xs font-bold uppercase mb-2 ${disciplineStyle.text}`}>
              <LayoutGrid size={14} /> {t(`layers.${activeDiscipline}`)}
           </div>
           <h2 className="text-lg font-bold text-gray-900">{t('editor.panels.library')}</h2>
           <p className="text-xs text-gray-500 mt-1">{t('editor.panels.addToLayer', { layer: t(`layers.${activeDiscipline}`) })}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
          
          {isEmpty && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
                  <AlertCircle size={24} className="mb-2"/>
                  <p className="text-sm font-semibold">{t('editor.panels.noItems')}</p>
                  <p className="text-xs">{t('editor.panels.noItemsDesc')}</p>
              </div>
          )}

          {/* Top Section: Zones */}
          {zones.length > 0 && (
              <div>
                 <h3 className={`text-[11px] font-bold uppercase py-1.5 px-2 rounded mb-3 tracking-wider flex items-center gap-2 border ${disciplineStyle.bg} ${disciplineStyle.border} ${disciplineStyle.text}`}>
                    <Box size={12} /> {t('editor.panels.roomZones')}
                 </h3>
                 <div className="grid grid-cols-2 gap-2">
                    {zones.map((item) => {
                        const Icon = item.icon;
                        return (
                        <button 
                            key={item.type}
                            onClick={() => handleItemClick(item.type, 'room')}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group bg-white text-left"
                        >
                             <div className={`text-gray-400 group-hover:${disciplineStyle.text} transition-colors`}>
                                <Icon size={20} />
                             </div>
                             <span className="text-xs font-bold text-gray-700 group-hover:text-black capitalize">
                                {t(`library.items.${item.type}`)}
                             </span>
                        </button>
                    )})}
                 </div>
              </div>
          )}

          {/* Other Categories */}
          {categories.map((cat) => {
             const items = groupedItems[cat];
             if (!items || items.length === 0) return null;
             
             return (
                <div key={cat}>
                    <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 px-1 border-b border-gray-100 pb-1">{t(`library.categories.${cat}`)}</h3>
                    <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                        <button 
                            key={item.type}
                            onClick={() => handleItemClick(item.type, 'element')}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:${disciplineStyle.activeBorder} hover:${disciplineStyle.bg} hover:${disciplineStyle.text} hover:shadow-md transition-all group bg-white aspect-square`}
                            title={`Add ${t(`library.items.${item.type}`)}`}
                        >
                            <div className="text-gray-600 transition-colors">
                                <Icon size={20} />
                            </div>
                            <span className="text-[10px] font-medium text-gray-600 text-center capitalize leading-tight overflow-hidden text-ellipsis w-full px-0.5">
                                {t(`library.items.${item.type}`)}
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
