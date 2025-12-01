
import React from 'react';
import { Layer } from '../types';
import { Layers, Image as ImageIcon, Box } from 'lucide-react';

interface LayerTabsProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
}

export const LayerTabs: React.FC<LayerTabsProps> = ({ layers, selectedLayerId, onSelectLayer }) => {
  // If no layers, show a placeholder tab or nothing. 
  // We'll show nothing to keep it clean, or a "Workspace" label.
  if (layers.length === 0) {
     return (
        <div className="h-9 border-b border-dark-border bg-dark-surface flex items-end px-2">
            <div className="px-4 py-1.5 rounded-t-md bg-slate-800/30 text-slate-500 text-xs border-t border-l border-r border-slate-700/30 italic select-none">
                Empty Workspace
            </div>
        </div>
     );
  }

  // Reverse layers for tabs? usually tabs are ordered 1..N. Layers stack 1..N (bottom to top).
  // Visualizing them left-to-right as Bottom-to-Top (1..N) makes sense for "Nodes".
  // The LayerManager lists them Top-to-Bottom (N..1). 
  // We will list them standard array order (0..length) which corresponds to Bottom..Top.
  
  return (
    <div className="h-9 shrink-0 bg-dark-surface border-b border-dark-border flex items-end px-2 gap-1 overflow-x-auto scrollbar-thin">
      {layers.map((layer, index) => {
        const isSelected = selectedLayerId === layer.id;
        
        // Determine icon based on simple heuristic or default
        let Icon = ImageIcon;
        if (layer.name.toLowerCase().includes('material')) Icon = Box;
        if (layer.name.toLowerCase().includes('comp')) Icon = Layers;

        return (
          <button
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`
              group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg min-w-[120px] max-w-[180px]
              transition-all duration-200 select-none border-t border-l border-r
              ${isSelected 
                ? 'bg-[#0f172a] border-slate-600 text-brand-400 z-10 translate-y-[1px] shadow-[0_-2px_10px_rgba(0,0,0,0.2)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 mt-1.5'}
            `}
          >
            {/* Connection Node Dot (Visual flair for 'Node' request) */}
            <div className={`absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-slate-900 ${isSelected ? 'bg-brand-500' : 'bg-slate-600'}`}></div>

            <div className="w-3.5 h-3.5 rounded overflow-hidden bg-black/50 shrink-0 border border-white/10 flex items-center justify-center">
               {layer.data ? (
                 <img src={layer.data} className="w-full h-full object-cover" alt="" />
               ) : (
                 <Icon className="w-2.5 h-2.5 opacity-50" />
               )}
            </div>
            
            <span className="text-[10px] font-medium truncate flex-1 text-left">
                {index + 1}. {layer.name}
            </span>

            {/* Close/Status Indicator could go here, for now simple selection */}
            
            {/* Hides the bottom border for the active tab to visually merge with canvas background */}
            {isSelected && <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[#0f172a] z-20" />}
          </button>
        );
      })}
      
      {/* Add Layer Shortcut (Fake tab) */}
      <div className="flex items-center justify-center w-8 h-full pb-1 opacity-50 hover:opacity-100 transition-opacity">
         <div className="w-1 h-1 rounded-full bg-slate-600 mx-0.5"></div>
         <div className="w-1 h-1 rounded-full bg-slate-600 mx-0.5"></div>
         <div className="w-1 h-1 rounded-full bg-slate-600 mx-0.5"></div>
      </div>
    </div>
  );
};
