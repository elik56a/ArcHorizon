
import React, { useState } from 'react';
import { THEME } from '../../../../theme';
import { useProjectStore } from '../../../../store/useProjectStore';
import { useTranslation } from '../../../../hooks/useTranslation';
import { Droplets, Send, Loader2, Thermometer, Box, ArrowDownCircle } from 'lucide-react';

export const PlumbingSpecsForm: React.FC = () => {
    const { t } = useTranslation();
    const { isGenerating, generateByPrompt } = useProjectStore();
    
    // Plumbing Specific State
    const [supplyMaterial, setSupplyMaterial] = useState('PEX');
    const [wasteMaterial, setWasteMaterial] = useState('PVC');
    const [waterSource, setWaterSource] = useState('Municipal');
    const [hotWaterSystem, setHotWaterSystem] = useState('Tankless (Electric)');
    const [systemPressure, setSystemPressure] = useState('Standard (40-60 psi)');
    
    // Toggles
    const [includeRecirculation, setIncludeRecirculation] = useState(false);
    const [includeGreywater, setIncludeGreywater] = useState(false);
    const [customNotes, setCustomNotes] = useState('');

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        
        let prompt = `Generate a plumbing layout. `;
        prompt += `Supply Material: ${supplyMaterial}. `;
        prompt += `Waste Material: ${wasteMaterial}. `;
        prompt += `Source: ${waterSource}. `;
        prompt += `Hot Water: ${hotWaterSystem}. `;
        prompt += `Pressure: ${systemPressure}. `;
        
        if (includeRecirculation) prompt += `Include Hot Water Recirculation Loop. `;
        if (includeGreywater) prompt += `Include Greywater system for garden reuse. `;
        if (customNotes) prompt += `\nNotes: ${customNotes}`;

        generateByPrompt(prompt);
    };

    return (
        <div className="flex flex-col h-full bg-cyan-50/30">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* SYSTEM CONFIG CARD */}
                <div className={THEME.card}>
                    <div className="bg-cyan-50 border-b border-cyan-100 p-3 -mx-4 -mt-4 rounded-t-lg mb-4 flex items-center gap-2">
                        <Droplets size={16} className="text-cyan-600"/>
                        <span className="text-xs font-bold text-cyan-800 uppercase tracking-wide">{t('specs.plumbing.config')}</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className={THEME.label}>{t('specs.plumbing.supplyMat')}</label>
                            <select className={THEME.select} value={supplyMaterial} onChange={e => setSupplyMaterial(e.target.value)}>
                                <option>PEX (Cross-linked Polyethylene)</option>
                                <option>Copper (Type L)</option>
                                <option>CPVC</option>
                            </select>
                        </div>
                        <div>
                            <label className={THEME.label}>{t('specs.plumbing.wasteMat')}</label>
                            <select className={THEME.select} value={wasteMaterial} onChange={e => setWasteMaterial(e.target.value)}>
                                <option>PVC (Sch 40)</option>
                                <option>ABS</option>
                                <option>Cast Iron (No-Hub)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={THEME.label}>{t('specs.plumbing.source')}</label>
                                <select className={THEME.select} value={waterSource} onChange={e => setWaterSource(e.target.value)}>
                                    <option>Municipal</option>
                                    <option>Private Well</option>
                                </select>
                            </div>
                            <div>
                                <label className={THEME.label}>{t('specs.plumbing.pressure')}</label>
                                <select className={THEME.select} value={systemPressure} onChange={e => setSystemPressure(e.target.value)}>
                                    <option>Standard</option>
                                    <option>High (Booster)</option>
                                    <option>Low (Gravity)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HOT WATER CARD */}
                <div className={THEME.card}>
                    <div className="bg-orange-50 border-b border-orange-100 p-3 -mx-4 -mt-4 rounded-t-lg mb-4 flex items-center gap-2">
                        <Thermometer size={16} className="text-orange-600"/>
                        <span className="text-xs font-bold text-orange-800 uppercase tracking-wide">{t('specs.plumbing.hotWater')}</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className={THEME.label}>{t('specs.plumbing.heating')}</label>
                            <select className={THEME.select} value={hotWaterSystem} onChange={e => setHotWaterSystem(e.target.value)}>
                                <option>Tankless (Electric)</option>
                                <option>Tankless (Gas)</option>
                                <option>Storage Tank (Electric)</option>
                                <option>Storage Tank (Gas)</option>
                                <option>Solar Thermal Hybrid</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-2 border border-gray-200 rounded-md bg-white cursor-pointer hover:border-cyan-400 transition-colors">
                                <input type="checkbox" checked={includeRecirculation} onChange={e => setIncludeRecirculation(e.target.checked)} className="accent-cyan-600 w-4 h-4" />
                                <span className="text-xs font-medium text-gray-700">{t('specs.plumbing.recirc')}</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 border border-gray-200 rounded-md bg-white cursor-pointer hover:border-green-400 transition-colors">
                                <input type="checkbox" checked={includeGreywater} onChange={e => setIncludeGreywater(e.target.checked)} className="accent-green-600 w-4 h-4" />
                                <span className="text-xs font-medium text-gray-700">{t('specs.plumbing.greywater')}</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* NOTES */}
                <div className={THEME.card}>
                     <div className="mb-2">
                        <label className={THEME.label}>{t('specs.plumbing.notes')}</label>
                        <textarea 
                            className={THEME.input} 
                            rows={4} 
                            value={customNotes} 
                            onChange={e => setCustomNotes(e.target.value)} 
                            placeholder="e.g., Add floor drain in utility room, ensure main stack is centrally located..."
                        />
                     </div>
                </div>

            </div>

            <div className="p-4 border-t border-cyan-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-cyan-700 text-white border border-cyan-800 font-semibold text-sm rounded-md hover:bg-cyan-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50">
                 {isGenerating ? <Loader2 className="animate-spin" /> : <Send size={16} className="rtl:rotate-180"/>}
                 {t('specs.plumbing.generate')}
              </button>
           </div>
        </div>
    );
};
