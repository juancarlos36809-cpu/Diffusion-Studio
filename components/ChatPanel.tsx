
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatRole } from '../types';
import { Send, Bot, User, Sparkles, Globe, Zap, ExternalLink } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, useSearch: boolean) => void;
  isProcessing: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input, useSearch);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface/50">
      <div className="p-3 border-b border-dark-border bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-brand-400" />
           <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              {useSearch ? 'Expert Q&A' : 'App Control'}
           </span>
        </div>
        
        {/* Mode Toggle */}
        <button 
           onClick={() => setUseSearch(!useSearch)}
           className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-all
             ${useSearch 
                ? 'bg-blue-900/40 border-blue-500 text-blue-300 hover:bg-blue-900/60' 
                : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-white'}
           `}
           title={useSearch ? "Using Google Search for Answers" : "Controlling App Interface"}
        >
           {useSearch ? <Globe className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
           {useSearch ? 'Web Search' : 'App Mode'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-xs mt-10 px-4">
            {useSearch ? (
               <>
                <Globe className="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p className="mb-2">Ask me anything about Art & Photography.</p>
                <p>"What is the Rule of Thirds?"</p>
                <p>"History of Surrealism"</p>
                <p>"How to fix overexposed photos?"</p>
               </>
            ) : (
               <>
                <Zap className="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p className="mb-2">I can help you edit your composition.</p>
                <p>"Add a cinematic lighting layer"</p>
                <p>"Blur the background"</p>
                <p>"Set opacity to 50%"</p>
               </>
            )}
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center shrink-0
              ${msg.role === 'user' ? 'bg-slate-600' : (msg.groundingChunks ? 'bg-blue-600' : 'bg-brand-600')}
            `}>
              {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%]`}>
                <div className={`
                  rounded-lg p-3 text-xs leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-slate-700 text-white rounded-tr-none' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}
                `}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>

                {/* Grounding Sources (Search Results) */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                   <div className="mt-2 pl-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingChunks.map((chunk, i) => chunk.web && (
                           <a 
                             key={i} 
                             href={chunk.web.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded hover:bg-slate-800 hover:border-blue-500 transition-colors group"
                           >
                             <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 group-hover:text-blue-400">
                               {i + 1}
                             </div>
                             <span className="text-[9px] text-slate-300 max-w-[120px] truncate">{chunk.web.title}</span>
                             <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-blue-400" />
                           </a>
                        ))}
                      </div>
                   </div>
                )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
             <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
               <Bot className="w-3 h-3 text-white" />
             </div>
             <div className="bg-slate-800 border border-slate-700 rounded-lg rounded-tl-none p-3 max-w-[85%] flex items-center gap-1">
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-dark-border bg-slate-800/30">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={useSearch ? "Ask about art & photography..." : "Ask AI to edit layers..."}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none placeholder-slate-500 transition-all"
            disabled={isProcessing}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 top-1.5 p-1.5 bg-brand-600 text-white rounded hover:bg-brand-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
