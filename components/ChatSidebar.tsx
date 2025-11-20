import React, { useState, useRef, useEffect } from 'react';
import { Message, Attachment, ActionPayload } from '../types';
import { THEME } from '../theme';
import { useProjectStore } from '../store/useProjectStore'; 
import { createArchitectSession } from '../services/geminiService';
import { 
    Send, Loader2, MessageSquare, ClipboardList, ChevronDown, ChevronUp, Ruler, 
    Home, Trees, Sparkles, UploadCloud, FileCode, Image as ImageIcon, X, Bot, 
    User, ArrowRight, Paperclip, PlayCircle
} from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

type InputMode = 'chat' | 'form' | 'upload';

const ChatSidebar: React.FC = () => {
  const { isGenerating, generateByPrompt, generateByFile, unitSystem, setUnitSystem } = useProjectStore();
  
  const [mode, setMode] = useState<InputMode>('chat');
  
  // --- CHAT STATE ---
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to ArcHorizon. I'm your Senior Architect. I'd love to hear about your project. Are we building a family home, a villa, or perhaps something more industrial? Feel free to share photos of styles you like.",
      timestamp: Date.now()
    }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Chat Attachments
  const [chatAttachments, setChatAttachments] = useState<Attachment[]>([]);
  const chatFileRef = useRef<HTMLInputElement>(null);

  // --- UPLOAD & FORM STATE ---
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    buildingType: 'Apartment', area: 120, floors: 1, ceilingHeight: 2.8,
    roofType: 'Modern Flat', bedrooms: 2, bathrooms: 1,
    hasLivingRoom: true, hasKitchen: true, hasDining: true, hasStudy: false,
    hasBalcony: false, hasGarden: false, hasParking: false, hasStorage: false,
    designStyle: 'Modern', customNotes: ''
  });
  const [sections, setSections] = useState({ specs: true, rooms: false, outdoor: false, style: false });

  // --- SCROLL BEHAVIOR ---
  const scrollToBottom = () => {
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  };

  // Initial scroll and auto-scroll on new messages (but not on every stream chunk unless at bottom)
  useEffect(() => {
      scrollToBottom();
  }, [messages.length, isChatting]);

  // Initialize Chat Session on Mount
  useEffect(() => {
      if (!chatSessionRef.current) {
          chatSessionRef.current = createArchitectSession();
      }
  }, []);

  const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newAttachments: Attachment[] = [];
          for (const file of Array.from(e.target.files)) {
              const url = URL.createObjectURL(file);
              newAttachments.push({ type: 'image', url, file });
          }
          setChatAttachments(prev => [...prev, ...newAttachments]);
          if (chatFileRef.current) chatFileRef.current.value = ''; 
      }
  };

  const handleRemoveAttachment = (index: number) => {
      setChatAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!chatInput.trim() && chatAttachments.length === 0) || isChatting || !chatSessionRef.current) return;

    const userMsg: Message = { 
        role: 'user', 
        content: chatInput, 
        timestamp: Date.now(),
        attachments: [...chatAttachments]
    };
    
    // 1. Add User Message
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatAttachments([]);
    setIsChatting(true);

    try {
        // 2. Construct Message Content
        // FIX: Pass array of parts directly, not wrapped in an object
        let messagePayload: string | Array<any> = userMsg.content;

        if (userMsg.attachments && userMsg.attachments.length > 0) {
            const parts: any[] = [];
            
            if (userMsg.content) {
                parts.push({ text: userMsg.content });
            }

            for (const att of userMsg.attachments) {
                if (att.file) {
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(att.file!);
                    });
                    parts.push({ inlineData: { mimeType: att.file.type, data: base64 } });
                }
            }
            messagePayload = parts;
        }

        // 3. Stream Response
        const result = await chatSessionRef.current.sendMessageStream({ message: messagePayload });
        
        // Add placeholder for AI response
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true }]);

        let fullText = '';
        let hasToolCall = false;
        let lastUpdateTime = Date.now();
        
        // 4. Process Stream with Throttling to prevent UI Freeze
        for await (const chunk of result) {
            const c = chunk as GenerateContentResponse;
            
            // Check for Function Calls
            const toolCalls = c.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
                 const call = toolCalls[0];
                 if (call.name === 'propose_design') {
                     hasToolCall = true;
                     const args = call.args as any;
                     
                     // Immediate update for tool call
                     setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastIndex = newMsgs.length - 1;
                        newMsgs[lastIndex] = { 
                            ...newMsgs[lastIndex], 
                            isStreaming: false, 
                            content: newMsgs[lastIndex].content || "I have a proposal ready for you.", 
                            action: { type: 'propose_design', title: args.title, summary: args.summary } 
                        };
                        return newMsgs;
                     });
                     
                     // Respond to tool
                     chatSessionRef.current.sendMessage({
                         message: [{
                            functionResponse: {
                                id: call.id,
                                name: call.name,
                                response: { result: "Proposal displayed to user." }
                            }
                         }]
                     }).catch(console.error);

                     break; 
                 }
            }

            const textChunk = c.text;
            if (textChunk && !hasToolCall) {
                fullText += textChunk;
                
                // THROTTLE: Update state at most every 50ms (20fps)
                const now = Date.now();
                if (now - lastUpdateTime > 50) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastIndex = newMsgs.length - 1;
                        newMsgs[lastIndex] = { ...newMsgs[lastIndex], content: fullText };
                        return newMsgs;
                    });
                    lastUpdateTime = now;
                }
            }
        }
        
        // Final State Update (Ensure we show 100% of text)
        if (!hasToolCall) {
            setMessages(prev => {
                 const newMsgs = [...prev];
                 const lastIndex = newMsgs.length - 1;
                 newMsgs[lastIndex] = { ...newMsgs[lastIndex], content: fullText, isStreaming: false };
                 return newMsgs;
            });
        }

    } catch (err) {
        console.error("Chat Error:", err);
        setMessages(prev => {
             // Remove the empty streaming message if it failed immediately, or append error
             const newMsgs = prev.filter(m => !m.isStreaming);
             return [...newMsgs, { role: 'assistant', content: "I'm having trouble connecting to the design server. Please try again.", timestamp: Date.now() }];
        });
    } finally {
        setIsChatting(false);
    }
  };

  const handleExecuteProposal = (action: ActionPayload) => {
      generateByPrompt(action.summary);
  };

  // --- FORM & UPLOAD HANDLERS (Legacy) ---
  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;
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
    generateByPrompt(prompt);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files)]); };
  const handleUploadSubmit = () => { if (uploadFiles.length === 0 || isGenerating) return; uploadFiles.forEach(file => generateByFile(file)); setUploadFiles([]); };
  const isImperial = unitSystem === 'imperial';

  return (
    <div className="flex flex-col h-full bg-white z-10">
      
      {/* Navigation Tabs */}
      <div className="flex p-2 gap-1 bg-white border-b border-gray-200 shrink-0">
         {[
           { id: 'chat', icon: MessageSquare, label: 'Consult' },
           { id: 'form', icon: ClipboardList, label: 'Specs' },
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

      {/* --- CHAT MODE --- */}
      {mode === 'chat' && (
        <>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-white scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                   {/* Avatar */}
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border border-gray-100 ${msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'}`}>
                      {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                   </div>

                   <div className="flex flex-col gap-2 min-w-[200px]">
                       {/* Message Bubble */}
                       {msg.content && (
                           <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                               msg.role === 'user' 
                               ? 'bg-gray-100 text-gray-900 rounded-tr-none' 
                               : 'bg-blue-50/50 text-gray-800 border border-blue-100 rounded-tl-none'
                           }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-blue-400 animate-pulse align-middle rounded-sm"></span>}
                           </div>
                       )}

                       {/* Attachments Display */}
                       {msg.attachments && msg.attachments.length > 0 && (
                           <div className="flex gap-2 flex-wrap justify-end">
                               {msg.attachments.map((att, i) => (
                                   <div key={i} className="relative group">
                                      <img src={att.url} alt="attachment" className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                      {att.file && (
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] p-0.5 px-1 truncate rounded-b-lg backdrop-blur-sm">
                                              {att.file.name}
                                          </div>
                                      )}
                                   </div>
                               ))}
                           </div>
                       )}

                       {/* ACTION CARD (The "Ready" Button) */}
                       {msg.action && msg.action.type === 'propose_design' && (
                           <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                               <div className="flex items-center gap-2 mb-2">
                                   <Sparkles size={16} className="text-blue-600" />
                                   <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Blueprint Proposal</span>
                               </div>
                               <h3 className="font-bold text-lg leading-tight mb-1">{msg.action.title}</h3>
                               <p className="text-xs text-gray-500 mb-4 line-clamp-3">{msg.action.summary}</p>
                               <button 
                                   onClick={() => handleExecuteProposal(msg.action!)}
                                   disabled={isGenerating}
                                   className="w-full py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                               >
                                   {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <PlayCircle size={16} />}
                                   Generate Blueprint
                               </button>
                           </div>
                       )}
                   </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            {/* Attachments Preview */}
            {chatAttachments.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto py-2 px-1 border-b border-gray-100">
                    {chatAttachments.map((att, i) => (
                        <div key={i} className="relative group flex flex-col items-center w-20 shrink-0">
                            <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-sm">
                                <img src={att.url} className="w-full h-full object-cover" alt="preview" />
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveAttachment(i)}
                                    className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors backdrop-blur-md"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            <span className="text-[10px] text-gray-500 truncate w-full text-center mt-1 px-1" title={att.file?.name}>
                                {att.file?.name || 'image'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
               <input 
                   type="file" 
                   ref={chatFileRef} 
                   className="hidden" 
                   accept="image/*" 
                   multiple 
                   onChange={handleChatFileSelect} 
               />
               <button 
                   type="button" 
                   onClick={() => chatFileRef.current?.click()}
                   className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors mb-0.5"
                   title="Attach image"
               >
                   <Paperclip size={20} />
               </button>
               
               <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Describe your project or upload inspiration..."
                disabled={isChatting}
                className="w-full bg-transparent border-none p-2 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
                rows={1}
                style={{ height: 'auto', minHeight: '44px' }} 
              />
              
              <button 
                type="submit" 
                disabled={(!chatInput.trim() && chatAttachments.length === 0) || isChatting} 
                className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors shadow-sm mb-0.5"
              >
                {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </>
      )}

      {/* --- FORM MODE (Classic) --- */}
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

      {/* --- UPLOAD MODE (Legacy/Separate) --- */}
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