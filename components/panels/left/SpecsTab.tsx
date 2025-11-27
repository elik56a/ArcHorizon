
import React, { useState, useRef } from 'react';
import { getGroupedLibraryItems, LibraryItem } from '../../../config/libraryConfig';
import { THEME } from '../../../theme';
import { useProjectStore } from '../../../store/useProjectStore';
import { Ruler, Sparkles, ChevronUp, ChevronDown, Send, Loader2, Plus, Minus, Image as ImageIcon, X } from 'lucide-react';

export const SpecsTab: React.FC = () => {
    const { isGenerating, generateByPrompt, unitSystem, setUnitSystem } = useProjectStore();
    
    // Base Settings
    const [buildingType, setBuildingType] = useState('Apartment');
    const [area, setArea] = useState(120);
    const [floors, setFloors] = useState(1);
    const [designStyle, setDesignStyle] = useState('Modern');
    const [customNotes, setCustomNotes] = useState('');
    
    // File Upload State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Dynamic Item Quantities
    // Store counts for every possible item in the library (keyed by item type)
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({
        'living': 1, 'kitchen': 1, 'bathroom': 1, 'bedroom': 2 // Defaults
    });

    // Accordion State
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'General': true,
        'Zones': true,
        'Openings': false,
        'Furniture': false,
        'Wet Areas': false,
        'Attachments': true
    });

    const isImperial = unitSystem === 'imperial';
    const libraryGroups = getGroupedLibraryItems();
    const categories = Object.keys(libraryGroups);

    const toggleSection = (sec: string) => setOpenSections(p => ({ ...p, [sec]: !p[sec] }));

    const updateQuantity = (type: string, delta: number) => {
        setItemQuantities(prev => {
            const current = prev[type] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [type]: _, ...rest } = prev; // Remove key if 0
                return rest;
            }
            return { ...prev, [type]: next };
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Build the Prompt
        let prompt = `Create a ${designStyle} ${buildingType} with ${floors} floors. `;
        prompt += `Total Area: ${area} ${isImperial ? 'sq ft' : 'm²'}. `;
        
        // Add Quantities from Dynamic List
        const requestedItems = Object.entries(itemQuantities).map(([type, count]) => {
            // Find label
            let label = type;
            for (const cat of categories) {
                const found = libraryGroups[cat].find(i => i.type === type);
                if (found) { label = found.label; break; }
            }
            return `${count} ${label}`;
        });

        if (requestedItems.length > 0) {
            prompt += `\nInclude the following: ${requestedItems.join(', ')}. `;
        }

        if (customNotes) {
            prompt += `\nNotes: ${customNotes}`;
        }

        // Process Images
        const images = await Promise.all(selectedFiles.map(async (file) => {
            return new Promise<{mimeType: string, data: string}>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                     const base64 = (reader.result as string).split(',')[1];
                     resolve({ mimeType: file.type, data: base64 });
                };
                reader.readAsDataURL(file);
            });
        }));

        generateByPrompt(prompt, images);
    };

    const renderCategory = (category: string, items: LibraryItem[]) => {
        const isOpen = openSections[category];
        const countSelected = items.reduce((acc, item) => acc + (itemQuantities[item.type] ? 1 : 0), 0);

        return (
            <div key={category} className={THEME.card + " mb-2 overflow-hidden"}>
                <div onClick={() => toggleSection(category)} className={`${THEME.sectionHeader} !bg-white !border-b-0 ${isOpen ? '!pb-2' : ''}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-700">{category}</span>
                        {countSelected > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{countSelected} active</span>}
                    </div>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                
                {isOpen && (
                    <div className="p-3 pt-0 grid grid-cols-1 gap-2 border-t border-gray-100 mt-2 pt-2">
                        {items.map((item) => {
                            const qty = itemQuantities[item.type] || 0;
                            const Icon = item.icon;
                            return (
                                <div key={item.type} className={`flex items-center justify-between p-2 rounded-md border transition-colors ${qty > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${qty > 0 ? 'bg-white text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className={`text-xs font-medium ${qty > 0 ? 'text-blue-900 font-bold' : 'text-gray-600'}`}>{item.label}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 bg-white rounded border border-gray-200 p-0.5">
                                        <button type="button" onClick={() => updateQuantity(item.type, -1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Minus size={12}/></button>
                                        <span className="w-6 text-center text-xs font-mono font-bold">{qty}</span>
                                        <button type="button" onClick={() => updateQuantity(item.type, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"><Plus size={12}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* General Settings */}
                <div className={THEME.card}>
                    <div onClick={() => toggleSection('General')} className={THEME.sectionHeader}>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><Ruler size={14}/> Project Specs</div>
                        {openSections['General'] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </div>
                    {openSections['General'] && (
                        <div className="p-3 space-y-4">
                             <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => setUnitSystem('metric')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded border ${!isImperial ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>Metric</button>
                                <button type="button" onClick={() => setUnitSystem('imperial')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded border ${isImperial ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>Imperial</button>
                             </div>
                             <div className="grid grid-cols-1 gap-3">
                                <div>
                                   <label className={THEME.label}>Type</label>
                                   <select className={THEME.select} value={buildingType} onChange={e => setBuildingType(e.target.value)}>
                                      {['Apartment', 'Villa', 'Duplex', 'Office', 'Restaurant'].map(o => <option key={o}>{o}</option>)}
                                   </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                       <label className={THEME.label}>Area {isImperial ? '(ft²)' : '(m²)'}</label>
                                       <input type="number" className={THEME.input} value={area} onChange={e => setArea(Number(e.target.value))}/>
                                    </div>
                                    <div>
                                       <label className={THEME.label}>Floors</label>
                                       <input type="number" min="1" max="5" className={THEME.input} value={floors} onChange={e => setFloors(Number(e.target.value))}/>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Categories */}
                {categories.map(cat => renderCategory(cat, libraryGroups[cat]))}

                {/* Style & Notes */}
                <div className={THEME.card}>
                     <div onClick={() => toggleSection('Style')} className={THEME.sectionHeader}>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><Sparkles size={14}/> Style & Notes</div>
                        {openSections['Style'] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                     </div>
                     {openSections['Style'] && (
                         <div className="p-3 space-y-3">
                             <div>
                               <label className={THEME.label}>Aesthetic</label>
                               <div className="flex gap-2">
                                  {['Modern', 'Rustic', 'Creative'].map(s => (
                                     <button key={s} type="button" onClick={() => setDesignStyle(s)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md border transition-all ${designStyle === s ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500'}`}>
                                        {s}
                                     </button>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <label className={THEME.label}>Custom Instructions</label>
                               <textarea className={THEME.input} rows={3} value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder="e.g., large south-facing windows..."/>
                            </div>
                         </div>
                     )}
                </div>

                {/* Reference Images Upload */}
                <div className={THEME.card}>
                    <div onClick={() => toggleSection('Attachments')} className={THEME.sectionHeader}>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><ImageIcon size={14}/> Reference Images</div>
                        {openSections['Attachments'] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </div>
                    {openSections['Attachments'] && (
                        <div className="p-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple 
                                accept="image/*" 
                                onChange={handleFileSelect} 
                            />
                            
                            {selectedFiles.length === 0 ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                    <ImageIcon className="text-gray-300 mb-2" size={24} />
                                    <p className="text-xs font-bold text-gray-600">Upload Reference Photos</p>
                                    <p className="text-[10px] text-gray-400">JPG, PNG (Max 5MB)</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="relative group w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                                                <img 
                                                    src={URL.createObjectURL(file)} 
                                                    alt="preview" 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded-full hover:bg-red-500 transition-colors"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-16 h-16 rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
                                        >
                                            <Plus size={16} className="text-gray-400" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic text-right">{selectedFiles.length} file(s) selected</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              <button onClick={handleGenerate} disabled={isGenerating} className={`${THEME.buttonPrimary} w-full py-3 flex items-center justify-center gap-2 text-sm relative`}>
                 {isGenerating ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                 Generate Blueprint
              </button>
           </div>
        </div>
    );
};
