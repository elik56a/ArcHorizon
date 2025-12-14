
import React, { useState, useRef } from 'react';
import { Message, Attachment } from '../../types';
import { MessageSquare, ClipboardList } from 'lucide-react';
import { Chat } from '@google/genai';
import { ChatTab } from './left/ChatTab';
import { SpecsTab } from './left/SpecsTab';
import { useProjectStore } from '../../store/useProjectStore';
import { useTranslation } from '../../hooks/useTranslation';

type InputMode = 'chat' | 'form';

interface ChatSidebarProps {
    disciplineStyle: any;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ disciplineStyle }) => {
  const { t } = useTranslation();
  const { getDiscipline } = useProjectStore();
  const [mode, setMode] = useState<InputMode>('chat');
  const discipline = getDiscipline();
  
  // --- CHAT STATE ---
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('chat.switchMsg', { discipline: t(`layers.${discipline}`) }),
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
           { id: 'chat', icon: MessageSquare, label: t('editor.panels.consult') },
           { id: 'form', icon: ClipboardList, label: t('editor.panels.specs') },
         ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setMode(tab.id as InputMode)} 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                  mode === tab.id 
                  ? `${disciplineStyle.highlight} text-white shadow-md` 
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
