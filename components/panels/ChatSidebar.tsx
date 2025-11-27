
import React, { useState, useRef } from 'react';
import { Message, Attachment } from '../../types';
import { MessageSquare, ClipboardList } from 'lucide-react';
import { Chat } from '@google/genai';
import { ChatTab } from './left/ChatTab';
import { SpecsTab } from './left/SpecsTab';

type InputMode = 'chat' | 'form';

const ChatSidebar: React.FC = () => {
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
  const [chatAttachments, setChatAttachments] = useState<Attachment[]>([]);

  return (
    <div className="flex flex-col h-full bg-white z-10">
      
      {/* Navigation Tabs */}
      <div className="flex p-2 gap-1 bg-white border-b border-gray-200 shrink-0">
         {[
           { id: 'chat', icon: MessageSquare, label: 'Consult' },
           { id: 'form', icon: ClipboardList, label: 'Specs' },
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

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden flex flex-col">
         {mode === 'chat' && (
             <ChatTab 
                messages={messages} 
                setMessages={setMessages}
                chatInput={chatInput} 
                setChatInput={setChatInput}
                isChatting={isChatting} 
                setIsChatting={setIsChatting}
                chatAttachments={chatAttachments}
                setChatAttachments={setChatAttachments}
                chatSessionRef={chatSessionRef}
             />
         )}
         {mode === 'form' && <SpecsTab />}
      </div>
    </div>
  );
};

export default ChatSidebar;
