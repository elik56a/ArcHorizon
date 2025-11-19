
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Loader2, Bot, User, MessageSquare, ClipboardList, Plus, ChevronDown, ChevronUp, Ruler, Home, Trees, Sparkles, UploadCloud, FileText, X, Image as ImageIcon } from 'lucide-react';

interface InputPanelProps {
  onGenerate: (prompt: string) => void;
  onGenerateFromImage: (file: File) => void;
  isGenerating: boolean;
}

type InputMode = 'chat' | 'form' | 'upload';

const InputPanel: React.FC<InputPanelProps> = ({ onGenerate, onGenerateFromImage, isGenerating }) => {
  const [mode, setMode] = useState<InputMode>('chat');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m ArcHorizon. Describe your project to generate professional layouts. (e.g., "A 2-story duplex with 3 bedrooms and a garden").',
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State - Structured for Pedantic Users
  const [formData, setFormData] = useState({
    // Core Specs
    unit: 'Metric (m²)' as 'Metric (m²)' | 'Imperial (sq ft)',
    buildingType: 'Apartment',
    area: 120,
    floors: 1,
    ceilingHeight: 2.8,
    
    // Spaces
    bedrooms: 2,
    bathrooms: 1,
    hasLivingRoom: true,
    hasKitchen: true,
    hasDining: true,
    hasStudy: false,
    
    // Outdoor & Amenities
    hasBalcony: false,
    hasGarden: false,
    hasParking: false,
    hasStorage: false,
    
    // Style
    designStyle: 'Modern' as 'Modern' | 'Rustic' | 'Creative',
    customNotes: ''
  });

  // Accordion State
  const [sections, setSections] = useState({
    specs: true,
    rooms: false,
    outdoor: false,
    style: false
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;

    const userMsg: Message = { role: 'user', content: chatInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    onGenerate(chatInput);
    setChatInput('');
    setMessages(prev => [...prev, { role: 'assistant', content: 'Analyzing requirements and generating options...', timestamp: Date.now() + 1 }]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    // Construct high-fidelity prompt
    let prompt = `Generate a ${formData.designStyle} ${formData.buildingType} with ${formData.floors} floor(s). `;
    prompt += `Total Area: ${formData.area} ${formData.unit}. `;
    prompt += `Ceiling Height: ${formData.ceilingHeight}m. `;
    
    prompt += `\n\nRequired Spaces:\n`;
    prompt += `- Bedrooms: ${formData.bedrooms}\n`;
    prompt += `- Bathrooms: ${formData.bathrooms}\n`;
    if (formData.hasLivingRoom) prompt += `- Living Room\n`;
    if (formData.hasKitchen) prompt += `- Kitchen\n`;
    if (formData.hasDining) prompt += `- Dining Area\n`;
    if (formData.hasStudy) prompt += `- Study / Home Office\n`;
    
    prompt += `\nOutdoor & Amenities:\n`;
    if (formData.hasBalcony) prompt += `- Balcony\n`;
    if (formData.hasGarden) prompt += `- Garden\n`;
    if (formData.hasParking) prompt += `- Parking Space\n`;
    if (formData.hasStorage) prompt += `- Storage Room\n`;
    
    if (formData.customNotes) {
      prompt += `\nAdditional Notes: ${formData.customNotes}`;
    }

    setMode('chat');
    const userMsg: Message = { role: 'user', content: `[Detailed Config] ${prompt}`, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: 'Processing detailed configuration...', timestamp: Date.now() + 1 }]);
    
    onGenerate(prompt);
  };

  // --- Upload Handlers ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = () => {
    if (uploadFiles.length === 0 || isGenerating) return;

    // We switch to chat to show status
    setMode('chat');
    const userMsg: Message = { role: 'user', content: `Uploaded ${uploadFiles.length} file(s) for conversion.`, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: 'Scanning documents and converting to editable blueprints...', timestamp: Date.now() + 1 }]);

    // Process each file
    uploadFiles.forEach(file => {
      onGenerateFromImage(file);
    });
    setUploadFiles([]);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-[400px] shadow-2xl z-10 font-sans">
      {/* Brand Header */}
      <div className="bg-slate-900 text-white p-5">
         <h2 className="font-bold text-xl tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
               <Bot className="w-5 h-5 text-white" />
            </div>
            ArcHorizon
         </h2>
         <p className="text-slate-400 text-xs mt-1 ml-10">Professional Layout Generator</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-50 border-b border-gray-200 p-1">
         <button 
            onClick={() => setMode('chat')}
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'chat' ? 'bg-white text-slate-900 shadow-sm border border-gray-200' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <MessageSquare size={14} /> Chat
         </button>
         <button 
            onClick={() => setMode('form')}
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'form' ? 'bg-white text-slate-900 shadow-sm border border-gray-200' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <ClipboardList size={14} /> Spec
         </button>
         <button 
            onClick={() => setMode('upload')}
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'upload' ? 'bg-white text-slate-900 shadow-sm border border-gray-200' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <UploadCloud size={14} /> Files
         </button>
      </div>

      {/* Mode Content */}
      {mode === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-gray-200">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.role === 'assistant' ? 'bg-white border-gray-200 text-blue-600' : 'bg-slate-800 border-slate-700 text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-gray-200">
            <div className="relative group">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleChatSubmit(e);
                   }
                }}
                placeholder="Describe your architectural vision..."
                disabled={isGenerating}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-[52px] group-focus-within:h-24 overflow-hidden"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isGenerating}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </form>
        </>
      )}

      {mode === 'form' && (
        <div className="flex-1 overflow-y-auto bg-slate-50">
           <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
              
              {/* Section 1: Specs */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                 <button type="button" onClick={() => toggleSection('specs')} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Ruler size={16} className="text-blue-500"/> Project Specs</div>
                    {sections.specs ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                 </button>
                 {sections.specs && (
                   <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                             <label className="text-xs font-medium text-gray-500 mb-1 block">Project Type</label>
                             <select className="w-full text-sm p-2 border rounded-md" value={formData.buildingType} onChange={e => setFormData({...formData, buildingType: e.target.value})}>
                                <option>Apartment</option>
                                <option>Villa</option>
                                <option>Office</option>
                                <option>Duplex</option>
                                <option>Penthouse</option>
                             </select>
                          </div>
                          <div>
                             <label className="text-xs font-medium text-gray-500 mb-1 block">Unit System</label>
                             <select className="w-full text-sm p-2 border rounded-md" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as any})}>
                                <option>Metric (m²)</option>
                                <option>Imperial (sq ft)</option>
                             </select>
                          </div>
                          <div>
                             <label className="text-xs font-medium text-gray-500 mb-1 block">Total Area</label>
                             <input type="number" className="w-full text-sm p-2 border rounded-md" value={formData.area} onChange={e => setFormData({...formData, area: Number(e.target.value)})}/>
                          </div>
                          <div>
                             <label className="text-xs font-medium text-gray-500 mb-1 block">Floors</label>
                             <div className="flex items-center border rounded-md overflow-hidden">
                                <button type="button" className="px-3 py-2 hover:bg-gray-100 border-r" onClick={() => setFormData(p => ({...p, floors: Math.max(1, p.floors - 1)}))}>-</button>
                                <div className="flex-1 text-center text-sm font-medium">{formData.floors}</div>
                                <button type="button" className="px-3 py-2 hover:bg-gray-100 border-l" onClick={() => setFormData(p => ({...p, floors: Math.min(5, p.floors + 1)}))}>+</button>
                             </div>
                          </div>
                          <div>
                             <label className="text-xs font-medium text-gray-500 mb-1 block">Ceiling (m)</label>
                             <input type="number" step="0.1" className="w-full text-sm p-2 border rounded-md" value={formData.ceilingHeight} onChange={e => setFormData({...formData, ceilingHeight: Number(e.target.value)})}/>
                          </div>
                      </div>
                   </div>
                 )}
              </div>

              {/* Section 2: Rooms */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                 <button type="button" onClick={() => toggleSection('rooms')} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Home size={16} className="text-blue-500"/> Spaces & Rooms</div>
                    {sections.rooms ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                 </button>
                 {sections.rooms && (
                   <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center">
                         <label className="text-sm text-gray-600">Bedrooms</label>
                         <input type="number" className="w-16 text-sm p-1 border rounded text-center" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: Number(e.target.value)})} />
                      </div>
                      <div className="flex justify-between items-center">
                         <label className="text-sm text-gray-600">Bathrooms</label>
                         <input type="number" className="w-16 text-sm p-1 border rounded text-center" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                         {['hasLivingRoom', 'hasKitchen', 'hasDining', 'hasStudy'].map((key) => (
                           <label key={key} className={`flex items-center gap-2 p-2 rounded border text-xs font-medium cursor-pointer transition-all ${formData[key as keyof typeof formData] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                              <input type="checkbox" className="hidden" checked={formData[key as keyof typeof formData] as boolean} onChange={e => setFormData({...formData, [key]: e.target.checked})} />
                              {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                           </label>
                         ))}
                      </div>
                   </div>
                 )}
              </div>

              {/* Section 3: Outdoor */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                 <button type="button" onClick={() => toggleSection('outdoor')} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Trees size={16} className="text-blue-500"/> Outdoor & Amenities</div>
                    {sections.outdoor ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                 </button>
                 {sections.outdoor && (
                   <div className="p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-2">
                         {['hasBalcony', 'hasGarden', 'hasParking', 'hasStorage'].map((key) => (
                           <label key={key} className={`flex items-center gap-2 p-2 rounded border text-xs font-medium cursor-pointer transition-all ${formData[key as keyof typeof formData] ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                              <input type="checkbox" className="hidden" checked={formData[key as keyof typeof formData] as boolean} onChange={e => setFormData({...formData, [key]: e.target.checked})} />
                              {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                           </label>
                         ))}
                      </div>
                   </div>
                 )}
              </div>

              {/* Section 4: Style */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                 <button type="button" onClick={() => toggleSection('style')} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Sparkles size={16} className="text-blue-500"/> Style & Notes</div>
                    {sections.style ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                 </button>
                 {sections.style && (
                   <div className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div>
                         <label className="text-xs font-medium text-gray-500 mb-1 block">Design Aesthetic</label>
                         <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['Modern', 'Rustic', 'Creative'].map(s => (
                               <button key={s} type="button" onClick={() => setFormData({...formData, designStyle: s as any})} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${formData.designStyle === s ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>
                                  {s}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div>
                         <label className="text-xs font-medium text-gray-500 mb-1 block">Custom Requirements</label>
                         <textarea 
                            className="w-full text-sm p-2 border rounded-md h-20 resize-none focus:ring-1 focus:ring-blue-500 outline-none" 
                            placeholder="E.g. I want a kitchen island and a walk-in closet..."
                            value={formData.customNotes}
                            onChange={e => setFormData({...formData, customNotes: e.target.value})}
                         />
                      </div>
                   </div>
                 )}
              </div>

              <button 
                 type="submit"
                 disabled={isGenerating}
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                 {isGenerating ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                 Generate Blueprint
              </button>
           </form>
        </div>
      )}

      {/* UPLOAD MODE */}
      {mode === 'upload' && (
         <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-4">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileSelect} 
                 className="hidden" 
                 multiple 
                 accept="image/*,application/pdf" 
               />
               <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                 <UploadCloud className="text-blue-500 w-6 h-6" />
               </div>
               <p className="text-sm font-bold text-gray-700">Click or Drag files here</p>
               <p className="text-xs text-gray-400 mt-1">Supports PDF, JPG, PNG</p>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto space-y-2">
               {uploadFiles.length === 0 && (
                  <div className="text-center text-xs text-gray-400 mt-10 italic">
                     No files selected. Upload a sketch or floor plan to digitize it.
                  </div>
               )}
               {uploadFiles.map((file, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                         {file.type.includes('pdf') ? <FileText size={20} className="text-red-500"/> : <ImageIcon size={20} className="text-purple-500"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium truncate">{file.name}</p>
                         <p className="text-[10px] text-gray-400 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500">
                         <X size={16} />
                      </button>
                  </div>
               ))}
            </div>

            <button 
                 onClick={handleUploadSubmit}
                 disabled={uploadFiles.length === 0 || isGenerating}
                 className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                 {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                 Digitize & Convert
            </button>
         </div>
      )}
    </div>
  );
};

export default InputPanel;
