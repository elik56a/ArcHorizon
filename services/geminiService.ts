
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
          floorFinish: { type: Type.STRING, enum: ['tiled', 'wood', 'carpet', 'concrete', 'grass', 'paved'] },
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
      contents: `
      ROLE: Award-Winning Senior Architect & Spatial Designer.
      TASK: Create a High-End, Creative Architectural Blueprint based on: "${prompt}".
      
      DESIGN PHILOSOPHY (CRITICAL):
      1. **ANTI-BOREDOM**: Do NOT create a box with a hallway in the middle. Use L-shapes, U-shapes, or courtyards.
      2. **OPEN PLAN**: Combine Living, Dining, and Kitchen into a cohesive, airy flow. Avoid unnecessary walls.
      3. **NATURAL LIGHT**: Prioritize windows. Every habitable room MUST have windows.
      4. **ZONING**: Separate private areas (Bedrooms) from public areas (Living).
      
      OUTDOOR & PRIVATE HOUSE REQUIREMENTS:
      1. **GARDEN**: If the request implies a house/villa, you MUST generate a room with type 'garden'. It should wrap around or sit adjacent to the living area.
      2. **PARKING**: If requested, generate a 'parking' zone (paved surface) near the entry.
      3. **TERRACES**: Upper floors should have balconies/terraces (type 'balcony') overlooking the garden.
      
      TECHNICAL RULES:
      1. **SCALE**: 1 unit = 1 cm.
      2. **COORDINATES**: Multiples of 10. No gaps between adjacent rooms. Walls must touch.
      3. **ROOM TYPES**: Use specific types: 'garden' (outdoor green), 'parking' (driveway), 'balcony' (outdoor), 'terrace'.
      4. **FLOORING**: 
         - Garden = 'grass'
         - Parking = 'paved'
         - Living = 'wood' or 'tiled'
         - Bedrooms = 'wood' or 'carpet'
      
      MANDATORY ELEMENTS:
      - **WINDOWS**: Place them logically on exterior walls.
      - **DOORS**: Connect rooms. Use 'open' connections for Living/Dining/Kitchen flow.
      - **FURNITURE**: Fully furnish the house. Beds in bedrooms, Sofa/TV in living, Dining Table, Toilets, etc.
      
      OUTPUT FORMAT: Pure JSON matching the schema.
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
            TASK: Digitize this floor plan into a JSON vector format.
            
            RULES:
            1. **OUTDOORS**: If you see a Garden or Patio, create a room with type 'garden' or 'terrace'.
            2. **ACCURACY**: Mimic layout exactly.
            3. **SCALE**: 1 unit = 1 cm.
            4. **CONNECTIVITY**: Ensure rooms share coordinates (walls touch).
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

export const generateSketchFromDXF = async (dxfContent: string): Promise<SketchData> => {
    try {
        const contentSample = dxfContent.length > 500000 ? dxfContent.substring(0, 500000) + "...[TRUNCATED]" : dxfContent;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
            ACT AS: Senior CAD Interoperability Engineer.
            TASK: Convert DXF content to JSON Schema.
            
            INPUT:
            \`\`\`
            ${contentSample}
            \`\`\`
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
        console.error("AI DXF Parsing Error:", error);
        throw error;
    }
}

const getStyleInstruction = (style: DesignStyle): string => {
  switch(style) {
    case 'Modern': return "Style: MODERN MINIMALIST. Flat roofs, boxy volumes, large glass facades, open plan living.";
    case 'Rustic': return "Style: RUSTIC/TRADITIONAL. Pitched roof implication, cozy nooks, distinct room separation, warm flow.";
    case 'Creative': return "Style: AVANT-GARDE. Non-rectangular rooms, angles, dynamic flow, unexpected courtyards.";
    default: return "Standard layout.";
  }
};
