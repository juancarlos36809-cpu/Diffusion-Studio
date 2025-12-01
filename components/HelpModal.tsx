
import React from 'react';
import { X, Book, HelpCircle } from 'lucide-react';
import { HELP_CONTENT } from '../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border bg-slate-800/50 rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-brand-400" /> User Manual
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {HELP_CONTENT.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-md font-bold text-brand-200 border-b border-slate-700/50 pb-2">
                {section.title}
              </h3>
              <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed pl-2">
                 {/* Simple markdown parsing for bolding */}
                 {section.content.split('\n').map((line, i) => {
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                        <p key={i} className="mb-2">
                            {parts.map((part, j) => 
                                part.startsWith('**') && part.endsWith('**') ? 
                                <strong key={j} className="text-white">{part.slice(2, -2)}</strong> : 
                                part
                            )}
                        </p>
                    )
                 })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border bg-slate-800/30 text-center rounded-b-lg">
          <p className="text-[10px] text-slate-500">
            Diffusion Studio v{import('../constants').then(m => m.APP_VERSION) || '1.1'}
          </p>
        </div>
      </div>
    </div>
  );
};