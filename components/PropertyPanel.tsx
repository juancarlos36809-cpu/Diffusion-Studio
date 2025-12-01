
import React, { useState, useEffect } from 'react';
import { Filter, Layer } from '../types';
import { STANDARD_FILTERS, AI_MATERIALS, AI_STYLES } from '../constants';
import { Sliders, Box, Trash, Plus, Wand2, Layers, Zap, Copy, Scan, Stethoscope } from 'lucide-react';
import { Button } from './Button';

interface PropertyPanelProps {
  selectedLayer: Layer | null;
  onAddFilter: (filter: Filter) => void;
  onRemoveFilter: (filterId: string) => void;
  onUpdateFilter: (filterId: string, value: number) => void;
  onGenerateMaterial: (prompt: string, name: string) => void;
  onApplyAiFilter: (prompt: string, strength: number, asNewLayer: boolean) => void;
  onUpdateLayerOpacity: (opacity: number) => void;
  onUpdateLayerPrompt: (prompt: string) => void;
  onSmartRepair: (recursive: boolean) => Promise<string>;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedLayer,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onGenerateMaterial,
  onApplyAiFilter,
  onUpdateLayerOpacity,
  onUpdateLayerPrompt,
  onSmartRepair
}) => {
  const [transitionStrength, setTransitionStrength] = useState(0.75);
  const [localPrompt, setLocalPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recursiveDepth, setRecursiveDepth] = useState(false);

  // Sync local prompt state when selected layer changes
  useEffect(() => {
    if (selectedLayer) {
      setLocalPrompt(selectedLayer.actionPrompt || '');
      setAnalysisResult(''); // Clear analysis on layer change
    }
  }, [selectedLayer?.id, selectedLayer?.actionPrompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalPrompt(e.target.value);
    onUpdateLayerPrompt(e.target.value);
  };

  const handleAnalyzeClick = async () => {
    setIsAnalyzing(true);
    try {
      const result = await onSmartRepair(false); // False means analysis only for this button context, but the prop is designed for repair. 
      // We need a slight refactor in App to support "Just Analyze" vs "Repair". 
      // For now, we will use the return value if provided.
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!selectedLayer) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
        <Sliders className="w-8 h-8 opacity-20 mb-3" />
        <p>Select a layer to access filters, materials, and styles.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 scrollbar-thin">
      
      {/* Layer Properties */}
      <div className="space-y-3">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-700 pb-1">
           <Layers className="w-3 h-3" /> Layer Properties
         </h4>
         
         <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
           <div className="flex justify-between items-center mb-2">
             <label className="text-[10px] font-bold text-slate-300">Master Opacity</label>
             <span className="text-[10px] font-mono text-brand-300">{selectedLayer.opacity}%</span>
           </div>
           <input 
              type="range" min="0" max="100"
              value={selectedLayer.opacity}
              onChange={(e) => onUpdateLayerOpacity(Number(e.target.value))}
              className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
           />
         </div>
      </div>

       {/* SMART REPAIR SECTION */}
       <div className="space-y-3 pt-2 border-t border-dark-border">
         <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2 border-b border-teal-900/30 pb-1">
          <Stethoscope className="w-3 h-3" /> Smart Photo Repair
        </h4>
        
        <div className="bg-teal-900/10 border border-teal-900/30 rounded p-3 space-y-3">
           <div className="flex items-start justify-between gap-2">
             <div className="text-[10px] text-slate-400 leading-tight">
               Recursive analysis detects defects and auto-generates a repair prompt.
             </div>
             <div className="flex items-center gap-1.5">
               <input 
                 type="checkbox" 
                 id="recursive"
                 checked={recursiveDepth}
                 onChange={(e) => setRecursiveDepth(e.target.checked)}
                 className="rounded bg-slate-800 border-slate-600 text-teal-500 focus:ring-0 w-3 h-3"
               />
               <label htmlFor="recursive" className="text-[9px] text-slate-300 font-bold uppercase">2x Pass</label>
             </div>
           </div>

           {analysisResult && (
             <div className="bg-black/20 p-2 rounded text-[10px] text-teal-200 border-l-2 border-teal-500">
                <span className="font-bold block mb-1">Analysis:</span>
                "{analysisResult}"
             </div>
           )}

           <Button 
             variant="primary" 
             className="!w-full !py-2 !text-[10px] !bg-teal-700 hover:!bg-teal-600"
             onClick={() => onSmartRepair(recursiveDepth).then(res => setAnalysisResult(res))}
             isLoading={isAnalyzing}
             icon={<Scan className="w-3 h-3" />}
           >
             {analysisResult ? 'Apply Repair Fix' : 'Analyze & Auto-Repair'}
           </Button>
        </div>
      </div>

      {/* AI Style & Composition - NEW SECTION */}
      <div className="space-y-3 pt-2 border-t border-dark-border">
         <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest flex items-center gap-2 border-b border-brand-900/30 pb-1">
          <Zap className="w-3 h-3" /> AI Layer Actions
        </h4>
        
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Layer Action Prompt</label>
          <textarea
            value={localPrompt}
            onChange={handlePromptChange}
            placeholder="Describe how to modify this specific layer (e.g., 'make it rusty', 'turn into a sketch')..."
            className="w-full h-20 bg-dark-bg border border-dark-border rounded p-2 text-xs focus:border-brand-500 outline-none resize-none placeholder-slate-600"
          />
        </div>

        {/* Transition Strength Slider */}
        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
           <div className="flex justify-between items-center mb-1">
             <label className="text-[10px] font-bold text-slate-400">Effect Strength</label>
             <span className="text-[10px] font-mono text-brand-300">{Math.round(transitionStrength * 100)}%</span>
           </div>
           <input 
              type="range" min="0.1" max="1.0" step="0.05"
              value={transitionStrength}
              onChange={(e) => setTransitionStrength(Number(e.target.value))}
              className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
           />
           <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>Subtle</span>
              <span>Total Change</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
           <Button 
             variant="primary" 
             className="!py-2 !text-[10px]"
             disabled={!localPrompt.trim()}
             onClick={() => onApplyAiFilter(localPrompt, transitionStrength, false)}
             icon={<Wand2 className="w-3 h-3" />}
           >
             Transform Layer
           </Button>
           <Button 
             variant="secondary" 
             className="!py-2 !text-[10px]"
             disabled={!localPrompt.trim()}
             onClick={() => onApplyAiFilter(localPrompt, transitionStrength, true)}
             icon={<Copy className="w-3 h-3" />}
           >
             Compose New
           </Button>
        </div>
      </div>

      {/* Preset Styles */}
      <div className="space-y-3 pt-2">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Quick Styles</h4>
        <div className="grid grid-cols-2 gap-2">
          {AI_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => {
                setLocalPrompt(style.prompt);
                onUpdateLayerPrompt(style.prompt);
                onApplyAiFilter(style.prompt, transitionStrength, false);
              }}
              className="text-[10px] p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition-all text-left truncate"
              title={style.prompt}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Standard CSS Filters */}
      <div className="space-y-3 pt-4 border-t border-dark-border">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-700 pb-1">
          <Sliders className="w-3 h-3" /> CSS Filter Stack
        </h4>
        
        {/* Applied Filters List */}
        {selectedLayer.filters.length > 0 ? (
          <div className="space-y-2 mb-4">
             {selectedLayer.filters.map(filter => (
               <div key={filter.id} className="bg-slate-800/80 p-3 rounded-md border border-slate-700 shadow-sm">
                 <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                      <span className="font-medium">{filter.label}</span>
                   </div>
                   <button 
                    onClick={() => onRemoveFilter(filter.id)} 
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Remove Filter"
                   >
                    <Trash className="w-3 h-3" />
                   </button>
                 </div>
                 
                 {!filter.type.startsWith('ai-') && (
                   <div className="flex items-center gap-3">
                      <span className="text-[9px] text-slate-500 w-8">Str</span>
                      <input 
                        type="range"
                        min={STANDARD_FILTERS.find(f => f.type === filter.type)?.min || 0}
                        max={STANDARD_FILTERS.find(f => f.type === filter.type)?.max || 100}
                        value={filter.value}
                        onChange={(e) => onUpdateFilter(filter.id, Number(e.target.value))}
                        className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                      <span className="text-[10px] font-mono text-brand-300 w-8 text-right">
                        {filter.value}
                      </span>
                   </div>
                 )}
                 {filter.type.startsWith('ai-') && (
                    <div className="text-[10px] text-slate-500 italic flex justify-between px-1">
                       <span>Baked into pixels</span>
                       <span className="text-[9px] bg-slate-700 px-1.5 rounded text-slate-400">Fixed</span>
                    </div>
                 )}
               </div>
             ))}
          </div>
        ) : (
          <div className="text-[10px] text-slate-600 italic mb-2 px-1">No active filters on this layer</div>
        )}

        {/* Add Filter Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {STANDARD_FILTERS.map(f => (
            <button
              key={f.type}
              onClick={() => onAddFilter({
                id: Math.random().toString(36),
                type: f.type,
                value: f.default,
                label: f.label
              })}
              className="text-[10px] px-2 py-1.5 bg-dark-surface border border-dark-border rounded hover:border-brand-500/50 hover:bg-slate-700 transition-all text-slate-300 flex items-center gap-1 justify-center"
            >
              <Plus className="w-3 h-3" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Materials Generator */}
      <div className="space-y-3 pt-4 border-t border-dark-border">
         <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 border-b border-purple-900/30 pb-1">
          <Box className="w-3 h-3" /> Add Material
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {AI_MATERIALS.map(mat => (
             <button
              key={mat.id}
              onClick={() => onGenerateMaterial(mat.prompt, mat.label)}
              className="text-[10px] p-2 bg-purple-500/5 border border-purple-500/20 text-purple-200/80 rounded hover:bg-purple-500/20 transition-all text-left truncate"
              title={mat.prompt}
            >
              {mat.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
