import React from 'react';
import { Layer, BlendMode } from '../types';
import { Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Layers, Copy, Plus } from 'lucide-react';
import { BLEND_MODES } from '../constants';

interface LayerManagerProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onMoveLayer
}) => {
  return (
    <div className="flex flex-col h-full bg-dark-surface border-l border-dark-border">
      <div className="p-3 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" /> Layers
        </h3>
        <span className="text-[10px] text-slate-500">{layers.length} Active</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...layers].reverse().map((layer, index) => {
           // We reverse for display so top layer (end of array) is at top of list
           const isSelected = layer.id === selectedLayerId;
           // Calculate actual index in original array
           const realIndex = layers.length - 1 - index;
           
           return (
            <div 
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`
                group flex flex-col gap-2 p-2 rounded-lg border transition-all cursor-pointer relative
                ${isSelected 
                  ? 'bg-brand-900/20 border-brand-500/50' 
                  : 'bg-dark-bg border-dark-border hover:border-slate-600'}
              `}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                </button>
                
                <div className="w-10 h-10 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAjyQcRMWP3QAA6e0QAc8xVyoAAAAASUVORK5CYII=')] rounded overflow-hidden flex-shrink-0 border border-slate-700">
                  {layer.data && <img src={layer.data} className="w-full h-full object-cover" alt="" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate select-none">
                    {layer.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span>{layer.blendMode}</span>
                    <span>•</span>
                    <span>{layer.opacity}%</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }}
                    className="p-1 hover:text-brand-400 disabled:opacity-30"
                    disabled={realIndex === layers.length - 1} 
                    title="Move Up"
                   >
                     <ArrowUp className="w-3 h-3" />
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }}
                    className="p-1 hover:text-brand-400 disabled:opacity-30"
                    disabled={realIndex === 0}
                    title="Move Down"
                   >
                     <ArrowDown className="w-3 h-3" />
                   </button>
                </div>
              </div>

              {/* Advanced Controls (Visible when selected) */}
              {isSelected && (
                <div className="grid grid-cols-1 gap-3 mt-2 pt-2 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-1 duration-200">
                   {/* Blend Mode */}
                   <div>
                      <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Blend Mode</label>
                      <select 
                          value={layer.blendMode}
                          onChange={(e) => onUpdateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                          className="w-full bg-slate-800 border border-slate-700 text-[10px] rounded px-1.5 py-1 text-slate-300 outline-none focus:border-brand-500"
                          onClick={(e) => e.stopPropagation()}
                      >
                        {BLEND_MODES.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                   </div>
                   
                   {/* Opacity Slider */}
                   <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] text-slate-500 uppercase font-bold">Opacity</label>
                        <input 
                            type="number" 
                            min="0" max="100"
                            value={layer.opacity}
                            onChange={(e) => onUpdateLayer(layer.id, { opacity: Math.min(100, Math.max(0, Number(e.target.value))) })}
                            className="w-12 bg-transparent border border-slate-700 rounded text-[9px] text-slate-300 text-center focus:outline-none focus:border-brand-500 p-0.5"
                            onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <input 
                          type="range" 
                          min="0" max="100"
                          value={layer.opacity}
                          onChange={(e) => onUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-500 block"
                      />
                   </div>
                   
                   <div className="flex justify-end pt-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Layer
                      </button>
                   </div>
                </div>
              )}
            </div>
           );
        })}
        {layers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-2">
            <Layers className="w-8 h-8 opacity-20" />
            <span className="text-xs">No layers yet</span>
          </div>
        )}
      </div>
    </div>
  );
};