
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  model: string;
  createdAt: number;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export enum ModelType {
  FAST = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview',
  CUSTOM = 'custom-open-source',
}

export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  COLOR_DODGE = 'color-dodge',
  COLOR_BURN = 'color-burn',
  HARD_LIGHT = 'hard-light',
  SOFT_LIGHT = 'soft-light',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion',
  HUE = 'hue',
  SATURATION = 'saturation',
  COLOR = 'color',
  LUMINOSITY = 'luminosity',
}

export type FilterType = 
  | 'blur' 
  | 'contrast' 
  | 'brightness' 
  | 'grayscale' 
  | 'sepia' 
  | 'invert' 
  | 'saturate'
  | 'hue-rotate'
  | 'ai-style'   // AI Transform
  | 'ai-material'; // AI Texture overlay

export interface Filter {
  id: string;
  type: FilterType;
  value: number; // 0-100 or specific range
  label: string;
  aiPrompt?: string; 
}

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'solid' | 'adjustment';
  data: string | null; // Base64 image data
  visible: boolean;
  opacity: number; // 0-100
  blendMode: BlendMode;
  x: number;
  y: number;
  width?: number;
  height?: number;
  filters: Filter[];
  actionPrompt?: string; // Specific prompt for this layer's AI actions
}

export type ChatRole = 'user' | 'model' | 'system';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
  groundingChunks?: GroundingChunk[];
}

export interface ActionLog {
  id: string;
  type: 'generation' | 'edit' | 'chat';
  description: string;
  timestamp: number;
}

export interface PromptAnalysisResult {
  language: string;
  confidence: number;
  translatedPrompt: string; // English translation if not english
  keywords: string[]; // Key subjects/styles identified
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TrainingProfile {
  imaginationRoad: string; // The user's creative philosophy
  preferredStyles: string; // Keywords to boost
  avoidElements: string; // Global negative prompt
  autoApply: boolean; // Whether to inject this into every request
}
