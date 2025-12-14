
import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { useUiStore } from '../../../store/useUiStore';
import { THEME } from '../../../theme';
import { Settings2, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

interface PropertiesPanelProps {
    disciplineStyle: any;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ disciplineStyle }) => {
    const { t } = useTranslation();
    const { 
        selection, pendingCreation, getCurrentSketch, 
        updateItem, deleteItem, 
        updatePendingCreation, commitCreation, cancelCreation,
        unitSystem 
    } = useProjectStore();
    
    const { setActiveRightPanel } = useUiStore();
    const data = getCurrentSketch();

    // MODE DETECTION
    const isCreating = !!pendingCreation;
    const isEditing = !!selection && !!data;

    // Get the item data source (either pending object or selected object)
    let item: any = null;
    let type: 'room' | 'element' | null = null;

    if (isCreating) {
        item = pendingCreation;
        type = pendingCreation!.category;
    } else if (isEditing) {
        item = selection!.type === 'room' ? data!.rooms.find(r => r.id === selection!.id) : data!.elements.find(e => e.id === selection!.id);
        type = selection!.type;
    }

    if (!item) return null;

    // Handlers
    const handleUpdate = (field: string, value: any) => {
        if (isCreating) {
            updatePendingCreation(field, value);
        } else {
            updateItem(item.id, type!, field, value);
        }
    };

    const handleCancel = () => {
        if (isCreating) {
            cancelCreation();
            setActiveRightPanel('library');
        }
    };

    const handlePrimaryAction = () => {
        if (isCreating) {
            commitCreation();
        } else {
            // Delete is primary action for edit mode footer? 
            // Actually delete is usually red button. 
            // We keep delete as the button for edit mode.
        }
    };

    const isImperial = unitSystem === 'imperial';
    const toDisplay = (val: number) => isImperial ? Number((val * 0.0328084).toFixed(2)) : val;
    const fromInput = (val: number) => isImperial ? Math.round(val / 0.0328084) : val;

    return (
      <div className="h-full flex flex-col bg-white">
        <div className={`p-5 border-b border-gray-200 ${disciplineStyle.bg}`}>
           <div className={`flex items-center gap-2 text-xs font-bold uppercase mb-2 ${disciplineStyle.text}`}>
              {isCreating ? (
                  <button onClick={handleCancel} className="hover:underline flex items-center gap-1">
                      <ArrowLeft size={12} /> {t('editor.panels.library')}
                  </button>
              ) : (
                  <div className="flex items-center gap-2">
                      <Settings2 size={14} /> {t('editor.properties.selected', { type: type })}
                  </div>
              )}
           </div>
           <div className="flex items-baseline justify-between">
               <h2 className="text-lg font-bold text-gray-900 capitalize">
                   {isCreating ? `Add ${t(`library.items.${item.type}`)}` : item.type.replace(/_/g, ' ')}
               </h2>
               {isEditing && (
                   <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">{selection?.id.split('-')[1]}</span>
               )}
               {isCreating && (
                   <span className="text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100">{item.type.replace(/_/g, ' ')}</span>
               )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
           <div>
              <label className={THEME.label}>{t('editor.properties.identity')}</label>
              {type === 'room' && (
                 <input type="text" value={item.name || ''} onChange={(e) => handleUpdate('name', e.target.value)} className={THEME.input} placeholder={t('editor.properties.roomName')} />
              )}
              {type === 'element' && (
                  <div className="text-sm text-gray-500 italic py-1 mb-2">Type: {item.type}</div>
              )}
              <div className="mt-2">
                 <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">{t('editor.properties.label')}</label>
                 <input 
                    type="text" 
                    value={item.label || ''} 
                    onChange={(e) => handleUpdate('label', e.target.value)} 
                    className={THEME.input} 
                    placeholder={t('editor.properties.addLabel')} 
                 />
              </div>
           </div>
           
           <div>
              <label className={THEME.label}>{t('editor.properties.visuals')}</label>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1">
                      <span className="text-[10px] text-gray-500 mb-1 block font-medium">{t('editor.properties.color')}</span>
                      <div className="flex gap-2 items-center">
                          <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-300 shadow-sm">
                            <input 
                                type="color" 
                                value={item.color || '#ffffff'} 
                                onChange={(e) => handleUpdate('color', e.target.value)}
                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0" 
                            />
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{item.color || '#ffffff'}</span>
                      </div>
                  </div>
                  <div className="flex-1">
                       <span className="text-[10px] text-gray-500 mb-1 block font-medium">{t('editor.properties.opacity')}</span>
                       <div className="flex items-center gap-2">
                           <input 
                             type="range" min="0.1" max="1" step="0.1" 
                             value={item.opacity ?? 1} 
                             onChange={(e) => handleUpdate('opacity', Number(e.target.value))}
                             className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                           />
                           <span className="text-[10px] w-6 text-right font-mono text-gray-500">{Math.round((item.opacity ?? 1) * 100)}%</span>
                       </div>
                  </div>
              </div>
           </div>

           <div>
              <label className={THEME.label}>{t('editor.properties.dimensions')} <span className="text-gray-400 font-normal lowercase ml-1">({isImperial ? t('common.feet') : 'cm'})</span></label>
              <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                      <span className="absolute left-2 rtl:left-auto rtl:right-2 top-2.5 text-xs text-gray-400 font-mono">W</span>
                      <input 
                        type="number" 
                        value={toDisplay(item.width)} 
                        onChange={(e) => handleUpdate('width', fromInput(Number(e.target.value)))} 
                        className={`${THEME.input} pl-6 rtl:pl-2 rtl:pr-6`} 
                      />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 rtl:left-auto rtl:right-2 top-2.5 text-xs text-gray-400 font-mono">H</span>
                      <input 
                        type="number" 
                        value={toDisplay(item.height)} 
                        onChange={(e) => handleUpdate('height', fromInput(Number(e.target.value)))} 
                        className={`${THEME.input} pl-6 rtl:pl-2 rtl:pr-6`} 
                      />
                  </div>
                  {isEditing && (
                      <>
                        <div className="relative">
                            <span className="absolute left-2 rtl:left-auto rtl:right-2 top-2.5 text-xs text-gray-400 font-mono">X</span>
                            <input 
                                type="number" 
                                value={toDisplay(item.x)} 
                                onChange={(e) => handleUpdate('x', fromInput(Number(e.target.value)))} 
                                className={`${THEME.input} pl-6 rtl:pl-2 rtl:pr-6`} 
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-2 rtl:left-auto rtl:right-2 top-2.5 text-xs text-gray-400 font-mono">Y</span>
                            <input 
                                type="number" 
                                value={toDisplay(item.y)} 
                                onChange={(e) => handleUpdate('y', fromInput(Number(e.target.value)))} 
                                className={`${THEME.input} pl-6 rtl:pl-2 rtl:pr-6`} 
                            />
                        </div>
                      </>
                  )}
              </div>
              {isCreating && <p className="text-[10px] text-gray-400 mt-2 italic">Position will be set to center of viewport.</p>}
           </div>

           {type === 'element' && (
             <div>
                <label className={THEME.label}>{t('editor.properties.rotation')}</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                   {[0, 90, 180, 270].map(deg => (
                      <button 
                        key={deg} 
                        onClick={() => handleUpdate('rotation', deg)} 
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        (item.rotation || 0) === deg ? `${disciplineStyle.highlight} text-white shadow-sm` : 'text-gray-500 hover:text-gray-900'}`}
                      >
                         {deg}°
                      </button>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50">
           {isCreating ? (
               <button 
                onClick={handlePrimaryAction} 
                className={`${THEME.buttonPrimary} w-full py-3 flex items-center justify-center gap-2 shadow-sm`}
               >
                  <PlusCircle size={16} /> Add Component
               </button>
           ) : (
               <button 
                onClick={() => deleteItem(item.id, type!)} 
                className="w-full py-2.5 bg-white border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-all rounded-md flex items-center justify-center gap-2 shadow-sm"
               >
                  <Trash2 size={16} /> {t('editor.properties.delete', { type: type === 'room' ? 'Room' : 'Object' })}
               </button>
           )}
        </div>
      </div>
    );
};
