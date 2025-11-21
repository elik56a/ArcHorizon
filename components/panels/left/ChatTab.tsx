import React, { useEffect, useRef } from 'react';
import { Bot, User, Loader2, Paperclip, ArrowRight, Sparkles, PlayCircle, X } from 'lucide-react';
import { Message, Attachment } from '../../../types';
import { Chat } from '@google/genai';
import { createArchitectSession } from '../../../services/geminiService';
import { useProjectStore } from '../../../store/useProjectStore';

interface ChatTabProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    chatInput: string;
    setChatInput: React.Dispatch<React.SetStateAction<string>>;
    isChatting: boolean;
    setIsChatting: React.Dispatch<React.SetStateAction<boolean>>;
    chatAttachments: Attachment[];
    setChatAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
    chatSessionRef: React.MutableRefObject<Chat | null>;
}

export const ChatTab: React.FC<ChatTabProps> = ({
    messages, setMessages, chatInput, setChatInput, isChatting, setIsChatting, 
    chatAttachments, setChatAttachments, chatSessionRef
}) => {
    const { generateByPrompt, isGenerating } = useProjectStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatFileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- SCROLL BEHAVIOR ---
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages.length, isChatting]);

    useEffect(() => {
        if (!chatSessionRef.current) {
            chatSessionRef.current = createArchitectSession();
        }
    }, []);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
            textarea.style.overflowY = textarea.scrollHeight > 128 ? 'auto' : 'hidden';
        }
    }, [chatInput]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!chatInput.trim() && chatAttachments.length === 0) || isChatting || !chatSessionRef.current) return;
    
        const userMsg: Message = { 
            role: 'user', 
            content: chatInput, 
            timestamp: Date.now(),
            attachments: [...chatAttachments]
        };
        
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatAttachments([]);
        setIsChatting(true);
    
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
        try {
            let messagePayload: string | Array<any> = userMsg.content;
            if (userMsg.attachments && userMsg.attachments.length > 0) {
                const parts: any[] = [];
                if (userMsg.content) parts.push({ text: userMsg.content });
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
    
            const result = await chatSessionRef.current.sendMessageStream({ message: messagePayload });
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true }]);
    
            let fullText = '';
            let hasToolCall = false;
            let lastUpdateTime = Date.now();
            
            for await (const chunk of result) {
                // @ts-ignore - The type definition might vary slightly but runtime is consistent
                const toolCalls = chunk.functionCalls;
                if (toolCalls && toolCalls.length > 0) {
                     const call = toolCalls[0];
                     if (call.name === 'propose_design') {
                         hasToolCall = true;
                         const args = call.args as any;
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
                         
                         chatSessionRef.current?.sendMessage({
                             message: [{ functionResponse: { id: call.id, name: call.name, response: { result: "Proposal displayed to user." } } }]
                         }).catch(console.error);
                         break; 
                     }
                }
    
                const textChunk = chunk.text;
                if (textChunk && !hasToolCall) {
                    fullText += textChunk;
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
                 const newMsgs = prev.filter(m => !m.isStreaming);
                 return [...newMsgs, { role: 'assistant', content: "I'm having trouble connecting to the design server. Please try again.", timestamp: Date.now() }];
            });
        } finally {
            setIsChatting(false);
        }
      };

    const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newAttachments: Attachment[] = [];
            // Explicitly cast Array.from result to File[] to satisfy typescript
            const files = Array.from(e.target.files) as File[];
            for (const file of files) {
                const url = URL.createObjectURL(file);
                newAttachments.push({ type: 'image', url, file });
            }
            setChatAttachments(prev => [...prev, ...newAttachments]);
            if (chatFileRef.current) chatFileRef.current.value = ''; 
        }
    };

    return (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white scroll-smooth">
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

                       {/* Attachments */}
                       {msg.attachments && msg.attachments.length > 0 && (
                           <div className="flex gap-2 flex-wrap justify-end">
                               {msg.attachments.map((att, i) => (
                                   <div key={i} className="relative group">
                                      <img src={att.url} alt="attachment" className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                   </div>
                               ))}
                           </div>
                       )}

                       {/* ACTION CARD */}
                       {msg.action && msg.action.type === 'propose_design' && (
                           <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                               <div className="flex items-center gap-2 mb-2">
                                   <Sparkles size={16} className="text-blue-600" />
                                   <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Blueprint Proposal</span>
                               </div>
                               <h3 className="font-bold text-lg leading-tight mb-1">{msg.action.title}</h3>
                               <p className="text-xs text-gray-500 mb-4 line-clamp-3">{msg.action.summary}</p>
                               <button 
                                   onClick={() => generateByPrompt(msg.action!.summary)}
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

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            {chatAttachments.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto py-2 px-1 border-b border-gray-100">
                    {chatAttachments.map((att, i) => (
                        <div key={i} className="relative group flex flex-col items-center w-20 shrink-0">
                            <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-sm">
                                <img src={att.url} className="w-full h-full object-cover" alt="preview" />
                                <button type="button" onClick={() => setChatAttachments(p => p.filter((_, ix) => ix !== i))} className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
               <input type="file" ref={chatFileRef} className="hidden" accept="image/*" multiple onChange={handleChatFileSelect} />
               <button type="button" onClick={() => chatFileRef.current?.click()} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors mb-0.5"><Paperclip size={20} /></button>
               <textarea ref={textareaRef} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Describe your project..." disabled={isChatting} className="w-full bg-transparent border-none p-2 text-sm focus:outline-none resize-none max-h-32 min-h-[44px] overflow-hidden" rows={1} />
               <button type="submit" disabled={(!chatInput.trim() && chatAttachments.length === 0) || isChatting} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-0.5">{isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}</button>
            </div>
          </form>
        </>
    );
};