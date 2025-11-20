
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { THEME } from '../theme';
import { useProjectStore } from '../store/useProjectStore'; 
import { Send, Loader2, MessageSquare, ClipboardList, ChevronDown, ChevronUp, Ruler, Home, Trees, Sparkles, UploadCloud, FileCode, Image as ImageIcon, X, Bot, User, ArrowRight } from 'lucide-react';

type InputMode = 'chat' | 'form' | 'upload';

const ChatSidebar: React.FC = () => {
  const { isGenerating, generateByPrompt, generateByFile, unitSystem, setUnitSystem } = useProjectStore();
  
  const [mode, setMode] = useState<InputMode>('chat');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Architect. Describe your dream project or use the specification form to get started.',
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    buildingType: 'Apartment', area: 120, floors: 1, ceilingHeight: 2.8,
    roofType: 'Modern Flat', bedrooms: 2, bathrooms: 1,
    hasLivingRoom: true, hasKitchen: true, hasDining: true, hasStudy: false,
    hasBalcony: false, hasGarden: false, hasParking: false, hasStorage: false,
    designStyle: 'Modern', customNotes: ''
  });

  const [sections, setSections] = useState({ specs: true, rooms: false, outdoor: false, style: false });
  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;
    const userMsg: Message = { role: 'user', content: chatInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    generateByPrompt(chatInput);
    setChatInput('');
    setMessages(prev => [...prev, { role: 'assistant', content: 'Designing...', timestamp: Date.now() + 1 }]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    // Unit Conversion for AI Prompt (AI works in metric/cm)
    const areaMetric = unitSystem === 'imperial' ? Math.round(formData.area / 10.764) : formData.area;
    const heightMetric = unitSystem === 'imperial' ? (formData.ceilingHeight * 0.3048).toFixed(2) : formData.ceilingHeight;
    const unitLabel = unitSystem === 'imperial' ? 'sq ft' : 'm²';

    let prompt = `Generate a ${formData.designStyle} ${formData.buildingType} with ${formData.floors} floor(s). `;
    if (['Villa', 'Duplex', 'Cottage'].includes(formData.buildingType)) prompt += `Roof Style: ${formData.roofType}. `;
    prompt += `Total Area: ${areaMetric} m² (${formData.area} ${unitLabel} requested). Ceiling Height: ${heightMetric}m. `;
    prompt += `\nRequired Spaces: Bedrooms: ${formData.bedrooms}, Bathrooms: ${formData.bathrooms}`;
    if (formData.hasLivingRoom) prompt += `, Open Plan Living Room`;
    if (formData.hasKitchen) prompt += `, Kitchen`;
    if (formData.hasDining) prompt += `, Dining Area`;
    if (formData.hasGarden) prompt += `, Garden (Green Space)`;
    if (formData.hasParking) prompt += `, Private Parking`;
    if (formData.hasBalcony) prompt += `, Balcony/Terrace`;
    if (formData.customNotes) prompt += `\nNotes: ${formData.customNotes}`;

    setMode('chat');
    setMessages(prev => [...prev, { role: 'user', content: `[Specification Submitted]\n${prompt}`, timestamp: Date.now() }, { role: 'assistant', content: 'Analyzing specs and generating blueprint...', timestamp: Date.now() + 1 }]);
    generateByPrompt(prompt);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const handleUploadSubmit = () => {
    if (uploadFiles.length === 0 || isGenerating) return;
    setMode('chat');
    setMessages(prev => [...prev, { role: 'user', content: `Uploaded ${uploadFiles.length} file(s) for analysis.`, timestamp: Date.now() }, { role: 'assistant', content: 'Processing files...', timestamp: Date.now() + 1 }]);
    uploadFiles.forEach(file => generateByFile(file));
    setUploadFiles([]);
  };

  const isImperial = unitSystem === 'imperial';

  return (
    <div className="flex flex-col h-full bg-white z-10">
      
      {/* Navigation Tabs */}
      <div className="flex p-2 gap-1 bg-white border-b border-gray-200">
         {[
           { id: 'chat', icon: MessageSquare, label: 'Chat' },
           { id: 'form', icon: ClipboardList, label: 'Spec Sheet' },
           { id: 'upload', icon: UploadCloud, label: 'Import' }
         ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setMode(tab.id as InputMode)} 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                  mode === tab.id 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
               <tab.icon size={14} /> {tab.label}
            </button>
         ))}
      </div>

      {/* CHAT MODE */}
      {mode === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-black text-white'}`}>
                      {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                   </div>
                   <div className={`p-3 rounded-xl text-sm shadow-sm leading-relaxed ${
                       msg.role === 'user' 
                       ? 'bg-white text-gray-800 border border-gray-200 rounded-tr-none' 
                       : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                   }`}>
                      {msg.content}
                   </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-gray-200">
            <div className="relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(e); } }}
                placeholder="Describe your building ideas..."
                disabled={isGenerating}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none h-24"
              />
              <button type="submit" disabled={!chatInput.trim() || isGenerating} className="absolute right-3 bottom-3 p-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </>
      )}

      {/* FORM MODE */}
      {mode === 'form' && (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
           <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
             <form id="spec-form" onSubmit={handleFormSubmit} className="space-y-3">
                
                {/* Unit Selector */}
                <div className="flex gap-2 mb-4">
                     <button type="button" onClick={() => setUnitSystem('metric')} className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded border ${unitSystem === 'metric' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>Metric (m²)</button>
                     <button type="button" onClick={() => setUnitSystem('imperial')} className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded border ${unitSystem === 'imperial' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>Imperial (ft²)</button>
                </div>

                {/* Form content */}
                <div className={THEME.card}>
                   <div onClick={() => toggleSection('specs')} className={THEME.sectionHeader}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><Ruler size={14}/> Project Specs</div>
                      {sections.specs ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                   </div>
                   {sections.specs && (
                     <div className="p-3 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                               <label className={THEME.label}>Building Type</label>
                               <select className={THEME.select} value={formData.buildingType} onChange={e => setFormData({...formData, buildingType: e.target.value})}>
                                  {['Apartment', 'Villa', 'Duplex', 'Cottage', 'Office'].map(o => <option key={o}>{o}</option>)}
                               </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className={THEME.label}>{isImperial ? 'Area (sq ft)' : 'Area (m²)'}</label>
                                   <input type="number" className={THEME.input} value={formData.area} onChange={e => setFormData({...formData, area: Number(e.target.value)})}/>
                                </div>
                                <div>
                                   <label className={THEME.label}>Floors</label>
                                   <input type="number" min="1" max="5" className={THEME.input} value={formData.floors} onChange={e => setFormData({...formData, floors: Number(e.target.value)})}/>
                                </div>
                            </div>
                            <div>
                                <label className={THEME.label}>{isImperial ? 'Ceiling Height (ft)' : 'Ceiling Height (m)'}</label>
                                <input type="number" step="0.1" className={THEME.input} value={formData.ceilingHeight} onChange={e => setFormData({...formData, ceilingHeight: Number(e.target.value)})}/>
                            </div>
                        </div>
                     </div>
                   )}
                </div>

                <div className={THEME.card}>
                   <div onClick={() => toggleSection('rooms')} className={THEME.sectionHeader}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><Home size={14}/> Interior Program</div>
                      {sections.rooms ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                   </div>
                   {sections.rooms && (
                     <div className="p-3 space-y-4">
                        <div className="flex gap-4">
                           <div className="flex-1">
                              <label className={THEME.label}>Bedrooms</label>
                              <input type="number" className={THEME.input} value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: Number(e.target.value)})} />
                           </div>
                           <div className="flex-1">
                              <label className={THEME.label}>Bathrooms</label>
                              <input type="number" className={THEME.input} value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})} />
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           {['hasLivingRoom', 'hasKitchen', 'hasDining', 'hasStudy'].map((key) => (
                             <div 
                                key={key} 
                                onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key as keyof typeof formData] }))}
                                className={`flex items-center gap-2 p-2 border rounded-md text-xs font-medium cursor-pointer transition-all select-none ${formData[key as keyof typeof formData] ? 'border-black bg-gray-50 text-black' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                             >
                                <div className={`w-3 h-3 rounded-sm border ${formData[key as keyof typeof formData] ? 'bg-black border-black' : 'bg-white border-gray-300'}`}></div>
                                {key.replace('has', '')}
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className={THEME.card}>
                   <div onClick={() => toggleSection('outdoor')} className={THEME.sectionHeader}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><Trees size={14}/> Exterior Features</div>
                      {sections.outdoor ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                   </div>
                   {sections.outdoor && (
                     <div className="p-3">
                        <div className="grid grid-cols-2 gap-2">
                           {['hasBalcony', 'hasGarden', 'hasParking'].map((key) => (
                             <div 
                                key={key} 
                                onClick={() => setFormData(prev => ({ ...prev, [key]: !prev[key as keyof typeof formData] }))}
                                className={`flex items-center gap-2 p-2 border rounded-md text-xs font-medium cursor-pointer transition-all select-none ${formData[key as keyof typeof formData] ? 'border-black bg-gray-50 text-black' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                             >
                                <div className={`w-3 h-3 rounded-sm border ${formData[key as keyof typeof formData] ? 'bg-black border-black' : 'bg-white border-gray-300'}`}></div>
                                {key.replace('has', '')}
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className={THEME.card}>
                   <div onClick={() => toggleSection('style')} className={THEME.sectionHeader}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600"><Sparkles size={14}/> Design Aesthetic</div>
                      {sections.style ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                   </div>
                   {sections.style && (
                     <div className="p-3 space-y-3">
                        <div>
                           <label className={THEME.label}>Style Preference</label>
                           <div className="flex gap-2">
                              {['Modern', 'Rustic', 'Creative'].map(s => (
                                 <button key={s} type="button" onClick={() => setFormData({...formData, designStyle: s as any})} className={`flex-1 py-2 text-xs font-semibold rounded-md border transition-all ${formData.designStyle === s ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    {s}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div>
                           <label className={THEME.label}>Additional Notes</label>
                           <textarea className={THEME.input} rows={3} value={formData.customNotes} onChange={e => setFormData({...formData, customNotes: e.target.value})} placeholder="e.g., large south-facing windows..."/>
                        </div>
                     </div>
                   )}
                </div>
             </form>
           </div>
           <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              <button type="submit" form="spec-form" disabled={isGenerating} className={`${THEME.buttonPrimary} w-full py-3 flex items-center justify-center gap-2 text-sm relative`}>
                 {isGenerating ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                 Generate Blueprint
              </button>
           </div>
        </div>
      )}

      {/* UPLOAD MODE */}
      {mode === 'upload' && (
         <div className="flex-1 p-6 bg-white flex flex-col gap-4">
            <div 
               className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-64 ${isDragging ? 'border-black bg-blue-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`} 
               onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}} 
               onDragLeave={() => setIsDragging(false)} 
               onDrop={(e) => {e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files) setUploadFiles(p => [...p, ...Array.from(e.dataTransfer.files)])}} 
               onClick={() => fileInputRef.current?.click()}
            >
               <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,application/pdf,.dxf" />
               <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600">
                  <UploadCloud size={24} />
               </div>
               <p className="text-sm font-bold text-gray-900">Click or drag files to upload</p>
               <p className="text-xs text-gray-500 mt-1">Supports DXF, PDF, JPG, PNG</p>
            </div>
            
            {uploadFiles.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-2 border-t border-gray-100 pt-4">
                   <label className={THEME.label}>Ready to Process</label>
                   {uploadFiles.map((file, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200 text-blue-600">
                            {file.name.endsWith('.dxf') ? <FileCode size={16}/> : <ImageIcon size={16}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold truncate text-gray-800">{file.name}</p>
                             <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button onClick={() => setUploadFiles(p => p.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                      </div>
                   ))}
                </div>
            )}
            
            <div className="mt-auto">
                <button onClick={handleUploadSubmit} disabled={uploadFiles.length === 0 || isGenerating} className={THEME.buttonPrimary + " w-full py-3"}>
                     Convert to Blueprint
                </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default ChatSidebar;
