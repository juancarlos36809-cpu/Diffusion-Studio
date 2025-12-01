
import { GoogleGenAI, FunctionDeclaration, Type, SchemaType } from "@google/genai";
import { ModelType, AspectRatio, PromptAnalysisResult, TrainingProfile, GroundingChunk } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  model: ModelType;
  inputImage?: string; // Base64 data for img2img / filters
  strength?: number; // 0-1 (Denoising strength for img2img)
  customEndpoint?: string; // For Stable Diffusion
  trainingProfile?: TrainingProfile;
}

export const generateImageWithGemini = async ({
  prompt,
  negativePrompt,
  aspectRatio = '1:1',
  model,
  inputImage,
  strength = 0.75,
  customEndpoint,
  trainingProfile
}: GenerateImageParams): Promise<string> => {
  
  // Construct full prompt with Training Context
  let fullPrompt = prompt;
  let finalNegative = negativePrompt || "";

  // Inject Training Profile (Personalization)
  if (trainingProfile && trainingProfile.autoApply) {
     if (trainingProfile.imaginationRoad) {
        fullPrompt += `. (Creative Context: ${trainingProfile.imaginationRoad})`;
     }
     if (trainingProfile.preferredStyles) {
        fullPrompt += `, ${trainingProfile.preferredStyles}`;
     }
     if (trainingProfile.avoidElements) {
        finalNegative += ` ${trainingProfile.avoidElements}`;
     }
  }

  if (finalNegative.trim()) {
    fullPrompt += ` --no ${finalNegative.trim()}`; 
  }

  // --- STABLE DIFFUSION / EXTERNAL MODEL HANDLER ---
  if (model === ModelType.CUSTOM) {
    if (!customEndpoint) {
      throw new Error("Custom Endpoint URL is required for Open Source models.");
    }
    
    try {
      const isImg2Img = !!inputImage;
      // Heuristic to switch endpoint if user provides base URL but we need img2img
      let endpoint = customEndpoint;
      if (isImg2Img && !endpoint.includes('img2img') && endpoint.includes('txt2img')) {
        endpoint = endpoint.replace('txt2img', 'img2img');
      }

      const payload: any = {
        prompt: fullPrompt,
        negative_prompt: finalNegative,
        steps: 25,
        width: aspectRatio === '1:1' ? 512 : (aspectRatio === '16:9' ? 768 : 512),
        height: aspectRatio === '1:1' ? 512 : (aspectRatio === '16:9' ? 512 : 768),
      };

      if (isImg2Img && inputImage) {
        // A1111 expects "init_images": ["base64..."] without header
        const base64Clean = inputImage.split(',')[1] || inputImage;
        payload.init_images = [base64Clean];
        // strength 0 = no change, 1 = full change.
        // A1111 uses denoising_strength
        payload.denoising_strength = strength; 
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`External API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.images && data.images[0]) {
        return `data:image/png;base64,${data.images[0]}`;
      }
      throw new Error("Invalid response from external API");

    } catch (error) {
      console.error("External Model Error:", error);
      throw error;
    }
  }

  // --- GEMINI HANDLER ---
  const ai = getAiClient();
  const config: any = {
    imageConfig: {
      aspectRatio: aspectRatio,
    }
  };

  // V3 Pro supports sizes
  if (model === ModelType.PRO) {
    config.imageConfig.imageSize = "1K";
  }

  try {
    let response;

    // IF INPUT IMAGE IS PRESENT (Image-to-Image / Filter)
    if (inputImage) {
      const base64Data = inputImage.split(',')[1];
      const mimeType = inputImage.split(';')[0].split(':')[1] || 'image/png';

      response = await ai.models.generateContent({
        model: ModelType.PRO, // Always use Pro for image editing if possible
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: fullPrompt }
          ],
        },
      });

    } else {
      // TEXT TO IMAGE
      response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: config,
      });
    }

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeImage = async (base64Image: string): Promise<string> => {
  const ai = getAiClient();
  // Using Flash for fast vision analysis
  const model = 'gemini-2.5-flash';
  
  try {
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: "Act as a professional photo restorer. Analyze this image for defects (noise, blur, scratches, color cast, low resolution). Output a concise, comma-separated list of positive prompt keywords to repair and enhance this image. Do not describe the content, only the visual qualities to improve (e.g. 'denoise, sharpen details, color correct, remove scratches, 4k quality')." }
            ]
        }
    });

    return response.text?.trim() || "high quality, sharp focus, denoised, color corrected";
  } catch (error) {
    console.error("Analysis failed:", error);
    return "high quality, restored image";
  }
};

export const analyzePrompt = async (text: string): Promise<PromptAnalysisResult> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ text: `Analyze the following text prompt for an image generator. 
                Identify the language. 
                Identify key visual concepts (keywords).
                If the language is not English, provide a high-quality English translation optimized for image generation.
                If it is English, just return the original.
                
                Text: "${text}"
                
                Return JSON format: { "language": "string", "translatedPrompt": "string", "keywords": ["string"], "confidence": number }` }]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        language: { type: Type.STRING },
                        translatedPrompt: { type: Type.STRING },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        confidence: { type: Type.NUMBER }
                    }
                }
            }
        });
        
        const jsonText = response.text || "{}";
        const result = JSON.parse(jsonText);
        
        return {
            language: result.language || "Unknown",
            translatedPrompt: result.translatedPrompt || text,
            keywords: result.keywords || [],
            confidence: result.confidence || 0,
            sentiment: 'neutral'
        };
    } catch (e) {
        console.error("Prompt analysis failed", e);
        return {
            language: "Unknown",
            translatedPrompt: text,
            keywords: [],
            confidence: 0,
            sentiment: "neutral"
        };
    }
};

// --- CHAT WITH TOOLS ---

const toolDefinitions: FunctionDeclaration[] = [
  {
    name: "generate_image",
    description: "Generate a new image layer from a text prompt",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: "The image description" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "update_layer",
    description: "Update the currently selected layer's properties",
    parameters: {
      type: Type.OBJECT,
      properties: {
        opacity: { type: Type.NUMBER, description: "Opacity from 0 to 100" },
        visible: { type: Type.BOOLEAN, description: "Layer visibility" },
        blendMode: { type: Type.STRING, description: "Blend mode (normal, multiply, screen, overlay, etc)" }
      }
    }
  },
  {
    name: "apply_filter",
    description: "Apply a standard image filter to the current layer",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filterType: { type: Type.STRING, enum: ["blur", "contrast", "brightness", "sepia", "grayscale", "invert"] },
        value: { type: Type.NUMBER, description: "Filter intensity value" }
      },
      required: ["filterType", "value"]
    }
  }
];

export const sendChatMessage = async (
  message: string, 
  history: any[], 
  contextStr: string,
  trainingProfile?: TrainingProfile,
  useSearch: boolean = false
): Promise<{ text: string, toolCalls?: any[], groundingChunks?: GroundingChunk[] }> => {
  const ai = getAiClient();
  
  let userContext = "";
  if (trainingProfile && trainingProfile.autoApply) {
    userContext = `
    USER PERSONALIZATION MODULE (Training Data):
    - Imagination Road: "${trainingProfile.imaginationRoad}"
    - Styles: "${trainingProfile.preferredStyles}"
    - Dislikes: "${trainingProfile.avoidElements}"
    `;
  }

  // Dual System Instructions
  let systemInstruction = "";
  let tools: any[] = [];

  if (useSearch) {
    systemInstruction = `You are an expert Art & Photography Tutor for Diffusion Studio. 
    The user is asking for knowledge, history, or technical advice about art/photography.
    Use Google Search to find accurate, up-to-date answers if needed.
    Do NOT attempt to control the app interface (do not use layer tools).
    ${userContext}
    Provide helpful, educational responses.`;
    
    // Enable Google Search Tool
    tools = [{ googleSearch: {} }];

  } else {
    systemInstruction = `You are the AI Assistant for 'Diffusion Studio', a layer-based image editor.
    You can execute actions to control the app.
    ${userContext}
    CURRENT APP STATE (Layers):
    ${contextStr}
    If the user asks to generate an image, call 'generate_image'.
    If the user wants to change opacity/visibility/blend of active layer, call 'update_layer'.
    If the user wants a filter, call 'apply_filter'.
    Be helpful and concise.`;
    
    // Enable App Control Tools
    tools = [{ functionDeclarations: toolDefinitions }];
  }

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      tools: tools
    },
    history: history
  });

  const result = await chat.sendMessage({ message });
  
  const text = result.text || "";
  const toolCalls = result.functionCalls;
  
  // Extract Grounding Chunks if present (for search results)
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

  return { text, toolCalls, groundingChunks };
};
