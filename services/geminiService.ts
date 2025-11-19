
import { GoogleGenAI, Type } from "@google/genai";
import { SketchData } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type DesignStyle = 'Modern' | 'Rustic' | 'Creative';

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    totalAreaSqm: { type: Type.NUMBER },
    floors: { type: Type.INTEGER },
    rooms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          floor: { type: Type.INTEGER },
          floorFinish: { type: Type.STRING, enum: ['tiled', 'wood', 'carpet', 'concrete'] },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          type: { type: Type.STRING }
        },
        required: ["id", "name", "width", "height", "x", "y", "type", "floor"]
      }
    },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          to: { type: Type.STRING },
          type: { type: Type.STRING }
        },
        required: ["from", "to", "type"]
      }
    },
    elements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          roomId: { type: Type.STRING },
          floor: { type: Type.INTEGER },
          type: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          rotation: { type: Type.NUMBER }
        },
        required: ["id", "roomId", "type", "x", "y", "width", "height", "rotation", "floor"]
      }
    }
  },
  required: ["id", "title", "description", "totalAreaSqm", "floors", "rooms", "elements"]
};

export const generateSingleSketch = async (prompt: string, style: DesignStyle): Promise<SketchData> => {
  try {
    const stylePrompt = getStyleInstruction(style);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Senior Lead Architect creating a Professional CAD Layout.
      Request: "${prompt}".
      
      DESIGN STYLE: ${stylePrompt}
      
      CRITICAL PROFESSIONAL RULES (STRICT):
      1. **SCALE**: 1 unit = 1 cm.
      2. **PRECISION**: All coordinates must be multiples of 10.
      3. **WALLS**: Rooms must physically touch. Shared walls are required. NO GAPS.
      4. **FLOORING**: Assign 'floorFinish' (tiled, wood, carpet) based on room type.
      
      MANDATORY ARCHITECTURAL FEATURES:
      1. **WINDOWS**: EVERY Bedroom, Living Room, Dining Room, and Kitchen MUST have at least one 'window' element.
         - Place windows on exterior walls.
         - Windows must be aligned with the wall.
      2. **DOORS**: Connect rooms logically.
      
      STRICT FURNITURE CONTAINMENT:
      1. Furniture MUST be inside room boundaries.
      2. **ATTACHED**: Wardrobes, Kitchen Counters, Toilets must touch walls.
      
      ELEMENT TYPES (Use Specifics):
      - 'window' (REQUIRED for external rooms)
      - 'door', 'entry_door'
      - 'toilet', 'sink', 'shower', 'bathtub' (Bathrooms)
      - 'bed_king', 'bed_single', 'wardrobe', 'desk' (Bedrooms)
      - 'sofa', 'dining_table', 'stove', 'sink' (Living/Kitchen)
      - 'stairs_up' (for multi-floor)
      
      MATHEMATICAL CONSTRAINTS:
      - Doors/Windows must be positioned ON the wall lines (x = room.x or x = room.x + width, etc).
      
      OUTPUT FORMAT: JSON ONLY.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as SketchData;
  } catch (error) {
    console.error(`AI Generation Error (${style}):`, error);
    throw error;
  }
};

export const generateSketchFromImage = async (base64Data: string, mimeType: string): Promise<SketchData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `
            ACT AS: Computer Vision Architect Specialist.
            TASK: Analyze this floor plan image/document and convert it into a precise JSON vector representation.
            
            CRITICAL DIGITIZATION RULES:
            1. **ACCURACY IS PARAMOUNT**: Mimic the layout exactly. Retain the relative scale, aspect ratios, and positions of rooms.
            2. **TOPOLOGY**: If room A is next to room B in the image, they MUST share a coordinate wall in the JSON.
            3. **SCALE**: Assume reasonable residential dimensions if not labeled (e.g., Bedrooms ~300-400cm width). 1 unit = 1 cm.
            4. **COMPLETENESS**: Extract ALL visible furniture (beds, sofas, toilets, sinks) and architectural elements (windows, doors).
            
            INTERPRETATION GUIDE:
            - Look for thin lines indicating windows on walls.
            - Look for arcs indicating door swings.
            - Identify room labels (Bedroom, Kitchen, etc.) to name rooms correctly.
            - If the image contains multiple floors, separate them logically by 'floor' index.
            
            OUTPUT:
            - Return a clean, valid JSON object matching the schema provided.
            - Ensure 'rooms' cover the entire floor plate without unexplained gaps.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as SketchData;
  } catch (error) {
    console.error("AI Vision Error:", error);
    throw error;
  }
};

const getStyleInstruction = (style: DesignStyle): string => {
  switch(style) {
    case 'Modern': return "Style: MODERN. Open plan, large windows, efficient flow.";
    case 'Rustic': return "Style: RUSTIC. Defined cozy spaces, thick walls, classic layout.";
    case 'Creative': return "Style: CREATIVE. Unique angles, interesting flow, non-standard shapes.";
    default: return "Standard layout.";
  }
};
