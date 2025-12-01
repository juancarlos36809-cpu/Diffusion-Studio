import React from 'react';
import { GeneratedImage } from '../types';
import { Clock, Download, Trash2, X } from 'lucide-react';

interface SidebarProps {
  history: GeneratedImage[];
  onSelectHistory: (image: GeneratedImage) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  onSelectHistory, 
  onClearHistory,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-dark-surface border-l border-dark-border z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-dark-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand-400" />
              History
            </h2>
            <div className="flex items-center gap-2">
               {history.length > 0 && (
                <button 
                  onClick={onClearHistory}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">
                <p>No images generated yet.</p>
                <p className="text-sm mt-2">Start creating to build your gallery.</p>
              </div>
            ) : (
              history.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative aspect-square rounded-lg overflow-hidden border border-dark-border cursor-pointer hover:border-brand-500 transition-all"
                  onClick={() => onSelectHistory(img)}
                >
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[10px] text-brand-300 uppercase tracking-wider">{img.aspectRatio}</span>
                       <a 
                        href={img.url} 
                        download={`diffusion-${img.id}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 bg-white/20 rounded-full hover:bg-white/40 text-white"
                       >
                         <Download className="w-3 h-3" />
                       </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};