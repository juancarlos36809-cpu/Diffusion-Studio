
import { AspectRatio, ModelType, BlendMode, FilterType } from './types';

export const APP_VERSION = '1.1.0';

export const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '1:1', label: 'Square (1:1)', icon: 'square' },
  { value: '16:9', label: 'Landscape (16:9)', icon: 'rectangle-horizontal' },
  { value: '9:16', label: 'Portrait (9:16)', icon: 'rectangle-vertical' },
  { value: '4:3', label: 'Classic (4:3)', icon: 'monitor' },
  { value: '3:4', label: 'Book (3:4)', icon: 'book' },
];

export const MODELS = [
  { 
    id: ModelType.FAST, 
    label: 'Gemini Flash 2.5', 
    description: 'Fast, versatile, standard quality.' 
  },
  { 
    id: ModelType.PRO, 
    label: 'Gemini Pro V3', 
    description: 'High fidelity, best for materials & lighting.' 
  },
  { 
    id: ModelType.CUSTOM, 
    label: 'Stable Diffusion (Local/Custom)', 
    description: 'Connect to external API (e.g. A1111).' 
  },
];

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: BlendMode.NORMAL, label: 'Normal' },
  { value: BlendMode.MULTIPLY, label: 'Multiply' },
  { value: BlendMode.SCREEN, label: 'Screen' },
  { value: BlendMode.OVERLAY, label: 'Overlay' },
  { value: BlendMode.SOFT_LIGHT, label: 'Soft Light' },
  { value: BlendMode.HARD_LIGHT, label: 'Hard Light' },
  { value: BlendMode.COLOR_DODGE, label: 'Color Dodge' },
  { value: BlendMode.COLOR_BURN, label: 'Color Burn' },
  { value: BlendMode.DIFFERENCE, label: 'Difference' },
  { value: BlendMode.EXCLUSION, label: 'Exclusion' },
];

export const STANDARD_FILTERS: { type: FilterType; label: string; min: number; max: number; default: number; unit: string }[] = [
  { type: 'blur', label: 'Blur', min: 0, max: 20, default: 0, unit: 'px' },
  { type: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100, unit: '%' },
  { type: 'brightness', label: 'Brightness', min: 0, max: 200, default: 100, unit: '%' },
  { type: 'grayscale', label: 'Black & White', min: 0, max: 100, default: 0, unit: '%' },
  { type: 'sepia', label: 'Sepia', min: 0, max: 100, default: 0, unit: '%' },
  { type: 'saturate', label: 'Saturation', min: 0, max: 200, default: 100, unit: '%' },
  { type: 'hue-rotate', label: 'Hue', min: 0, max: 360, default: 0, unit: 'deg' },
  { type: 'invert', label: 'Invert', min: 0, max: 100, default: 0, unit: '%' },
];

export const AI_MATERIALS = [
  { id: 'marble', label: 'White Marble', prompt: 'seamless white marble texture, high detail, polished stone' },
  { id: 'granite', label: 'Granite', prompt: 'seamless black granite stone texture, speckled' },
  { id: 'gold', label: 'Metallic Gold', prompt: 'seamless brushed gold metal texture, shiny, reflection' },
  { id: 'rust', label: 'Rusted Metal', prompt: 'seamless rusted iron texture, corrosion, orange and brown' },
  { id: 'wood', label: 'Dark Wood', prompt: 'seamless dark oak wood grain texture, polished' },
  { id: 'crackle', label: 'Crackle Paint', prompt: 'seamless crackle paint texture, old wall, peeling paint' },
  { id: 'fabric', label: 'Canvas Fabric', prompt: 'seamless rough canvas fabric texture, beige' },
  { id: 'carbon', label: 'Carbon Fiber', prompt: 'seamless carbon fiber texture, black pattern' },
  { id: 'glass', label: 'Crystal / Glass', prompt: 'seamless crystal glass texture, refraction, geometric' },
  { id: 'noise', label: 'Digital Noise', prompt: 'grayscale static noise texture, film grain, seamless' },
];

export const AI_STYLES = [
  { id: 'smudge', label: 'Smudge / Oil', prompt: 'transform into an oil painting with heavy smudging and brush strokes' },
  { id: 'sketch', label: 'Carbon Pencil', prompt: 'transform into a rough charcoal pencil sketch, black on white paper' },
  { id: 'radiosity', label: 'Radiosity', prompt: 'add strong global illumination, soft bounced light, radiosity rendering style' },
  { id: 'caustics', label: 'Caustics', prompt: 'add underwater caustic lighting effects, light refraction patterns' },
  { id: 'old-sepia', label: 'Old Sepia', prompt: 'transform into a damaged vintage photograph, scratches, dust, sepia tone' },
  { id: 'burn', label: 'Burn / Scorch', prompt: 'add burnt edges, scorching marks, fire damage effect' },
  { id: 'crackle-eff', label: 'Crackle Effect', prompt: 'add heavy surface cracking, dried earth texture overlay' },
  { id: 'bw', label: 'Noir B&W', prompt: 'transform into film noir style, high contrast black and white' },
];

export const HELP_CONTENT = [
  {
    title: "Getting Started",
    content: "Diffusion Studio is a layer-based AI image editor. \n\n1. **Generate**: Use the prompt box to create new image layers.\n2. **Upload**: Import your own images using the 'Plus' icon in the layer panel.\n3. **Compose**: Stack layers and use Blend Modes to mix them."
  },
  {
    title: "Layers & Composition",
    content: "• **Visibility**: Click the eye icon to toggle visibility.\n• **Blend Modes**: Change how a layer interacts with layers below it (e.g., Multiply, Screen, Overlay).\n• **Opacity**: Adjust transparency for subtle effects.\n• **Order**: Drag and drop or use arrow keys to reorder layers (Order determines what is on top)."
  },
  {
    title: "AI Models",
    content: "• **Gemini Flash**: Fast, good for textures and quick iterations.\n• **Gemini Pro**: High fidelity, understands complex prompts and lighting.\n• **Stable Diffusion (Custom)**: Connect to a local A1111 instance or external API for open-source model control."
  },
  {
    title: "Image Transitions & Styles",
    content: "Use the **Properties** panel to apply effects:\n\n• **Standard Filters**: Real-time adjustments like Blur, Contrast, Hue.\n• **AI Style Transform**: Uses 'Image-to-Image' to rewrite the layer based on a style prompt. Use the 'Strength' slider to control how much the original image is preserved (Low = Subtle, High = Total Change).\n• **Materials**: Generates texture overlays (like grunge or paper) to blend on top of your artwork."
  },
  {
    title: "Installation",
    content: "To install as a standalone app on PC/Mac:\n1. Open in Chrome/Edge.\n2. Click the 'Install' icon in the address bar (or Three Dots > Install Diffusion Studio).\n3. The app will launch in its own window."
  }
];