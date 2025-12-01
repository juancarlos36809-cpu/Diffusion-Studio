
import React, { useState, useEffect } from 'react';
import { TrainingProfile } from '../types';
import { BrainCircuit, Save, History, Zap } from 'lucide-react';
import { Button } from './Button';

interface TrainingModuleProps {
  profile: TrainingProfile;
  onSave: (profile: TrainingProfile) => void;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({ profile, onSave }) => {
  const [localProfile, setLocalProfile] = useState<TrainingProfile>(profile);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleChange = (field: keyof TrainingProfile, value: any) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(localProfile);
    setIsDirty(false);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-dark-bg/50 overflow-y-auto scrollbar-thin">
       <div className="mb-6 border-b border-dark-border pb-4">
          <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wider mb-2">
             <BrainCircuit className="w-5 h-5" /> AI Personalization Training
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
             Teach the AI your specific artistic preferences. This "Memory Context" will be injected into every generation request to align the AI with your unique <span className="text-teal-200">Imagination Road</span>.
          </p>
       </div>

       <div className="space-y-6 flex-1">
          
          {/* Active Switch */}
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700">
             <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${localProfile.autoApply ? 'text-teal-400' : 'text-slate-600'}`} />
                <span className="text-xs font-bold text-slate-300">Enable Neural Context</span>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={localProfile.autoApply} 
                  onChange={(e) => handleChange('autoApply', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
             </label>
          </div>

          {/* Imagination Road */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                Imagination Road (Philosophy)
             </label>
             <textarea 
               value={localProfile.imaginationRoad}
               onChange={(e) => handleChange('imaginationRoad', e.target.value)}
               placeholder="Describe your artistic soul. E.g. 'I prefer deep shadows, emotional resonance, and surreal landscapes. I dislike generic, flat lighting. My art should feel like a dream.'"
               className="w-full h-32 bg-dark-surface border border-slate-700 rounded p-3 text-xs text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
             />
             <p className="text-[9px] text-slate-500 italic">This helps the AI understand the *intent* behind your prompts.</p>
          </div>

          {/* Styles */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Aesthetic Keywords</label>
             <input 
               type="text"
               value={localProfile.preferredStyles}
               onChange={(e) => handleChange('preferredStyles', e.target.value)}
               placeholder="cyberpunk, watercolor, matte painting, 8k, volumetric lighting"
               className="w-full bg-dark-surface border border-slate-700 rounded p-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
             />
          </div>

          {/* Negative */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase">Global Avoidance (Negative)</label>
             <input 
               type="text"
               value={localProfile.avoidElements}
               onChange={(e) => handleChange('avoidElements', e.target.value)}
               placeholder="text, watermarks, blurry, low contrast, cartoon"
               className="w-full bg-dark-surface border border-slate-700 rounded p-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
             />
          </div>

       </div>

       <div className="pt-4 mt-4 border-t border-dark-border">
          <Button 
             variant="primary" 
             onClick={handleSave} 
             disabled={!isDirty}
             className={`w-full ${isDirty ? 'bg-teal-600 hover:bg-teal-500' : 'opacity-50'}`}
             icon={<Save className="w-4 h-4" />}
          >
             Save Training Profile
          </Button>
          {isDirty && <p className="text-center text-[10px] text-teal-400 mt-2">Unsaved changes</p>}
       </div>
    </div>
  );
};
