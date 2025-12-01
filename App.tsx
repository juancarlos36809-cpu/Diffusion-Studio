
import React, { useState, useEffect, useRef } from 'react';
import { Layer, ModelType, AspectRatio, BlendMode, Filter, ChatMessage, PromptAnalysisResult, TrainingProfile, ActionLog } from './types';
import { MODELS, ASPECT_RATIOS, APP_VERSION } from './constants';
import { generateImageWithGemini, sendChatMessage, analyzeImage, analyzePrompt } from './services/geminiService';
import { exportCanvasAs, ExportFormat } from './services/imageExport';
import { LayerManager } from './components/LayerManager';
import { PropertyPanel } from './components/PropertyPanel';
import { ChatPanel } from './components/ChatPanel';
import { MenuBar } from './components/MenuBar';
import { LayerTabs } from './components/LayerTabs';
import { HelpModal } from './components/HelpModal';
import { TrainingModule } from './components/TrainingModule';
import { Button } from './components/Button';
import { 
  Sparkles, 
  Settings, 
  Cpu, 
  Download,
  Plus,
  Upload,
  Languages,
  Check,
  BrainCircuit
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

function App() {
  // --- STATE ---
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  // Generation
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [model, setModel] = useState<ModelType>(ModelType.FAST);
  const [customEndpoint, setCustomEndpoint] = useState('http://127.0.0.1:7860/sdapi/v1/txt2img');
  
  // Training / Personalization
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile>({
    imaginationRoad: "",
    preferredStyles: "",
    avoidElements: "",
    autoApply: true
  });
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  // Analysis
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysisResult | null>(null);
  const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // UI
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'filters' | 'chat' | 'training'>('generate');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Training Profile from Local Storage
  useEffect(() => {
    const savedProfile = localStorage.getItem('diffusion_training_profile');
    if (savedProfile) {
      try {
        setTrainingProfile(JSON.parse(savedProfile));
      } catch (e) { console.error("Failed to load training profile", e); }
    }
  }, []);

  const saveTrainingProfile = (profile: TrainingProfile) => {
    setTrainingProfile(profile);
    localStorage.setItem('diffusion_training_profile', JSON.stringify(profile));
  };

  const logAction = (type: ActionLog['type'], description: string) => {
     const newLog: ActionLog = {
        id: generateId(),
        type,
        description,
        timestamp: Date.now()
     };
     setActionLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50
  };

  // --- CANVAS RENDERING ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset Canvas (1024x1024 Preview)
    canvas.width = 1024; 
    canvas.height = 1024;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    ctx.fillStyle = '#0f172a'; // dark-bg
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Layers
    layers.forEach(layer => {
      if (!layer.visible || !layer.data) return;

      const img = new Image();
      img.src = layer.data;
      
      ctx.save();
      
      // Blend Mode Mapping
      let gco = layer.blendMode as string;
      if (gco === 'normal') gco = 'source-over';
      ctx.globalCompositeOperation = gco as GlobalCompositeOperation;
      
      ctx.globalAlpha = layer.opacity / 100;

      // Filter Mapping
      const cssFilters = layer.filters
        .filter(f => !f.type.startsWith('ai-'))
        .map(f => {
          switch(f.type) {
             case 'blur': return `blur(${f.value}px)`;
             case 'contrast': return `contrast(${f.value}%)`;
             case 'brightness': return `brightness(${f.value}%)`;
             case 'grayscale': return `grayscale(${f.value}%)`;
             case 'sepia': return `sepia(${f.value}%)`;
             case 'saturate': return `saturate(${f.value}%)`;
             case 'hue-rotate': return `hue-rotate(${f.value}deg)`;
             case 'invert': return `invert(${f.value}%)`;
             default: return '';
          }
        }).join(' ');
      
      ctx.filter = cssFilters || 'none';

      // Draw Full Size (simplification)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    });

  }, [layers]);


  // --- ACTIONS ---

  const addLayer = (data: string, name: string, blendMode: BlendMode = BlendMode.NORMAL, actionPrompt: string = '') => {
    const newLayer: Layer = {
      id: generateId(),
      name,
      type: 'image',
      data,
      visible: true,
      opacity: 100,
      blendMode,
      x: 0, 
      y: 0,
      filters: [],
      actionPrompt
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    // Log meaningful edits
    if (updates.filters || updates.opacity || updates.blendMode) {
       const layer = layers.find(l => l.id === id);
       logAction('edit', `Updated layer ${layer?.name}`);
    }
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const moveLayer = (id: string, dir: 'up' | 'down') => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const newLayers = [...prev];
      if (dir === 'up' && idx < newLayers.length - 1) {
        [newLayers[idx], newLayers[idx+1]] = [newLayers[idx+1], newLayers[idx]];
      } else if (dir === 'down' && idx > 0) {
        [newLayers[idx], newLayers[idx-1]] = [newLayers[idx-1], newLayers[idx]];
      }
      return newLayers;
    });
  };

  const mergeLayers = () => {
     const canvas = canvasRef.current;
     if (canvas) {
       const flatData = canvas.toDataURL('image/png');
       addLayer(flatData, 'Merged Composition', BlendMode.NORMAL);
       logAction('edit', 'Merged layers');
     }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
           addLayer(event.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const checkProAuth = async () => {
    // @ts-ignore
    if (model === ModelType.PRO && window.aistudio && window.aistudio.hasSelectedApiKey) {
       // @ts-ignore
       const hasKey = await window.aistudio.hasSelectedApiKey();
       if (!hasKey) {
          setShowApiKeyModal(true);
          return false;
       }
    }
    return true;
  };

  const handlePromptAnalysis = async () => {
     if (!prompt.trim()) return;
     setIsAnalyzingPrompt(true);
     setPromptAnalysis(null);
     try {
        const result = await analyzePrompt(prompt);
        setPromptAnalysis(result);
     } catch (e) {
        console.error(e);
     } finally {
        setIsAnalyzingPrompt(false);
     }
  };

  const handleGenerate = async (genPrompt: string = prompt) => {
    if (!genPrompt.trim()) return;
    if (!(await checkProAuth())) return;

    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generateImageWithGemini({
        prompt: genPrompt,
        negativePrompt,
        aspectRatio,
        model,
        customEndpoint: model === ModelType.CUSTOM ? customEndpoint : undefined,
        trainingProfile
      });
      addLayer(imageUrl, `Gen: ${genPrompt.slice(0, 10)}...`, BlendMode.NORMAL, genPrompt);
      logAction('generation', `Generated: ${genPrompt.slice(0, 20)}...`);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMaterial = async (materialPrompt: string, name: string) => {
     setIsGenerating(true);
     try {
        const imageUrl = await generateImageWithGemini({
           prompt: materialPrompt,
           model: model === ModelType.CUSTOM ? ModelType.CUSTOM : ModelType.FAST,
           aspectRatio: '1:1',
           customEndpoint,
           trainingProfile 
        });
        addLayer(imageUrl, `Mat: ${name}`, BlendMode.OVERLAY, materialPrompt);
        logAction('generation', `Created material: ${name}`);
     } catch(err:any) {
        setError(err.message);
     } finally {
        setIsGenerating(false);
     }
  };

  // Implements both "Transform" and "Compose New" logic
  const handleAiAction = async (actionPrompt: string, strength: number = 0.75, asNewLayer: boolean) => {
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer || !layer.data) return;
    if (!(await checkProAuth())) return;

    setIsGenerating(true);
    try {
       // Save the prompt to the layer history
       updateLayer(layer.id, { actionPrompt });

       const usedModel = model === ModelType.CUSTOM ? ModelType.CUSTOM : ModelType.PRO;

       const newImageUrl = await generateImageWithGemini({
          prompt: actionPrompt,
          model: usedModel,
          inputImage: layer.data,
          aspectRatio: '1:1',
          strength, 
          customEndpoint,
          trainingProfile
       });
       
       if (asNewLayer) {
         // Create Composition Layer
         addLayer(newImageUrl, `Comp: ${actionPrompt.slice(0, 10)}...`, BlendMode.NORMAL, actionPrompt);
       } else {
         // Transform In Place
         updateLayer(layer.id, { data: newImageUrl });
         const newFilter: Filter = {
            id: generateId(),
            type: 'ai-style',
            value: Math.round(strength * 100),
            label: `${actionPrompt.slice(0, 15)}...`
         };
         updateLayer(layer.id, { filters: [...layer.filters, newFilter] });
       }
       logAction('edit', `AI Transform: ${actionPrompt}`);

    } catch(err:any) {
       setError(err.message);
    } finally {
       setIsGenerating(false);
    }
  };

  const handleSmartRepair = async (useRecursive: boolean): Promise<string> => {
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer || !layer.data) return "No layer selected";
    if (!(await checkProAuth())) return "Auth failed";
    
    // Step 1: Analyze
    const analysisPrompt = await analyzeImage(layer.data);
    
    // Step 2: Repair (1st Pass)
    setIsGenerating(true);
    try {
      const repairStrength = 0.65; // Balanced for repair
      const repairedImage = await generateImageWithGemini({
         prompt: analysisPrompt,
         model: ModelType.PRO, // Use Pro for best restoration
         inputImage: layer.data,
         aspectRatio: '1:1',
         strength: repairStrength,
         trainingProfile // Apply training profile even to repairs to match style
      });

      // Update Layer with 1st Pass
      updateLayer(layer.id, { 
        data: repairedImage,
        actionPrompt: analysisPrompt
      });

      // Step 3: Recursive Pass (Optional)
      if (useRecursive) {
         // Recursive: Analyze the *new* image again to see if it needs more refinement
         const secondAnalysis = await analyzeImage(repairedImage);
         const secondPassImage = await generateImageWithGemini({
             prompt: secondAnalysis,
             model: ModelType.PRO,
             inputImage: repairedImage,
             aspectRatio: '1:1',
             strength: 0.5, // Lower strength for refinement
             trainingProfile
         });
         updateLayer(layer.id, { 
            data: secondPassImage,
            actionPrompt: secondAnalysis
         });
         return secondAnalysis;
      }
      
      logAction('edit', `Smart Repair performed`);
      return analysisPrompt;
    } catch (e: any) {
      setError(e.message);
      return "Repair failed";
    } finally {
      setIsGenerating(false);
    }
  };

  // --- CHAT SYSTEM ---
  
  const handleChatToolCall = async (toolName: string, args: any) => {
    switch (toolName) {
      case 'generate_image':
        await handleGenerate(args.prompt);
        return "Generated new layer with image.";
      
      case 'update_layer':
        if (selectedLayerId) {
          updateLayer(selectedLayerId, args);
          return "Updated layer properties.";
        }
        return "No layer selected to update.";
        
      case 'apply_filter':
        if (selectedLayerId) {
          const newFilter: Filter = {
            id: generateId(),
            type: args.filterType,
            value: args.value,
            label: args.filterType
          };
          const layer = layers.find(l => l.id === selectedLayerId);
          if (layer) {
            updateLayer(selectedLayerId, { filters: [...layer.filters, newFilter] });
            return `Applied ${args.filterType} filter.`;
          }
        }
        return "No layer selected.";
        
      default:
        return "Unknown tool.";
    }
  };

  const handleSendMessage = async (text: string, useSearch: boolean) => {
    const newUserMsg: ChatMessage = { id: generateId(), role: 'user', text, timestamp: Date.now() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsChatProcessing(true);
    logAction('chat', useSearch ? 'Asked Expert Question' : 'Sent AI Command');

    try {
      // Build context string about current state
      const contextStr = layers.map((l, i) => 
        `Layer ${i}: ${l.name} (ID: ${l.id}, Visible: ${l.visible}, Opacity: ${l.opacity}%)`
      ).join('\n') + `\nSelected Layer ID: ${selectedLayerId || 'None'}`;

      // Format history for API
      const history = chatMessages.map(m => ({
         role: m.role,
         parts: [{ text: m.text }]
      }));

      // --- SEND TO SERVICE ---
      const { text: responseText, toolCalls, groundingChunks } = await sendChatMessage(
         text, history, contextStr, trainingProfile, useSearch
      );
      
      let finalResponse = responseText;

      // Execute App Control Tools if any (and if not in Search mode technically, but service handles it)
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
           const result = await handleChatToolCall(call.name, call.args);
           if (!finalResponse) finalResponse = result;
           else finalResponse += `\n[Action: ${result}]`;
        }
      }

      if (!finalResponse && toolCalls?.length) {
         finalResponse = "Done.";
      }

      const newBotMsg: ChatMessage = { 
         id: generateId(), 
         role: 'model', 
         text: finalResponse, 
         timestamp: Date.now(),
         groundingChunks: groundingChunks // Attach citations
      };
      setChatMessages(prev => [...prev, newBotMsg]);

    } catch (err: any) {
      const errorMsg: ChatMessage = { id: generateId(), role: 'model', text: `Error: ${err.message}`, timestamp: Date.now() };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
     if (canvasRef.current) {
        exportCanvasAs(canvasRef.current, format);
     }
  };

  // --- UI HANDLERS ---

  const handleMenuAction = (action: string) => {
    switch(action) {
      case 'file-new': setLayers([]); break;
      case 'file-export-png': handleExport('png'); break;
      case 'file-export-jpg': handleExport('jpeg'); break;
      case 'file-export-bmp': handleExport('bmp'); break;
      case 'file-export-gif': handleExport('gif'); break;
      case 'file-export-raw': handleExport('raw'); break;
      case 'file-exit': window.location.reload(); break;
      case 'edit-clear': setLayers([]); break;
      case 'edit-delete-layer': if (selectedLayerId) deleteLayer(selectedLayerId); break;
      case 'module-flash': setModel(ModelType.FAST); break;
      case 'module-pro': setModel(ModelType.PRO); break;
      case 'module-custom': setModel(ModelType.CUSTOM); setShowSettingsModal(true); break;
      case 'module-training': setActiveTab('training'); break;
      case 'action-merge': mergeLayers(); break;
      case 'action-material': setActiveTab('filters'); break; 
      case 'action-ai-filter': setActiveTab('filters'); break;
      case 'help-about': setShowHelpModal(true); break;
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  return (
    <div className="h-screen bg-dark-bg text-slate-200 font-sans flex flex-col overflow-hidden">
      
      {/* 1. Menu Bar */}
      <MenuBar onAction={handleMenuAction} />

      {/* 2. Toolbar / Header */}
      <div className="h-12 border-b border-dark-border bg-dark-surface flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-sm tracking-wide">DIFFUSION STUDIO</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">v{APP_VERSION}</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
             <Cpu className="w-3 h-3" />
             <span>Model: {MODELS.find(m => m.id === model)?.label}</span>
          </div>
          {trainingProfile.autoApply && (
             <div className="text-[9px] flex items-center gap-1 text-teal-400 bg-teal-900/20 px-2 py-0.5 rounded border border-teal-800/50">
                <BrainCircuit className="w-3 h-3" /> Neural Context Active
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowSettingsModal(true)}
             className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
             title="Settings"
           >
             <Settings className="w-4 h-4" />
           </button>
           <Button 
             variant="primary" 
             className="!py-1 !px-3 !text-xs"
             onClick={() => handleMenuAction('file-export-png')}
             icon={<Download className="w-3 h-3" />}
           >
              Export
           </Button>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Tools & Properties */}
        <div className="w-80 bg-[#161f32] border-r border-dark-border flex flex-col shrink-0 z-10">
           <div className="flex border-b border-dark-border">
              <button 
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'generate' ? 'text-brand-400 border-b-2 border-brand-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Create
              </button>
              <button 
                onClick={() => setActiveTab('filters')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'filters' ? 'text-brand-400 border-b-2 border-brand-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Properties
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'chat' ? 'text-brand-400 border-b-2 border-brand-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Assistant
              </button>
              <button 
                onClick={() => setActiveTab('training')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'training' ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
                title="AI Training"
              >
                <BrainCircuit className="w-4 h-4 mx-auto" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
             {activeTab === 'generate' && (
               <div className="space-y-5 animate-in slide-in-from-left-2 duration-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Prompt</label>
                       <button 
                         onClick={handlePromptAnalysis}
                         disabled={!prompt.trim() || isAnalyzingPrompt}
                         className="flex items-center gap-1 text-[9px] text-brand-400 hover:text-brand-300 disabled:opacity-50"
                       >
                          {isAnalyzingPrompt ? (
                             <span className="animate-spin">⟳</span>
                          ) : (
                             <Languages className="w-3 h-3" />
                          )}
                          Analyze
                       </button>
                    </div>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="What would you like to create?"
                      className="w-full h-24 bg-dark-bg border border-dark-border rounded p-3 text-xs focus:border-brand-500 outline-none resize-none placeholder-slate-600"
                    />

                    {/* PROMPT ANALYSIS RESULT */}
                    {promptAnalysis && (
                       <div className="bg-slate-800/80 border border-slate-700 rounded p-2 animate-in fade-in slide-in-from-top-1">
                          <div className="flex justify-between items-start mb-1">
                             <div className="text-[10px] text-slate-300">
                                Language: <span className="font-bold text-brand-300">{promptAnalysis.language}</span>
                             </div>
                             {promptAnalysis.language !== 'English' && (
                                <button 
                                  onClick={() => setPrompt(promptAnalysis.translatedPrompt)}
                                  className="text-[9px] bg-brand-900/50 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30 hover:bg-brand-900 flex items-center gap-1"
                                >
                                  <Check className="w-2.5 h-2.5" /> Use Translated
                                </button>
                             )}
                          </div>
                          {promptAnalysis.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                               {promptAnalysis.keywords.map((kw, i) => (
                                  <span key={i} className="text-[9px] bg-slate-900 px-1.5 rounded text-slate-400 border border-slate-700">
                                     {kw}
                                  </span>
                               ))}
                            </div>
                          )}
                       </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Negative Prompt</label>
                    <input 
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="blur, low quality..."
                      className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs focus:border-brand-500 outline-none placeholder-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Aspect Ratio</label>
                        <select 
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                          className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-xs outline-none"
                        >
                          {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Active Model</label>
                        <select 
                          value={model}
                          onChange={(e) => setModel(e.target.value as ModelType)}
                          className="w-full bg-dark-bg border border-dark-border rounded p-1.5 text-xs outline-none"
                        >
                          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button 
                      variant="primary" 
                      className="!py-3" 
                      onClick={() => handleGenerate()} 
                      isLoading={isGenerating}
                      disabled={!prompt.trim()}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Gen Layer
                    </Button>
                    
                    <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       ref={fileInputRef}
                       onChange={handleFileUpload}
                    />
                    <Button 
                       variant="secondary"
                       className="!py-3"
                       onClick={() => fileInputRef.current?.click()}
                       icon={<Upload className="w-4 h-4" />}
                    >
                       Upload
                    </Button>
                  </div>

                  {error && (
                    <div className="text-[10px] text-red-300 p-2 bg-red-900/30 rounded border border-red-500/30">
                      Error: {error}
                    </div>
                  )}
               </div>
             )}

             {activeTab === 'filters' && (
               <PropertyPanel 
                 selectedLayer={selectedLayer}
                 onAddFilter={(f) => updateLayer(selectedLayer!.id, { filters: [...selectedLayer!.filters, f] })}
                 onRemoveFilter={(fid) => updateLayer(selectedLayer!.id, { filters: selectedLayer!.filters.filter(f => f.id !== fid) })}
                 onUpdateFilter={(fid, val) => updateLayer(selectedLayer!.id, { filters: selectedLayer!.filters.map(f => f.id === fid ? { ...f, value: val } : f) })}
                 onGenerateMaterial={handleGenerateMaterial}
                 onApplyAiFilter={handleAiAction}
                 onUpdateLayerOpacity={(op) => updateLayer(selectedLayer!.id, { opacity: op })}
                 onUpdateLayerPrompt={(p) => updateLayer(selectedLayer!.id, { actionPrompt: p })}
                 onSmartRepair={handleSmartRepair}
               />
             )}

             {activeTab === 'chat' && (
                <ChatPanel 
                   messages={chatMessages}
                   onSendMessage={handleSendMessage}
                   isProcessing={isChatProcessing}
                />
             )}

             {activeTab === 'training' && (
               <TrainingModule 
                 profile={trainingProfile}
                 onSave={saveTrainingProfile}
                 actionLogs={actionLogs}
               />
             )}
           </div>
        </div>

        {/* CENTER: Canvas Workspace */}
        <div className="flex-1 bg-[#0f172a] relative flex flex-col min-w-0">
           
           {/* Layer Tabs / Nodes Bar */}
           <LayerTabs 
              layers={layers} 
              selectedLayerId={selectedLayerId} 
              onSelectLayer={setSelectedLayerId} 
           />

           {/* Scrollable Canvas Area */}
           <div className="flex-1 relative flex items-center justify-center p-8 overflow-auto">
             {/* Canvas Container */}
             <div className="relative shadow-2xl border border-slate-800 bg-[#1a1a1a]" style={{ width: 512, height: 512 }}>
                {/* Checkerboard */}
                <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAjyQcRMWP3QAA6e0QAc8xVyoAAAAASUVORK5CYII=')] opacity-10 pointer-events-none"></div>
                
                <canvas 
                  ref={canvasRef}
                  className="w-full h-full relative z-10"
                />
                
                {isGenerating && (
                  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                     <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500 mb-3"></div>
                     <div className="text-xs font-medium tracking-wider animate-pulse">PROCESSING...</div>
                  </div>
                )}
             </div>
             
             <div className="absolute bottom-4 right-4 text-slate-600 text-[10px] font-mono">
               CANVAS: 1024x1024 • PWA ENABLED
             </div>
           </div>
        </div>

        {/* RIGHT PANEL: Layers */}
        <div className="w-64 shrink-0 flex flex-col border-l border-dark-border">
          <LayerManager 
             layers={layers}
             selectedLayerId={selectedLayerId}
             onSelectLayer={(id) => {
                setSelectedLayerId(id);
             }}
             onUpdateLayer={updateLayer}
             onDeleteLayer={deleteLayer}
             onMoveLayer={moveLayer}
          />
        </div>

      </div>

      {/* MODALS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
           <div className="bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <Settings className="w-5 h-5" /> Settings
              </h3>
              
              <div className="space-y-4 mb-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Custom Model API (Stable Diffusion)</label>
                   <p className="text-[10px] text-slate-500 mb-2">Example: http://127.0.0.1:7860/sdapi/v1/txt2img</p>
                   <input 
                     type="text" 
                     value={customEndpoint} 
                     onChange={(e) => setCustomEndpoint(e.target.value)}
                     className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-slate-200 focus:border-brand-500 outline-none"
                   />
                 </div>
              </div>

              <div className="flex justify-end gap-2">
                 <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>Close</Button>
              </div>
           </div>
        </div>
      )}

      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-2">Pro Model Access</h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Gemini Pro 3 requires a paid API key project. Please select a project to continue using high-fidelity features.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={async () => {
                 // @ts-ignore
                 await window.aistudio.openSelectKey();
                 setShowApiKeyModal(false);
              }} variant="primary">
                Select API Key Project
              </Button>
              <Button onClick={() => setShowApiKeyModal(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

    </div>
  );
}

export default App;
