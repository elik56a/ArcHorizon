
import React, { useEffect, useRef, useState } from 'react';
import { Bot, User, Loader2, Paperclip, ArrowRight, Sparkles, PlayCircle, X, FileScan, Lightbulb, MousePointer2 } from 'lucide-react';
import { Message, Attachment } from '../../../types';
import { Chat } from '@google/genai';
import { useProjectStore } from '../../../store/useProjectStore';
import { getAgent } from '../../../services/ai/agentRegistry';
import { useTranslation } from '../../../hooks/useTranslation';

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

// Internal type to hold suspended message state while waiting for user choice
interface PendingMessage {
    content: string;
    attachments: Attachment[];
}

export const ChatTab: React.FC<ChatTabProps> = ({
    messages, setMessages, chatInput, setChatInput, isChatting, setIsChatting, 
    chatAttachments, setChatAttachments, chatSessionRef
}) => {
    const { t } = useTranslation();
    const { generateByPrompt, isGenerating, getDiscipline } = useProjectStore();
    const discipline = getDiscipline();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatFileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // State to hold the message while we ask the user what to do with the file
    const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(null);
    
    const currentDiscRef = useRef(discipline);

    const scrollToBottom = () => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); };

    useEffect(() => { scrollToBottom(); }, [messages.length, isChatting, pendingMessage]);

    useEffect(() => {
        if (!chatSessionRef.current || currentDiscRef.current !== discipline) {
            const agent = getAgent(discipline);
            chatSessionRef.current = agent.createChat();
            
            if (currentDiscRef.current !== discipline) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: t('chat.switchMsg', { discipline: t(`layers.${discipline}`) }),
                    timestamp: Date.now()
                }]);
                currentDiscRef.current = discipline;
            }
        }
    }, [discipline]);

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
    
        // 1. Check if files are attached. If so, intercept and ask for clarification.
        if (chatAttachments.length > 0) {
            setPendingMessage({
                content: chatInput,
                attachments: [...chatAttachments]
            });
            // Clear input immediately so user feels "sent", but don't process yet
            setChatInput('');
            setChatAttachments([]);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            return;
        }

        // 2. No files? Proceed normally.
        await processMessage(chatInput, []);
    };

    const handleFileDecision = async (mode: 'digitize' | 'reference') => {
        if (!pendingMessage) return;

        const { content, attachments } = pendingMessage;
        
        // Inject instructions based on mode
        let finalPrompt = content;
        // Display text might be different from actual prompt to keep chat clean
        let displayText = content;

        if (mode === 'digitize') {
            finalPrompt = `[MODE: DIGITIZE_EXACT] The user wants to convert the attached file into a live blueprint. STRICTLY TRACE the geometry from the image. Do not invent. ${content}`;
            displayText = content || "Convert this file to a blueprint.";
        } else {
            finalPrompt = `[MODE: NEW_DESIGN_REFERENCE] The user provided an image as a STYLE/LAYOUT REFERENCE only. Generate a NEW design based on this inspiration. ${content}`;
            displayText = content || "Use this file as a reference.";
        }

        setPendingMessage(null); // Clear pending state
        await processMessage(finalPrompt, attachments, displayText);
    };

    const handleCancelFile = () => {
        setPendingMessage(null);
        // Note: attachments are already cleared from input state, user has to re-upload if they cancel. 
        // This is acceptable behavior for "Cancel".
    };

    // Helper to find the most recent image attachments in the chat history
    const getRecentContextImages = async (): Promise<{mimeType: string, data: string}[]> => {
        // Look backwards from end
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                // Convert these to base64
                const processed = await Promise.all(msg.attachments.map(async (att) => {
                    if (att.file) {
                        return new Promise<{mimeType: string, data: string}>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve({ mimeType: att.file!.type, data: (reader.result as string).split(',')[1] });
                            reader.readAsDataURL(att.file!);
                        });
                    }
                    return null;
                }));
                return processed.filter(p => p !== null) as {mimeType: string, data: string}[];
            }
        }
        return [];
    };

    const handleGenerateProposal = async (summary: string) => {
        // 1. Try to find context images from the chat history if this proposal likely came from a file conversation
        const images = await getRecentContextImages();
        // 2. Call generation
        generateByPrompt(summary, images);
    };

    const processMessage = async (content: string, attachments: Attachment[], overrideUserDisplay?: string) => {
        // Clean display text (remove hidden tags if they leaked into display arg)
        const displayContent = (overrideUserDisplay || content).replace(/\[MODE:.*?\]/, '').trim();

        const userMsg: Message = { 
            role: 'user', 
            content: displayContent || "Sent attachments",
            timestamp: Date.now(),
            attachments: attachments
        };
        
        setMessages(prev => [...prev, userMsg]);
        setIsChatting(true);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }
        // Ensure inputs are clear
        setChatInput('');
        setChatAttachments([]);
    
        try {
            let messagePayload: string | Array<any> = content;
            
            if (attachments && attachments.length > 0) {
                const parts: any[] = [];
                if (content) parts.push({ text: content });
                for (const att of attachments) {
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
    
            const result = await chatSessionRef.current!.sendMessageStream({ message: messagePayload });
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true }]);
    
            let fullText = '';
            let hasToolCall = false;
            let lastUpdateTime = Date.now();
            
            for await (const chunk of result) {
                // @ts-ignore
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
                                content: newMsgs[lastIndex].content || "I have a layout ready for you.", 
                                action: { type: 'propose_design', title: args.title, summary: args.summary } 
                            };
                            return newMsgs;
                         });
                         
                         // CRITICAL FIX: Await the function response to ensure turn completion
                         await chatSessionRef.current?.sendMessage({ 
                             message: [{ functionResponse: { id: call.id, name: call.name, response: { result: "ok" } } }] 
                         });
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
                 return [...newMsgs, { role: 'assistant', content: "I encountered an issue connecting to the design engine. Please try again.", timestamp: Date.now() }];
            });
        } finally {
            setIsChatting(false);
        }
    };

    const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newAttachments: Attachment[] = [];
            const files = Array.from(e.target.files) as File[];
            for (const file of files) {
                newAttachments.push({ type: 'image', url: URL.createObjectURL(file), file });
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
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border border-gray-100 ${msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'}`}>
                      {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                   </div>
                   <div className="flex flex-col gap-2 min-w-[200px]">
                       {msg.content && (
                           <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm text-start ${msg.role === 'user' ? 'bg-gray-100 text-gray-900 rounded-te-none rtl:rounded-te-2xl rtl:rounded-ts-none' : 'bg-blue-50/50 text-gray-800 border border-blue-100 rounded-ts-none rtl:rounded-ts-2xl rtl:rounded-te-none'}`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              {msg.isStreaming && <span className="inline-block w-1.5 h-3 ms-1 bg-blue-400 animate-pulse align-middle rounded-sm"></span>}
                           </div>
                       )}
                       {msg.attachments && msg.attachments.length > 0 && (
                           <div className="flex gap-2 flex-wrap justify-end">
                               {msg.attachments.map((att, i) => (
                                   <div key={i} className="relative group">
                                      <img src={att.url} alt="attachment" className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                   </div>
                               ))}
                           </div>
                       )}
                       {msg.action && msg.action.type === 'propose_design' && (
                           <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rtl:shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] mt-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                               <div className="flex items-center gap-2 mb-2">
                                   <Sparkles size={16} className="text-blue-600" />
                                   <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('chat.proposal', { discipline })}</span>
                               </div>
                               <h3 className="font-bold text-lg leading-tight mb-1 text-start">{msg.action.title}</h3>
                               <p className="text-xs text-gray-500 mb-4 line-clamp-3 text-start">{msg.action.summary}</p>
                               <button 
                                    onClick={() => handleGenerateProposal(msg.action!.summary)} 
                                    disabled={isGenerating} 
                                    className="w-full py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                   {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <PlayCircle size={16} className="rtl:rotate-180" />}
                                   {t('chat.generate')}
                               </button>
                           </div>
                       )}
                   </div>
                </div>
              </div>
            ))}

            {/* PENDING FILE CLARIFICATION UI */}
            {pendingMessage && (
                <div className="flex flex-col gap-2 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-3 max-w-[90%] flex-row">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border border-gray-100 bg-black text-white">
                            <Bot size={16} />
                        </div>
                        <div className="flex flex-col gap-2 min-w-[280px]">
                            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-ts-none rtl:rounded-ts-2xl rtl:rounded-te-none shadow-sm relative">
                                <button onClick={handleCancelFile} className="absolute top-2 right-2 rtl:right-auto rtl:left-2 text-gray-300 hover:text-gray-500 p-1"><X size={14}/></button>
                                <p className="text-sm font-bold text-gray-900 mb-1 text-start">{t('chat.detectedFile')}</p>
                                <p className="text-xs text-gray-500 mb-4 text-start">{t('chat.askInterpret')}</p>
                                
                                {pendingMessage.attachments.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                        {pendingMessage.attachments.map((att, i) => (
                                            <img key={i} src={att.url} className="w-16 h-16 rounded border border-gray-200 object-cover" />
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleFileDecision('digitize')}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 text-start transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                            <FileScan size={20} />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-900">{t('chat.digitize.title')}</span>
                                            <span className="block text-[10px] text-gray-500 leading-tight">{t('chat.digitize.desc')}</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => handleFileDecision('reference')}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 text-start transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                                            <Lightbulb size={20} />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-900">{t('chat.reference.title')}</span>
                                            <span className="block text-[10px] text-gray-500 leading-tight">{t('chat.reference.desc')}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            {chatAttachments.length > 0 && !pendingMessage && (
                <div className="flex gap-3 mb-3 overflow-x-auto py-2 px-1 border-b border-gray-100">
                    {chatAttachments.map((att, i) => (
                        <div key={i} className="relative group flex flex-col items-center w-20 shrink-0">
                            <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-sm">
                                <img src={att.url} className="w-full h-full object-cover" alt="preview" />
                                <button type="button" onClick={() => setChatAttachments(p => p.filter((_, ix) => ix !== i))} className="absolute top-0.5 right-0.5 rtl:right-auto rtl:left-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
               <input type="file" ref={chatFileRef} className="hidden" accept="image/*" multiple onChange={handleChatFileSelect} />
               <button type="button" disabled={!!pendingMessage} onClick={() => chatFileRef.current?.click()} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors mb-0.5 disabled:opacity-50"><Paperclip size={20} /></button>
               <textarea 
                    ref={textareaRef} 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                    placeholder={pendingMessage ? t('chat.selectOption') : t('chat.placeholder')} 
                    disabled={!!pendingMessage} 
                    className="w-full bg-transparent border-none p-2 text-sm focus:outline-none resize-none max-h-32 min-h-[44px] overflow-hidden" 
                    rows={1} 
                />
               <button type="submit" disabled={(!chatInput.trim() && chatAttachments.length === 0) || isChatting || !!pendingMessage} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-0.5">{isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 rtl:rotate-180" />}</button>
            </div>
          </form>
        </>
    );
};
